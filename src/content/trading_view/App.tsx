import "@/global.css";
import "@/components/dashboard/dashboard-module.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/client";
import { DashboardLayout } from "@/components/dashboard/layout";
import { ThemeProvider } from "@/components/theme/theme-provider.tsx";
import { SymbolProvider } from "@/hooks/use-symbol.tsx";
import { Toaster } from "@/components/ui/sonner.tsx";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SymbolProvider>
          <DashboardLayout />
          <Toaster />
        </SymbolProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
