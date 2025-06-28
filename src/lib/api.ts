import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/client";
import type { Symbol } from "@/types/symbol";
import { queryScanner } from "@/lib/scanner";
import {
  Alert,
  Dashboard,
  DataPanel,
  InsertAlert,
  InsertDashboard,
  InsertDataPanel,
  InsertScanner,
  InsertScreen,
  Scanner,
  Screen,
  UpdateAlert,
  UpdateDashboard,
  UpdateDataPanel,
  UpdateScanner,
  UpdateScreen,
} from "@/types/supabase";

//##################### SYMBOL QUOTE #####################
async function symbolQuoteQueryFn(ticker: string) {
  const d = await queryDuckDB<Symbol>("symbols", {
    where: `ticker = '${ticker}'`,
    limit: 1,
  });
  if (d.length === 0) throw new Error("Cannot find quote");
  return d[0];
}

export function symbolQuote(symbol: string) {
  return queryClient.fetchQuery({
    queryKey: ["symbol_quote", symbol],
    queryFn: async () => symbolQuoteQueryFn(symbol),
  });
}

export function useSymbolQuote(symbolName?: string) {
  return useQuery({
    enabled: !!symbolName,
    queryKey: ["symbol_quote", symbolName],
    queryFn: async () => symbolQuoteQueryFn(symbolName!),
  });
}

//##################### SYMBOL QUOTE #####################

//##################### SCREENS #####################
export function useCreateScreen(onComplete?: (screen: Screen) => void) {
  const client = useQueryClient();
  return useMutation({
    onSuccess: (screen: Screen) => {
      void client.invalidateQueries({ queryKey: ["screens"] });
      onComplete?.(screen);
    },
    mutationFn: async (screen: InsertScreen) => {
      const { data, error } = await supabase
        .from("screens")
        .insert({
          ...screen,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });
}

export function useDeleteScreen(onComplete?: () => void) {
  const client = useQueryClient();
  return useMutation({
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["screens"] });
      onComplete?.();
    },
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("screens")
        .delete()
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateScreen(onComplete?: (screen: Screen) => void) {
  const client = useQueryClient();
  return useMutation({
    onSuccess: (screen: Screen) => {
      void client.invalidateQueries({ queryKey: ["screens"] });
      onComplete?.(screen);
    },
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateScreen;
    }) => {
      const { data, error } = await supabase
        .from("screens")
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });
}

export function useScreens() {
  return useQuery({
    queryKey: ["screens"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("screens")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

//##################### WATCHLIST #####################

//##################### SCREENS #####################
export function useCreateScanner(onComplete?: (scanner: Scanner) => void) {
  const client = useQueryClient();
  return useMutation({
    onSuccess: (list: Scanner) => {
      void client.invalidateQueries({ queryKey: ["scanner"] });
      onComplete?.(list);
    },
    mutationFn: async (scanner: InsertScanner) => {
      const { data, error } = await supabase
        .from("scanner")
        .insert({
          ...scanner,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });
}

export function useDeleteScanner(onComplete?: () => void) {
  const client = useQueryClient();
  return useMutation({
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["scanner"] });
      onComplete?.();
    },
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("scanner")
        .delete()
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateScanner(onComplete?: (scanner: Scanner) => void) {
  const client = useQueryClient();
  return useMutation({
    onSuccess: async (scanner: Scanner) => {
      await client.invalidateQueries({ queryKey: ["scanner"] });
      onComplete?.(scanner);
    },
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateScanner;
    }) => {
      const { data, error } = await supabase
        .from("scanner")
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });
}

export function useScanners(types: Scanner["type"][]) {
  const scannerResult = useAllScanner();
  return {
    ...scannerResult,
    data: scannerResult.data?.filter((f) => types.includes(f.type)),
  };
}

export function useAllScanner() {
  return useQuery({
    queryKey: ["scanner"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scanner")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export async function querySymbols(symbols: string[]) {
  if (symbols.length === 0) return [];

  const inQuery = symbols.map((s) => `'${s}'`).join(",");
  return (await queryScanner("symbols", {
    columns: [], // Will load all columns
    where: `ticker IN (${inQuery})`,
    limit: symbols.length,
  })) as Symbol[];
}

//##################### SCREENS #####################

//##################### DASHBOARD #####################
export function useDashboards() {
  const client = useQueryClient();
  return useQuery({
    queryKey: ["dashboards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dashboards")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      data?.forEach((d) => {
        client.setQueryData(["dashboards", d.id], d);
      });
      return data;
    },
  });
}

export function useCreateDashboard(
  onComplete?: (dashboard: Dashboard) => void,
) {
  const client = useQueryClient();
  return useMutation({
    // Optimistic update for dashboard creation
    onMutate: async (newDashboard: InsertDashboard) => {
      // Cancel outgoing refetches
      await client.cancelQueries({ queryKey: ["dashboards"] });

      // Snapshot previous value
      const previousDashboards = client.getQueryData<Dashboard[]>([
        "dashboards",
      ]);

      // Create optimistic dashboard with temporary ID
      const optimisticDashboard: Dashboard = {
        ...newDashboard,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        widgets: [],
      } as Dashboard;

      // Optimistically update to the new value
      if (previousDashboards) {
        client.setQueryData(
          ["dashboards"],
          [optimisticDashboard, ...previousDashboards],
        );
      } else {
        client.setQueryData(["dashboards"], [optimisticDashboard]);
      }

      return { previousDashboards, optimisticDashboard };
    },
    // If mutation fails, rollback
    onError: (__, ___, context) => {
      if (context?.previousDashboards) {
        client.setQueryData(["dashboards"], context.previousDashboards);
      }
    },
    // Replace optimistic dashboard with real one on success
    onSuccess: (dashboard: Dashboard, __, context) => {
      const dashboards = client.getQueryData<Dashboard[]>(["dashboards"]);
      if (dashboards && context?.optimisticDashboard) {
        const updatedDashboards = dashboards.map((d) =>
          d.id === context.optimisticDashboard.id ? dashboard : d,
        );
        client.setQueryData(["dashboards"], updatedDashboards);
      }
      client.setQueryData(["dashboards", dashboard.id], dashboard);
      onComplete?.(dashboard);
    },
    // Ensure eventual consistency
    onSettled: () => {
      void client.invalidateQueries({ queryKey: ["dashboards"] });
    },
    mutationFn: async (dashboard: InsertDashboard) => {
      const { data, error } = await supabase
        .from("dashboards")
        .insert({
          ...dashboard,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as Dashboard;
    },
  });
}

export function useDeleteDashboard(onComplete?: () => void) {
  const client = useQueryClient();
  return useMutation({
    // Optimistic update for dashboard deletion
    onMutate: async (dashboardId: string) => {
      // Cancel outgoing refetches
      await client.cancelQueries({ queryKey: ["dashboards"] });
      await client.cancelQueries({ queryKey: ["dashboards", dashboardId] });

      // Snapshot previous values
      const previousDashboards = client.getQueryData<Dashboard[]>([
        "dashboards",
      ]);
      const previousDashboard = client.getQueryData<Dashboard>([
        "dashboards",
        dashboardId,
      ]);

      // Optimistically remove dashboard
      if (previousDashboards) {
        const filteredDashboards = previousDashboards.filter(
          (d) => d.id !== dashboardId,
        );
        client.setQueryData(["dashboards"], filteredDashboards);
      }

      // Remove individual dashboard cache
      client.removeQueries({ queryKey: ["dashboards", dashboardId] });

      return { previousDashboards, previousDashboard };
    },
    // If mutation fails, rollback
    onError: (__, dashboardId, context) => {
      if (context?.previousDashboards) {
        client.setQueryData(["dashboards"], context.previousDashboards);
      }
      if (context?.previousDashboard) {
        client.setQueryData(
          ["dashboards", dashboardId],
          context.previousDashboard,
        );
      }
    },
    // Handle success
    onSuccess: () => {
      onComplete?.();
    },
    // Ensure eventual consistency
    onSettled: (__, ___, dashboardId) => {
      void client.invalidateQueries({ queryKey: ["dashboards"] });
      void client.invalidateQueries({ queryKey: ["dashboards", dashboardId] });
    },
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("dashboards")
        .delete()
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

export function useUpdatedDashboard() {
  const client = useQueryClient();
  return useMutation({
    // Optimistic update - immediately update the cache
    onMutate: async ({ id, payload }) => {
      // Cancel any outgoing refetches
      await client.cancelQueries({ queryKey: ["dashboards"] });
      await client.cancelQueries({ queryKey: ["dashboards", id] });

      // Snapshot the previous values
      const previousDashboards = client.getQueryData<Dashboard[]>([
        "dashboards",
      ]);
      const previousDashboard = client.getQueryData<Dashboard>([
        "dashboards",
        id,
      ]);

      // Optimistically update the cache
      if (previousDashboards) {
        const updatedDashboards = previousDashboards.map((dashboard) =>
          dashboard.id === id
            ? { ...dashboard, ...payload, updated_at: new Date().toISOString() }
            : dashboard,
        );
        client.setQueryData(["dashboards"], updatedDashboards);
      }

      if (previousDashboard) {
        const updatedDashboard = {
          ...previousDashboard,
          ...payload,
          updated_at: new Date().toISOString(),
        };
        client.setQueryData(["dashboards", id], updatedDashboard);
      }

      // Return context object with the snapshotted values
      return { previousDashboards, previousDashboard };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (__, { id }, context) => {
      if (context?.previousDashboards) {
        client.setQueryData(["dashboards"], context.previousDashboards);
      }
      if (context?.previousDashboard) {
        client.setQueryData(["dashboards", id], context.previousDashboard);
      }
    },
    // Update with real server data on success
    onSuccess: (dashboard: Dashboard, { id }) => {
      const dashboards = client.getQueryData<Dashboard[]>(["dashboards"]);
      if (dashboards) {
        const updatedDashboards = dashboards.map((d) =>
          d.id === id ? dashboard : d,
        );
        client.setQueryData(["dashboards"], updatedDashboards);
      }
      client.setQueryData(["dashboards", id], dashboard);
    },
    // Always refetch after error or success to ensure we have the latest data
    onSettled: (__, ___, { id }) => {
      void client.invalidateQueries({ queryKey: ["dashboards"] });
      void client.invalidateQueries({ queryKey: ["dashboards", id] });
    },
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateDashboard;
    }) => {
      const { data, error } = await supabase
        .from("dashboards")
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Dashboard;
    },
  });
}

export function useDashboardData(id: string) {
  return useQuery({
    queryKey: ["dashboards", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dashboards")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Dashboard;
    },
  });
}

//##################### DATA PANELS #####################
export function useDataPanels() {
  return useQuery({
    queryKey: ["data_panels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_panels")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateDataPanel(
  onComplete?: (dataPanel: DataPanel) => void,
) {
  const client = useQueryClient();
  return useMutation({
    onSuccess: (dataPanel: DataPanel) => {
      void client.invalidateQueries({ queryKey: ["data_panels"] });
      onComplete?.(dataPanel);
    },
    mutationFn: async (dataPanel: InsertDataPanel) => {
      const { data, error } = await supabase
        .from("data_panels")
        .insert({
          ...dataPanel,
          udpated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });
}

export function useDeleteDataPanel(onComplete?: () => void) {
  const client = useQueryClient();
  return useMutation({
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["data_panels"] });
      onComplete?.();
    },
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("data_panels")
        .delete()
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateDataPanel(
  onComplete?: (dataPanel: DataPanel) => void,
) {
  const client = useQueryClient();
  return useMutation({
    onSuccess: (dataPanel: DataPanel) => {
      void client.invalidateQueries({ queryKey: ["data_panels"] });
      onComplete?.(dataPanel);
    },
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateDataPanel;
    }) => {
      const { data, error } = await supabase
        .from("data_panels")
        .update({
          ...payload,
          udpated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });
}

export function useDataPanelData(id: string) {
  return useQuery({
    queryKey: ["data_panels", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_panels")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as DataPanel;
    },
  });
}

//##################### ALERTS #####################

export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Alert[];
    },
  });
}

export function useAlert(id: string) {
  return useQuery({
    queryKey: ["alerts", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single();

      if (error) throw error;
      return data as Alert;
    },
  });
}

export function useAlertsForSymbol(symbol: string) {
  return useQuery({
    queryKey: ["alerts", "symbol", symbol],
    enabled: !!symbol,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("symbol", symbol)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Alert[];
    },
  });
}

export function useCreateAlert(onComplete?: (alert: Alert) => void) {
  const client = useQueryClient();
  return useMutation({
    onSuccess: (alert: Alert) => {
      void client.invalidateQueries({ queryKey: ["alerts"] });
      void client.invalidateQueries({
        queryKey: ["alerts", "symbol", alert.symbol],
      });
      onComplete?.(alert);
    },
    mutationFn: async (alert: InsertAlert) => {
      const { data, error } = await supabase
        .from("alerts")
        .insert({
          ...alert,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
          triggered_count: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Alert;
    },
  });
}

export function useUpdateAlert(onComplete?: (alert: Alert) => void) {
  const client = useQueryClient();
  return useMutation({
    onSuccess: (alert: Alert) => {
      void client.invalidateQueries({ queryKey: ["alerts"] });
      void client.invalidateQueries({ queryKey: ["alerts", alert.id] });
      void client.invalidateQueries({
        queryKey: ["alerts", "symbol", alert.symbol],
      });
      onComplete?.(alert);
    },
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateAlert;
    }) => {
      const { data, error } = await supabase
        .from("alerts")
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Alert;
    },
  });
}

export function useDeleteAlert(onComplete?: () => void) {
  const client = useQueryClient();
  return useMutation({
    onSuccess: (alert: Alert) => {
      void client.invalidateQueries({ queryKey: ["alerts"] });
      void client.invalidateQueries({ queryKey: ["alerts", alert.id] });
      void client.invalidateQueries({
        queryKey: ["alerts", "symbol", alert.symbol],
      });
      onComplete?.();
    },
    mutationFn: async (id: string) => {
      // Soft delete by setting deleted_at
      const { data, error } = await supabase
        .from("alerts")
        .update({
          deleted_at: new Date().toISOString(),
          is_active: false,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Alert;
    },
  });
}

export function useToggleAlertActive(onComplete?: (alert: Alert) => void) {
  const client = useQueryClient();
  return useMutation({
    onSuccess: (alert: Alert) => {
      void client.invalidateQueries({ queryKey: ["alerts"] });
      void client.invalidateQueries({ queryKey: ["alerts", alert.id] });
      void client.invalidateQueries({
        queryKey: ["alerts", "symbol", alert.symbol],
      });
      onComplete?.(alert);
    },
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from("alerts")
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Alert;
    },
  });
}

type GroupRankProps = {
  group: "sector" | "industry" | "sub_industry" | "industry_2";
  periods: Array<
    "1D" | "1W" | "2W" | "1M" | "3M" | "6M" | "9M" | "12M" | string
  >;
  sort: { field: GroupRankProps["periods"][number]; direction: "ASC" | "DESC" };
};

export function useGroupRanks(props: GroupRankProps) {
  return useQuery({
    queryKey: ["ranks", JSON.stringify(props)],
    queryFn: async () => {
      const result = await queryScanner<Record<string, unknown>>("symbols", {
        columns: [
          { column: props.group, distinct: true, alias: "grp" },
          ...props.periods.map((period) => ({
            column: [props.group, "ranking", period].join("_"),
            alias: period,
          })),
        ],
        where: `${[props.group, "ranking", "1M"].join("_")} < 1000`,
        order: [{ field: props.sort.field, sort: props.sort.direction }],
      });

      return result.map((value) => {
        const { grp, ...ranks } = value;

        return {
          symbol: grp as string,
          ranks: ranks as Record<GroupRankProps["periods"][number], number>,
        };
      });
    },
  });
}
