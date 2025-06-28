import { WidgetProps } from "./widget-props";
import { ScannerList } from "@/components/scanner/scanner-list.tsx";
import { ScannerProvider } from "@/hooks/use-active-scanner.tsx";

export function ScreenerApp(_props: WidgetProps) {
  return (
    <ScannerProvider
      onScannerIdChange={() => {}}
      types={["screener"]}
      type={"Screener"}
    >
      <div className={"h-full flex flex-col"}>
        <ScannerList className="flex-1" />
      </div>
    </ScannerProvider>
  );
}
