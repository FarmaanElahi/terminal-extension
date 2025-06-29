import { createContext, PropsWithChildren, useContext, useState } from "react";
import { AdvancedFilterModel } from "ag-grid-community";

interface ContextState {
  state?: {
    name: string;
    state: AdvancedFilterModel;
  };
  clearFilter: () => void;
  switchFilter: (state: ContextState["state"]) => void;
}

const TempFilterContext = createContext<ContextState | undefined>(undefined);

export function TempFilterProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<ContextState["state"] | undefined>();
  const clearFilter = () => setState(undefined);
  const switchFilter = (state: Required<ContextState["state"]>) =>
    setState(state);
  return (
    <TempFilterContext.Provider value={{ state, switchFilter, clearFilter }}>
      {children}
    </TempFilterContext.Provider>
  );
}

export function useTempFilter() {
  const tempFilter = useContext(TempFilterContext);
  if (!tempFilter) throw new Error("No Temp Filter");
  return tempFilter.state;
}

export function useSwitchTempFilter() {
  return useContext(TempFilterContext)!.switchFilter;
}

export function useClearTempFilter() {
  return useContext(TempFilterContext)!.clearFilter;
}
