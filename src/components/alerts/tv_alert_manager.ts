import { IOrderLine } from "@/types/tradingview";
import { Alert } from "@/types/supabase";
import { deleteAlert, queryAlerts } from "@/lib/api";

interface OrderLineRef {
  alertId: string;
  orderLine: IOrderLine;
  symbol: string;
}

class TradingViewAlertsManager {
  private orderLinesRef: OrderLineRef[] = [];
  private currentSymbol: string = "";
  private alerts: Alert[] = [];
  private symbolSubscription: (() => void) | null = null;
  private alertsInterval: number | null = null;
  private isInitialized = false;

  public async initialize() {
    if (this.isInitialized) return;

    try {
      // Wait for TradingView API to be available
      if (!TradingViewApi) {
        console.warn("TradingView API not available");
        return;
      }

      this.isInitialized = true;

      // Get initial symbol
      this.currentSymbol = TradingViewApi.getSymbolInterval().symbol;

      // Setup symbol change listener
      this.setupSymbolListener();

      // Start alerts polling
      this.startAlertsPolling();

      console.log("TradingView Alerts Manager initialized");
    } catch (error) {
      console.error("Failed to initialize TradingView Alerts Manager:", error);
    }
  }

  private setupSymbolListener() {
    try {
      const chart = TradingViewApi.chart();
      const subscription = chart.onSymbolChanged();

      const callback = (resolvedSymbol: any) => {
        const newSymbol = resolvedSymbol.pro_name || resolvedSymbol.name;
        if (newSymbol && newSymbol !== this.currentSymbol) {
          this.onSymbolChange(newSymbol);
        }
      };

      subscription.subscribe("alerts-manager", callback);

      this.symbolSubscription = () => {
        subscription.unsubscribe(callback);
      };
    } catch (error) {
      console.error("Failed to setup symbol listener:", error);
    }
  }

  private startAlertsPolling() {
    // Fetch alerts immediately
    void this.fetchAlerts();

    // Poll every 3 seconds
    this.alertsInterval = window.setInterval(() => {
      void this.fetchAlerts();
    }, 10000);
  }

  private async fetchAlerts() {
    try {
      // Fetch alerts from your API endpoint
      const { data, error } = await queryAlerts();

      // Update alerts and orderlines if they changed
      if (
        data &&
        !error &&
        JSON.stringify(data) !== JSON.stringify(this.alerts)
      ) {
        this.alerts = data;
        void this.updateOrderLines();
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    }
  }

  private onSymbolChange(newSymbol: string) {
    console.log("Symbol changed from", this.currentSymbol, "to", newSymbol);

    // Remove orderlines that don't match the new symbol
    this.orderLinesRef = this.orderLinesRef.filter(({ symbol, orderLine }) => {
      if (symbol !== newSymbol) {
        try {
          orderLine.remove();
        } catch (error) {
          console.warn("Failed to remove orderline on symbol change:", error);
        }
        return false;
      }
      return true;
    });

    this.currentSymbol = newSymbol;
    void this.updateOrderLines();
  }

  private cleanupAllOrderLines() {
    this.orderLinesRef.forEach(({ orderLine }) => {
      try {
        orderLine.remove();
      } catch (error) {
        console.warn("Failed to remove orderline:", error);
      }
    });
    this.orderLinesRef = [];
  }

  private async updateOrderLines() {
    if (!TradingViewApi || !this.currentSymbol) return;

    try {
      const chart = TradingViewApi.chart();

      // Filter alerts for current symbol and only price alerts
      const currentSymbolAlerts = this.alerts.filter((alert) => {
        // Check if alert is for current symbol
        if (alert.symbol !== this.currentSymbol) return false;

        // Only process price alerts - check if rhs_attr.constant exists
        const price = (alert.rhs_attr as Record<string, number>)?.["constant"];
        return typeof price === "number" && !isNaN(price);
      });

      // Get existing orderline alert IDs for current symbol
      const existingAlertIds = new Set(
        this.orderLinesRef
          .filter((ref) => ref.symbol === this.currentSymbol)
          .map((ref) => ref.alertId),
      );

      // Remove orderlines for alerts that no longer exist
      this.orderLinesRef = this.orderLinesRef.filter(
        ({ alertId, orderLine, symbol }) => {
          const alertExists = currentSymbolAlerts.some(
            (alert) => alert.id === alertId,
          );
          if (!alertExists && symbol === this.currentSymbol) {
            try {
              orderLine.remove();
            } catch (error) {
              console.warn("Failed to remove obsolete orderline:", error);
            }
            return false;
          }
          return true;
        },
      );

      // Create orderlines for new alerts
      for (const alert of currentSymbolAlerts) {
        if (!existingAlertIds.has(alert.id)) {
          await this.createOrderLineForAlert(alert, chart);
        }
      }
    } catch (error) {
      console.error("Failed to update orderlines:", error);
    }
  }

  private async createOrderLineForAlert(alert: Alert, chart: any) {
    try {
      // Extract price from rhs_attr.constant
      const price = (alert.rhs_attr as Record<string, number>)?.["constant"];

      if (typeof price !== "number" || isNaN(price)) {
        console.warn(`Invalid price for alert ${alert.id}:`, price);
        return;
      }
      const orderLine = await chart.createOrderLine();

      const bg = "#F2C55C";
      const textColor = "#494949";

      orderLine
        .setText(alert.notes ?? `Alert: ${price}`)
        .setPrice(price)
        .setLineColor(bg)
        .setBodyBackgroundColor(bg)
        .setBodyBorderColor(textColor)
        .setBodyTextColor(textColor)
        .setQuantityBackgroundColor(bg)
        .setQuantityTextColor(textColor)
        .setCancelButtonBackgroundColor(bg)
        .setCancelButtonBorderColor(textColor)
        .setCancelButtonIconColor(textColor)
        .setCancelButtonBorderColor(textColor)
        .setQuantityBorderColor(textColor)
        .setLineStyle(2)
        .setExtendLeft(true)
        .setCancelTooltip("Cancel Alert");

      // Handle orderline cancellation
      orderLine.onCancel(() => {
        this.removeOrderLineRef(alert.id);
        console.log(`Alert ${alert.id} cancelled via orderline`);
        // Optionally call your delete alert API here
        deleteAlert(alert.id);
      });

      orderLine.on;

      // Store reference with current symbol
      this.orderLinesRef.push({
        alertId: alert.id,
        orderLine,
        symbol: this.currentSymbol,
      });

      console.log(
        `Created orderline for alert ${alert.id} on ${this.currentSymbol} at price ${price}`,
      );
    } catch (error) {
      console.error(`Failed to create orderline for alert ${alert.id}:`, error);
    }
  }

  private removeOrderLineRef(alertId: string) {
    this.orderLinesRef = this.orderLinesRef.filter(
      (ref) => ref.alertId !== alertId,
    );
  }

  public destroy() {
    // Cleanup method
    this.cleanupAllOrderLines();

    if (this.symbolSubscription) {
      this.symbolSubscription();
      this.symbolSubscription = null;
    }

    if (this.alertsInterval) {
      clearInterval(this.alertsInterval);
      this.alertsInterval = null;
    }

    this.isInitialized = false;
    console.log("TradingView Alerts Manager destroyed");
  }
}

// Auto-initialize the manager
const alertsManager = new TradingViewAlertsManager();

// Export for manual control if needed
export { alertsManager, TradingViewAlertsManager };

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  alertsManager.destroy();
});
