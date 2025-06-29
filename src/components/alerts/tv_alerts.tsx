import { useEffect, useRef, useState } from "react";
import { useSymbol } from "@/hooks/use-symbol";
import { useAlerts, useDeleteAlert, useUpdateAlert } from "@/lib/api";
import { IOrderLine } from "@/types/tradingview";
import { Alert } from "@/types/supabase";
import { AlertBuilder, AlertParams } from "@/components/alerts/alert_builder";

/**
 * Interface for tracking orderline references
 */
interface OrderLineReference {
  alertId: string;
  orderLine: IOrderLine;
  symbol: string;
  alert: Alert;
}

/**
 * TradingView Alerts Component
 *
 * Manages the synchronization between database alerts and TradingView orderlines.
 * Automatically handles symbol changes, alert updates, and orderline lifecycle.
 *
 * This component renders the alert builder modal and manages orderlines as a side effect.
 */
export function TradingViewAlerts() {
  const currentSymbol = useSymbol();
  const { data: alerts = [], isLoading, error } = useAlerts();
  const deleteAlertMutation = useDeleteAlert();
  const updateAlertMutation = useUpdateAlert();

  // Track orderline references without causing re-renders
  const orderLineReferencesRef = useRef<OrderLineReference[]>([]);
  const isInitializedRef = useRef(false);

  // Track crosshair position without causing re-renders
  const crosshairPriceRef = useRef<number | null>(null);

  // Alert builder state
  const [alertBuilderOpen, setAlertBuilderOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | undefined>();
  const [alertParams, setAlertParams] = useState<AlertParams | undefined>();

  /**
   * Initialize TradingView integration and setup symbol listener
   */
  useEffect(() => {
    if (isInitializedRef.current || !currentSymbol) return;

    const initializeTradingView = async () => {
      try {
        if (!TradingViewApi) {
          console.warn("TradingView API not available");
          return;
        }

        // Setup symbol change listener
        setupSymbolChangeListener();

        // Setup crosshair tracking
        const unsubCrossHair = setupCrosshairListener();

        // Setup keyboard shortcuts
        const unsubKeyboardShortcuts = setupKeyboardShortcuts();

        isInitializedRef.current = true;

        console.log("📊 TradingView Alerts component initialized");
        return () => {
          unsubCrossHair?.();
          unsubKeyboardShortcuts?.();
        };
      } catch (error) {
        console.error("Failed to initialize TradingView Alerts:", error);
      }
    };

    void initializeTradingView();
  }, [currentSymbol]);

  /**
   * Setup crosshair movement listener to track current price
   */
  const setupCrosshairListener = () => {
    try {
      const chart = TradingViewApi.chart();
      const cb = (p: { price: number; time: number }) =>
        (crosshairPriceRef.current = Number(p.price.toFixed(2)));
      chart.crossHairMoved().subscribe("alert-crosshair", cb);
      return () => chart.crossHairMoved().unsubscribe(cb);
    } catch (error) {
      console.error("Failed to setup crosshair listener:", error);
    }
  };

  /**
   * Setup keyboard shortcuts for alert creation
   */
  const setupKeyboardShortcuts = () => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd + Shift + A (Mac) or Ctrl + Shift + A (Windows/Linux)
      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.key === "A"
      ) {
        event.preventDefault();
        handleCreateAlertShortcut();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Return cleanup function
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  };

  /**
   * Handles the keyboard shortcut for creating a new alert
   * Creates alert with current symbol and crosshair price
   */
  const handleCreateAlertShortcut = () => {
    if (!currentSymbol) {
      console.warn("No symbol available for alert creation");
      return;
    }
    const newAlertParams: AlertParams = {
      type: "constant",
      symbol: currentSymbol,
      params: {
        constant: crosshairPriceRef?.current ?? 0, // Use crosshair price or fallback to 0
      },
    };

    // Reset state and open alert builder for new alert
    setSelectedAlert(undefined);
    setAlertParams(newAlertParams);
    setAlertBuilderOpen(true);
  };

  /**
   * Setup listener for symbol changes in TradingView
   */
  const setupSymbolChangeListener = () => {
    try {
      const chart = TradingViewApi.chart();
      const symbolSubscription = chart.onSymbolChanged();

      const handleSymbolChange = (resolvedSymbol: any) => {
        const newSymbol = resolvedSymbol.pro_name || resolvedSymbol.name;
        if (newSymbol && newSymbol !== currentSymbol && currentSymbol) {
          console.log(`🔄 Symbol changed: ${currentSymbol} → ${newSymbol}`);
          removeOrderLinesForSymbol(currentSymbol);

          // Reset crosshair price when symbol changes
          crosshairPriceRef.current = null;
        }
      };

      symbolSubscription.subscribe("alerts-component", handleSymbolChange);

      // Cleanup function will be handled by useEffect cleanup
      return () => symbolSubscription.unsubscribe(handleSymbolChange);
    } catch (error) {
      console.error("Failed to setup symbol listener:", error);
      return () => {}; // Return empty cleanup function
    }
  };

  /**
   * Handle symbol changes - remove orderlines for old symbol
   */
  useEffect(() => {
    if (!currentSymbol || !isInitializedRef.current) return;

    // Remove orderlines that don't match the current symbol
    removeOrderLinesForDifferentSymbol(currentSymbol);
  }, [currentSymbol]);

  /**
   * Synchronize orderlines when alerts change
   */
  useEffect(() => {
    if (!currentSymbol || isLoading || error || !isInitializedRef.current) {
      return;
    }

    synchronizeOrderLines();
  }, [alerts, currentSymbol, isLoading, error]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      removeAllOrderLines();
      isInitializedRef.current = false;
      crosshairPriceRef.current = null;
    };
  }, []);

  /**
   * Gets alerts that are relevant for the current symbol and have valid price data
   */
  const getRelevantAlerts = (): Alert[] => {
    if (!currentSymbol) return [];

    return alerts.filter((alert) => {
      // Must be for current symbol
      if (alert.symbol !== currentSymbol) return false;

      // Must be active (assuming alerts from useAlerts are already filtered)

      // Must have valid price data
      const price = extractPriceFromAlert(alert);
      return typeof price === "number" && !isNaN(price);
    });
  };

  /**
   * Extracts price from alert's rhs_attr.constant field
   */
  const extractPriceFromAlert = (alert: Alert): number | null => {
    return (alert.rhs_attr as Record<string, number>)?.["constant"] ?? null;
  };

  /**
   * Converts an alert to AlertParams format for the alert builder
   */
  const convertAlertToParams = (alert: Alert): AlertParams | undefined => {
    if (alert.rhs_type === "constant") {
      const price = extractPriceFromAlert(alert);
      if (typeof price === "number" && !isNaN(price)) {
        return {
          type: "constant",
          symbol: alert.symbol,
          params: { constant: price },
        };
      }
    } else if (alert.rhs_type === "trend_line") {
      const trendLineData = (alert.rhs_attr as any)?.trend_line;
      if (trendLineData) {
        return {
          type: "trend_line",
          symbol: alert.symbol,
          params: { trend_line: trendLineData },
        };
      }
    }
    return undefined;
  };

  /**
   * Checks if two alerts have different content that would require orderline update
   */
  const hasAlertChanged = (oldAlert: Alert, newAlert: Alert): boolean => {
    const oldPrice = extractPriceFromAlert(oldAlert);
    const newPrice = extractPriceFromAlert(newAlert);

    return (
      oldPrice !== newPrice ||
      oldAlert.notes !== newAlert.notes ||
      oldAlert.symbol !== newAlert.symbol ||
      oldAlert.rhs_type !== newAlert.rhs_type ||
      JSON.stringify(oldAlert.rhs_attr) !== JSON.stringify(newAlert.rhs_attr)
    );
  };

  /**
   * Removes orderlines for a specific symbol
   */
  const removeOrderLinesForSymbol = (symbol: string) => {
    orderLineReferencesRef.current = orderLineReferencesRef.current.filter(
      ({ symbol: refSymbol, orderLine }) => {
        if (refSymbol === symbol) {
          try {
            orderLine.remove();
            return false; // Remove from references
          } catch (error) {
            console.warn(
              `Failed to remove orderline for symbol ${symbol}:`,
              error,
            );
            return false; // Remove from references anyway
          }
        }
        return true; // Keep in references
      },
    );
  };

  /**
   * Removes orderlines that don't match the current symbol
   */
  const removeOrderLinesForDifferentSymbol = (currentSymbol: string) => {
    orderLineReferencesRef.current = orderLineReferencesRef.current.filter(
      ({ symbol, orderLine }) => {
        if (symbol !== currentSymbol) {
          try {
            orderLine.remove();
            return false;
          } catch (error) {
            console.warn("Failed to remove orderline on symbol change:", error);
            return false;
          }
        }
        return true;
      },
    );
  };

  /**
   * Removes all orderlines regardless of symbol
   */
  const removeAllOrderLines = () => {
    orderLineReferencesRef.current.forEach(({ orderLine, alertId }) => {
      try {
        orderLine.remove();
      } catch (error) {
        console.warn(`Failed to remove orderline for alert ${alertId}:`, error);
      }
    });
    orderLineReferencesRef.current = [];
  };

  /**
   * Synchronizes orderlines with current alerts for the active symbol
   */
  const synchronizeOrderLines = async () => {
    if (!TradingViewApi || !currentSymbol) return;

    try {
      const chart = TradingViewApi.chart();
      const relevantAlerts = getRelevantAlerts();

      await removeObsoleteOrderLines(relevantAlerts);
      await updateExistingOrderLines(relevantAlerts);
      await createMissingOrderLines(relevantAlerts, chart);
    } catch (error) {
      console.error("Failed to synchronize orderlines:", error);
    }
  };

  /**
   * Removes orderlines for alerts that no longer exist
   */
  const removeObsoleteOrderLines = async (currentAlerts: Alert[]) => {
    const currentAlertIds = new Set(currentAlerts.map((alert) => alert.id));

    orderLineReferencesRef.current = orderLineReferencesRef.current.filter(
      ({ alertId, orderLine, symbol }) => {
        const shouldKeep =
          currentAlertIds.has(alertId) && symbol === currentSymbol;

        if (!shouldKeep) {
          try {
            orderLine.remove();
          } catch (error) {
            console.warn(
              `Failed to remove obsolete orderline for alert ${alertId}:`,
              error,
            );
          }
        }

        return shouldKeep;
      },
    );
  };

  /**
   * Updates existing orderlines when their corresponding alerts have changed
   */
  const updateExistingOrderLines = async (currentAlerts: Alert[]) => {
    const alertsById = new Map(currentAlerts.map((alert) => [alert.id, alert]));

    // Update existing orderline references with new alert data and check for changes
    orderLineReferencesRef.current = orderLineReferencesRef.current.map(
      (ref) => {
        const updatedAlert = alertsById.get(ref.alertId);

        if (updatedAlert && hasAlertChanged(ref.alert, updatedAlert)) {
          try {
            const newPrice = extractPriceFromAlert(updatedAlert);

            if (typeof newPrice === "number" && !isNaN(newPrice)) {
              // Update orderline with new alert data
              configureOrderLine(ref.orderLine, updatedAlert, newPrice);
              console.log(
                `🔄 Updated orderline for alert ${updatedAlert.id} (${currentSymbol} @ ${newPrice})`,
              );

              // Return updated reference with new alert data
              return {
                ...ref,
                alert: updatedAlert,
              };
            } else {
              console.warn(
                `Invalid price for updated alert ${updatedAlert.id}:`,
                newPrice,
              );
            }
          } catch (error) {
            console.error(
              `Failed to update orderline for alert ${updatedAlert.id}:`,
              error,
            );
          }
        } else if (updatedAlert) {
          // Alert exists but no changes, just update the reference
          return {
            ...ref,
            alert: updatedAlert,
          };
        }

        return ref;
      },
    );
  };

  /**
   * Creates orderlines for alerts that don't have them yet
   */
  const createMissingOrderLines = async (
    relevantAlerts: Alert[],
    chart: any,
  ) => {
    const existingAlertIds = new Set(
      orderLineReferencesRef.current
        .filter((ref) => ref.symbol === currentSymbol)
        .map((ref) => ref.alertId),
    );

    for (const alert of relevantAlerts) {
      if (!existingAlertIds.has(alert.id)) {
        await createOrderLineForAlert(alert, chart);
      }
    }
  };

  /**
   * Creates an orderline for a specific alert
   */
  const createOrderLineForAlert = async (alert: Alert, chart: any) => {
    try {
      const price = extractPriceFromAlert(alert);

      if (typeof price !== "number" || isNaN(price)) {
        console.warn(`Invalid price for alert ${alert.id}:`, price);
        return;
      }

      const orderLine = await chart.createOrderLine();
      configureOrderLine(orderLine, alert, price);
      setupOrderLineEventHandlers(orderLine, alert);
      storeOrderLineReference(alert, orderLine);

      console.log(
        `📈 Created orderline for alert ${alert.id} (${currentSymbol} @ ${price})`,
      );
    } catch (error) {
      console.error(`Failed to create orderline for alert ${alert.id}:`, error);
    }
  };

  /**
   * Configures the visual appearance of an orderline
   */
  const configureOrderLine = (
    orderLine: IOrderLine,
    alert: Alert,
    price: number,
  ) => {
    const backgroundColor = "#F2C55C";
    const textColor = "#494949";

    orderLine
      .setText(alert.notes ?? `Alert: ${price}`)
      .setPrice(price)
      .setLineColor(backgroundColor)
      .setBodyBackgroundColor(backgroundColor)
      .setBodyBorderColor(textColor)
      .setBodyTextColor(textColor)
      .setQuantityBackgroundColor(backgroundColor)
      .setQuantityTextColor(textColor)
      .setCancelButtonBackgroundColor(backgroundColor)
      .setCancelButtonBorderColor(textColor)
      .setCancelButtonIconColor(textColor)
      .setQuantityBorderColor(textColor)
      .setLineStyle(2)
      .setExtendLeft(true)
      .setCancelTooltip("Cancel Alert")
      .setModifyTooltip("Edit Alert")
      .setEditable(true); // Enable editing to show modify tooltip
  };

  /**
   * Sets up event handlers for an orderline
   */
  const setupOrderLineEventHandlers = (orderLine: IOrderLine, alert: Alert) => {
    // Handle cancellation
    orderLine.onCancel(() => {
      handleOrderLineCancellation(alert.id);
    });

    // Handle modification - show alert builder with current alert data
    orderLine.onModify(() => {
      handleOrderLineModification(alert);
    });

    // Handle move - update alert price when orderline is moved
    orderLine.onMove(() => {
      const newPrice = orderLine.getPrice();
      console.log(`📍 Alert ${alert.id} moved to price: ${newPrice}`);
      updateAlertMutation.mutate(
        {
          id: alert.id,
          payload: {
            rhs_attr: { constant: newPrice },
          },
        },
        {
          onSuccess: () => {
            // Update the stored alert reference with new price
            updateStoredAlertReference(alert.id, {
              ...alert,
              rhs_attr: { constant: newPrice },
            });
          },
          onError: (error) => {
            console.error(`Failed to update alert ${alert.id}:`, error);
          },
        },
      );
    });
  };

  /**
   * Updates the stored alert reference for a specific alert
   */
  const updateStoredAlertReference = (alertId: string, updatedAlert: Alert) => {
    orderLineReferencesRef.current = orderLineReferencesRef.current.map(
      (ref) =>
        ref.alertId === alertId ? { ...ref, alert: updatedAlert } : ref,
    );
  };

  /**
   * Handles orderline cancellation events
   */
  const handleOrderLineCancellation = (alertId: string) => {
    console.log(`🗑️ Alert ${alertId} cancelled via orderline`);

    // Find and remove the orderline from TradingView chart
    const orderLineRef = orderLineReferencesRef.current.find(
      (ref) => ref.alertId === alertId,
    );

    if (orderLineRef) {
      try {
        orderLineRef.orderLine.remove();
      } catch (error) {
        console.warn(`Failed to remove orderline for alert ${alertId}:`, error);
      }
    }

    // Remove from local references
    removeOrderLineReference(alertId);

    // Delete alert using React Query mutation
    deleteAlertMutation.mutate(alertId, {
      onError: (error) => {
        console.error(`Failed to delete alert ${alertId}:`, error);
      },
    });
  };

  /**
   * Handles orderline modification events - opens alert builder
   */
  const handleOrderLineModification = (alert: Alert) => {
    console.log(`✏️ Modifying alert ${alert.id} via orderline`);

    // Get the most current alert data from references
    const currentRef = orderLineReferencesRef.current.find(
      (ref) => ref.alertId === alert.id,
    );
    const currentAlert = currentRef?.alert || alert;

    // Convert alert to AlertParams format
    const params = convertAlertToParams(currentAlert);

    // Set state to open alert builder with existing alert data
    setSelectedAlert(currentAlert);
    setAlertParams(params);
    setAlertBuilderOpen(true);
  };

  /**
   * Stores a reference to an orderline for tracking
   */
  const storeOrderLineReference = (alert: Alert, orderLine: IOrderLine) => {
    orderLineReferencesRef.current.push({
      alertId: alert.id,
      orderLine,
      symbol: currentSymbol!,
      alert,
    });
  };

  /**
   * Removes an orderline reference from tracking
   */
  const removeOrderLineReference = (alertId: string) => {
    orderLineReferencesRef.current = orderLineReferencesRef.current.filter(
      (ref) => ref.alertId !== alertId,
    );
  };

  /**
   * Handles alert builder close - reset state
   */
  const handleAlertBuilderClose = () => {
    setAlertBuilderOpen(false);
    setSelectedAlert(undefined);
    setAlertParams(undefined);
  };

  /**
   * Handles alert save from builder
   */
  const handleAlertSave = (updatedAlert: Alert) => {
    console.log(`💾 Alert ${updatedAlert.id} saved from builder`);
    // The orderlines will automatically update via the alerts dependency
    handleAlertBuilderClose();
  };

  return (
    <AlertBuilder
      open={alertBuilderOpen}
      onOpenChange={setAlertBuilderOpen}
      alertParams={alertParams}
      existingAlert={selectedAlert}
      onSave={handleAlertSave}
    />
  );
}
