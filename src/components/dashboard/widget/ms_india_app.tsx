import { useSymbol } from "@/hooks/use-symbol.tsx";
import { useMemo } from "react";

export function MSIndiaApp() {
  const symbol = useSymbol();
  const url = useMemo(
    () =>
      symbol?.startsWith("NSE:")
        ? `https://msindia.farmaan.xyz/mstool/eval/${symbol.split(":")[1]}/evaluation.jsp#/`
        : null,
    [symbol],
  );

  return (
    <div style={{ height: "100%", width: "100%" }}>
      {!url && <div>Symbol not supported for MS List</div>}
      {url && (
        <iframe
          title={"MS India"}
          src={url}
          className="h-full w-full"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            minWidth: "100%",
            minHeight: "100%",
          }}
        />
      )}
    </div>
  );
}
