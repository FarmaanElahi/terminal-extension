import { ScannerProvider } from "@/hooks/use-active-scanner.tsx";
import { ScannerSelector } from "@/components/scanner/scanner-selector.tsx";
import { ScannerList } from "@/components/scanner/scanner-list.tsx";

export function WatchlistApp() {
  return (
    <ScannerProvider
      onScannerIdChange={() => {}}
      types={["combo", "simple"]}
      type={"Watchlist"}
    >
      <div className={"h-full flex flex-col"}>
        <ScannerSelector />
        <ScannerList className="flex-1" />
      </div>
    </ScannerProvider>
  );
}
