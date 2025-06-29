import "@/global.css";
import "@/components/dashboard/dashboard-module.css";
import "@/components/grid/ag-theme.css";
import "@/lib/fetch";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/client";
import { DashboardLayout } from "@/components/dashboard/layout";
import { ThemeProvider } from "@/components/theme/theme-provider.tsx";
import { SymbolProvider } from "@/hooks/use-symbol.tsx";
import { Toaster } from "@/components/ui/sonner.tsx";
import { RealtimeProvider } from "@/hooks/use-realtime.tsx";
import { TempFilterProvider } from "@/hooks/use-temp-filter.tsx";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeProvider>
        <ThemeProvider>
          <SymbolProvider>
            <TempFilterProvider>
              <DashboardLayout />
              <Toaster />
            </TempFilterProvider>
          </SymbolProvider>
        </ThemeProvider>
      </RealtimeProvider>
    </QueryClientProvider>
  );
}
