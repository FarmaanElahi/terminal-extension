import { WidgetProps } from "./widget-props";
import { ScannerList } from "@/components/scanner/scanner-list.tsx";
import { ScannerProvider } from "@/hooks/use-active-scanner.tsx";
import { ScannerSelector } from "@/components/scanner/scanner-selector.tsx";
import { useClearTempFilter, useTempFilter } from "@/hooks/use-temp-filter.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useSymbol } from "@/hooks/use-symbol.tsx";
import { X } from "lucide-react";

export function ScreenerApp(_props: WidgetProps) {
  const filter = useTempFilter();
  return (
    <ScannerProvider
      onScannerIdChange={() => {}}
      types={["screener"]}
      type={"Screener"}
    >
      <div className={"h-full flex flex-col"}>
        <div className="flex gap-2">
          {filter && <GroupInfo />}
          {!filter && <ScannerSelector />}
        </div>

        <ScannerList className="flex-1" />
      </div>
    </ScannerProvider>
  );
}

function GroupInfo({
  placeholder = "Search",
}: {
  name?: string;
  placeholder?: string;
}) {
  const symbol = useSymbol()?.split(":")?.[1];
  const filter = useTempFilter();
  const clearFilter = useClearTempFilter();
  const groupValue = filter?.name || symbol;
  const value = groupValue || placeholder;
  return (
    <Button
      variant="outline"
      size="sm"
      className="font-bold justify-between w-48"
      onClick={() => (filter ? clearFilter() : null)}
    >
      {value}
      <X className="size-4  right-0" />
    </Button>
  );
}
