import { WidgetProps } from "./widget-props";
import {
  useCreateScan,
  useDeleteScan,
  useListScan,
  useScans,
  useUpdateScan,
} from "@/lib/api.ts";
import { AgGridReact } from "ag-grid-react";
import { useCallback, useMemo, useState } from "react";
import { defaultColumns } from "@/components/symbols/columns.tsx";
import {
  AgColumn,
  CellFocusedEvent,
  ColDef,
  GetRowIdFunc,
} from "ag-grid-community";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Edit,
  Filter,
  FolderOpen,
  Globe,
  Plus,
  Save,
  Settings,
  Target,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useSymbolSwitcher } from "@/hooks/use-symbol.tsx";
import { Json, Scans } from "@/types/supabase";

export function EZScanApp(_props: WidgetProps) {
  const [state, setState] = useState({
    market: "india",
    pre_conditions: [] as FilterCondition[],
    prescan_logic: "and" as "and" | "or",
    conditions: [] as FilterCondition[],
    columns: [
      {
        id: "name",
        name: "Name",
        type: "static",
        property_name: "name",
      },
      {
        id: "logo",
        name: "Logo",
        type: "static",
        property_name: "logo",
      },
      {
        id: "change",
        name: "Change%",
        type: "computed",
        expression: "(c/prv(c) -1 ) * 100",
      },
    ] as ColumnConfig[],
    logic: "and" as "and" | "or",
    sort_columns: [
      {
        column: "Bullish Setup",
        direction: "desc",
      },
    ],
  });

  // Add scan management state
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [scanName, setScanName] = useState("");

  const { data, isFetching, isPending } = useListScan(state);
  const { data: savedScans } = useScans();

  // Scan management hooks
  const createScan = useCreateScan((scan) => {
    setCurrentScanId(scan.id);
    toast.success(`Scan "${scan.name}" saved successfully`);
    setShowSaveDialog(false);
    setScanName("");
  });

  const updateScan = useUpdateScan((scan) => {
    toast.success(`Scan "${scan.name}" updated successfully`);
    setShowSaveDialog(false);
    setScanName("");
  });

  const deleteScan = useDeleteScan(() => {
    toast.success("Scan deleted successfully");
  });

  const switcher = useSymbolSwitcher();

  const onCellFocused = useCallback(
    (event: CellFocusedEvent) => {
      if ((event.column as AgColumn)?.colId === "ag-Grid-SelectionColumn") {
        return;
      }

      const { rowIndex } = event;
      if (rowIndex === undefined || rowIndex === null) return;
      const symbol = event.api.getDisplayedRowAtIndex(rowIndex)?.data;
      if (!symbol) return;
      const { ticker } = symbol;
      if (!ticker) return;
      switcher(ticker);
    },
    [switcher],
  );

  const rows = useMemo(
    () =>
      data?.data?.map((row) => {
        const d: Record<string, unknown> = {};
        d.ticker = row[0];
        state.columns.forEach((c, index) => (d[c.id] = row[index + 1]));
        return d;
      }),
    [data?.data, state.columns],
  );

  const ignoreColumnsProperty = useMemo(() => new Set(["logo"]), []);

  const columns = useMemo(
    () => [
      {
        colId: "ticker",
        field: "ticker",
        hide: true,
        mainMenuItems: [
          {
            name: "Copy Ticker",
            action: (params) => {
              const columnData: string[] = [];
              params.api.forEachNode((node) => {
                columnData.push(node.data.ticker);
              });
              void navigator.clipboard.writeText(columnData.join(","));
              toast(`Copied ${columnData.length} ticker`);
            },
          },
        ],
      } as ColDef,
      ...state.columns
        .map((c) => {
          if (c.property_name && ignoreColumnsProperty.has(c.property_name)) {
            return null;
          }
          if (c.type === "static") {
            const defCol = defaultColumns.find((col) => col.colId === c.id);
            return {
              ...defCol,
              colId: c.id,
              field: c.id,
              headerName: c.name,
            } as ColDef;
          }
          return {
            colId: c.id,
            field: c.id,
            headerName: c.name,
            cellDataType: c.type === "condition" ? "boolean" : undefined,
            valueFormatter: (params) => {
              if (typeof params.value === "number") {
                return +params.value.toFixed(2);
              }
              return params.value;
            },
          } as ColDef;
        })
        .filter((c) => c)
        .map((c) => c as ColDef),
    ],
    [state.columns, ignoreColumnsProperty],
  );

  const handleColumnsChange = (newColumns: ColumnConfig[]) => {
    setState((prevState) => ({
      ...prevState,
      columns: newColumns,
    }));
  };

  const handleFiltersChange = (
    conditions: FilterCondition[],
    logic: "and" | "or",
  ) => {
    setState((prevState) => ({
      ...prevState,
      conditions,
      logic,
    }));
  };

  const handlePrescanFiltersChange = (
    pre_conditions: FilterCondition[],
    prescan_logic: "and" | "or",
  ) => {
    setState((prevState) => ({
      ...prevState,
      pre_conditions,
      prescan_logic,
    }));
  };

  const handleMarketChange = (market: string) => {
    setState((prevState) => ({
      ...prevState,
      market,
    }));
  };

  // Scan management functions
  const handleSaveScan = () => {
    if (!scanName.trim()) {
      toast.error("Please enter a scan name");
      return;
    }

    const scanConfiguration = {
      market: state.market,
      pre_conditions: state.pre_conditions,
      prescan_logic: state.prescan_logic,
      conditions: state.conditions,
      columns: state.columns,
      logic: state.logic,
      sort_columns: state.sort_columns,
    };

    if (currentScanId) {
      // Update existing scan
      updateScan.mutate({
        id: currentScanId,
        payload: {
          name: scanName,
          configuration: scanConfiguration as unknown as Json,
        },
      });
    } else {
      // Create new scan
      createScan.mutate({
        name: scanName,
        source: state.market === "india" ? "india" : "us",
        configuration: scanConfiguration as unknown as Json,
      });
    }
  };

  const handleLoadScan = (scan: Scans) => {
    const config = scan.configuration as unknown as typeof state;
    setState({
      market: config.market || "india",
      pre_conditions: config.pre_conditions || [],
      prescan_logic: config.prescan_logic || "and",
      conditions: config.conditions || [],
      columns: config.columns || [],
      logic: config.logic || "and",
      sort_columns: config.sort_columns || [],
    });
    setCurrentScanId(scan.id);
    setScanName(scan.name);
    setShowLoadDialog(false);
    toast.success(`Loaded scan "${scan.name}"`);
  };

  const handleDeleteScan = (scanId: string, scanName: string) => {
    if (confirm(`Are you sure you want to delete scan "${scanName}"?`)) {
      deleteScan.mutate(scanId);
      if (currentScanId === scanId) {
        setCurrentScanId(null);
        setScanName("");
      }
    }
  };

  const handleNewScan = () => {
    setState({
      market: "india",
      pre_conditions: [],
      prescan_logic: "and",
      conditions: [],
      columns: [
        {
          id: "name",
          name: "Name",
          type: "static",
          property_name: "name",
        },
        {
          id: "logo",
          name: "Logo",
          type: "static",
          property_name: "logo",
        },
        {
          id: "change",
          name: "Change%",
          type: "computed",
          expression: "(c/prv(c) -1 ) * 100",
        },
      ],
      logic: "and",
      sort_columns: [
        {
          column: "Bullish Setup",
          direction: "desc",
        },
      ],
    });
    setCurrentScanId(null);
    setScanName("");
    toast.success("Started new scan");
  };

  const getRowId = useCallback<GetRowIdFunc>((r) => r.data.ticker, []);

  const gridOption = useMemo(() => {
    return {
      statusBar: {
        statusPanels: [{ statusPanel: "agTotalRowCountComponent" }],
      },
    };
  }, []);

  return (
    <div className={"h-full flex flex-col relative"}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          {currentScanId && (
            <Badge variant="outline" className="bg-green-50">
              {scanName}
            </Badge>
          )}
        </div>

        <div className="flex">
          {/* Scan Management */}
          <Button
            variant="outline"
            size="sm"
            className="bg-white/90 backdrop-blur-sm mr-2"
            onClick={handleNewScan}
          >
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>

          <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/90 backdrop-blur-sm mr-2"
              >
                <FolderOpen className="w-4 h-4 mr-1" />
                Load
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Load Saved Scan</DialogTitle>
              </DialogHeader>
              <div className="max-h-96 overflow-y-auto">
                {savedScans?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No saved scans found
                  </p>
                ) : (
                  <div className="space-y-2">
                    {savedScans?.map((scan) => (
                      <div
                        key={scan.id}
                        className="flex items-center justify-between p-3 border rounded hover:bg-muted/50"
                      >
                        <div>
                          <div className="font-medium">{scan.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Source: {scan.source} • Updated:{" "}
                            {new Date(
                              scan.updated_at || scan.created_at,
                            ).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleLoadScan(scan)}
                          >
                            Load
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteScan(scan.id, scan.name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/90 backdrop-blur-sm mr-2"
              >
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {currentScanId ? "Update Scan" : "Save Scan"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="scanName">Scan Name</Label>
                  <Input
                    id="scanName"
                    value={scanName}
                    onChange={(e) => setScanName(e.target.value)}
                    placeholder="Enter scan name..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveScan}
                    disabled={createScan.isPending || updateScan.isPending}
                    className="flex-1"
                  >
                    {createScan.isPending || updateScan.isPending
                      ? "Saving..."
                      : currentScanId
                        ? "Update"
                        : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowSaveDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <MarketManager
            market={state.market}
            onMarketChange={handleMarketChange}
          />
          <PrescanFilterManager
            pre_conditions={state.pre_conditions}
            prescan_logic={state.prescan_logic}
            onPrescanFiltersChange={handlePrescanFiltersChange}
          />
          <FilterManager
            conditions={state.conditions}
            logic={state.logic}
            onFiltersChange={handleFiltersChange}
          />
          <ColumnManager
            columns={state.columns}
            onColumnsChange={handleColumnsChange}
          />
        </div>
      </div>

      <AgGridReact
        className="ag-terminal-theme flex-1"
        autoSizeStrategy={{ type: "fitCellContents" }}
        rowData={isFetching ? undefined : rows}
        loading={isFetching && !isPending}
        getRowId={getRowId}
        defaultCsvExportParams={{ exportedRows: "all" }}
        columnDefs={columns}
        onCellFocused={onCellFocused}
        headerHeight={36}
        rowHeight={32}
        statusBar={gridOption.statusBar}
      />
    </div>
  );
}

interface MarketManagerProps {
  market: string;
  onMarketChange: (market: string) => void;
}

export function MarketManager({ market, onMarketChange }: MarketManagerProps) {
  return (
    <div className="mr-2">
      <Select value={market} onValueChange={onMarketChange}>
        <SelectTrigger className="w-32 bg-white/90 backdrop-blur-sm">
          <Globe className="w-4 h-4 mr-1" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="india">India</SelectItem>
          <SelectItem value="us">US</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export interface FilterCondition {
  expression: string;
  condition_type: "static" | "computed";
  evaluation_period: "now" | "within_last" | "x_bar_ago";
  evaluation_type: "boolean" | "rank";
  value?: number;
  rank_min?: number;
  rank_max?: number;
}

export interface ColumnConfig {
  id: string;
  name: string;
  type: "static" | "computed" | "condition";
  property_name?: string;
  expression?: string;
  logic?: "and" | "or";
  conditions?: Array<{
    expression: string;
    condition_type: "computed";
    evaluation_period: "now" | "within_last" | "x_bar_ago";
    evaluation_type: "boolean" | "rank";
    value?: number;
    rank_min?: number;
    rank_max?: number;
  }>;
}

interface PrescanFilterManagerProps {
  pre_conditions: FilterCondition[];
  prescan_logic: "and" | "or";
  onPrescanFiltersChange: (
    pre_conditions: FilterCondition[],
    prescan_logic: "and" | "or",
  ) => void;
}

export function PrescanFilterManager({
  pre_conditions,
  prescan_logic,
  onPrescanFiltersChange,
}: PrescanFilterManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<FilterCondition | null>(
    null,
  );
  const [editingFilterIndex, setEditingFilterIndex] = useState<number | null>(
    null,
  );
  const [newFilter, setNewFilter] = useState<Partial<FilterCondition>>({
    condition_type: "static",
    evaluation_period: "now",
    evaluation_type: "boolean",
  });

  const handleAddFilter = () => {
    if (!newFilter.expression) return;

    const filter: FilterCondition = {
      expression: newFilter.expression,
      condition_type: newFilter.condition_type || "static",
      evaluation_period: newFilter.evaluation_period || "now",
      evaluation_type: newFilter.evaluation_type || "boolean",
      ...(newFilter.value !== undefined && { value: newFilter.value }),
      ...(newFilter.evaluation_type === "rank" && {
        rank_min: newFilter.rank_min,
        rank_max: newFilter.rank_max,
      }),
    };

    onPrescanFiltersChange([...pre_conditions, filter], prescan_logic);
    setNewFilter({
      condition_type: "static",
      evaluation_period: "now",
      evaluation_type: "boolean",
    });
  };

  const handleUpdateFilter = () => {
    if (editingFilterIndex === null || !editingFilter) return;

    const updatedConditions = [...pre_conditions];
    updatedConditions[editingFilterIndex] = editingFilter;
    onPrescanFiltersChange(updatedConditions, prescan_logic);
    setEditingFilter(null);
    setEditingFilterIndex(null);
  };

  const handleDeleteFilter = (index: number) => {
    onPrescanFiltersChange(
      pre_conditions.filter((_, i) => i !== index),
      prescan_logic,
    );
  };

  const handleNewFilterChange = (updates: Partial<FilterCondition>) => {
    setNewFilter((prev) => ({ ...prev, ...updates }));
  };

  const handleEditFilterChange = (updates: Partial<FilterCondition>) => {
    setEditingFilter((prev) => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm mr-2"
        >
          <Target className="w-4 h-4 mr-1" />
          Pre-scan
          {pre_conditions.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {pre_conditions.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Pre-scan Filters</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Logic Operator */}
          {pre_conditions.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Pre-scan Logic Operator</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={prescan_logic}
                  onValueChange={(value) =>
                    onPrescanFiltersChange(
                      pre_conditions,
                      value as "and" | "or",
                    )
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="and">AND</SelectItem>
                    <SelectItem value="or">OR</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2">
                  {prescan_logic === "and"
                    ? "All pre-conditions must be true"
                    : "At least one pre-condition must be true"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Add New Filter */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Pre-scan Filter</CardTitle>
            </CardHeader>
            <CardContent>
              {renderFilterForm(newFilter, handleNewFilterChange)}
              <Button onClick={handleAddFilter} className="w-full mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add Pre-scan Filter
              </Button>
            </CardContent>
          </Card>

          {/* Edit Filter */}
          {editingFilter && (
            <Card>
              <CardHeader>
                <CardTitle>Edit Pre-scan Filter</CardTitle>
              </CardHeader>
              <CardContent>
                {renderFilterForm(editingFilter, handleEditFilterChange)}
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleUpdateFilter} className="flex-1">
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingFilter(null);
                      setEditingFilterIndex(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Filters */}
          {pre_conditions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Active Pre-scan Filters ({pre_conditions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {pre_conditions.map((condition, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          Pre-scan Filter {index + 1}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <Badge variant="outline" className="mr-2">
                            {condition.condition_type}
                          </Badge>
                          <Badge variant="outline" className="mr-2">
                            {condition.evaluation_period}
                            {condition.value && ` (${condition.value})`}
                          </Badge>
                          <Badge variant="outline" className="mr-2">
                            {condition.evaluation_type}
                          </Badge>
                          {condition.evaluation_type === "rank" && (
                            <>
                              {condition.rank_min && (
                                <Badge variant="secondary" className="mr-1">
                                  Min: {condition.rank_min}
                                </Badge>
                              )}
                              {condition.rank_max && (
                                <Badge variant="secondary" className="mr-1">
                                  Max: {condition.rank_max}
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                        <div className="text-sm mt-1 font-mono bg-gray-50 p-1 rounded">
                          {condition.expression}
                        </div>
                        {index < pre_conditions.length - 1 && (
                          <Badge variant="secondary" className="mt-1">
                            {prescan_logic.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingFilter({ ...condition });
                            setEditingFilterIndex(index);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFilter(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface FilterManagerProps {
  conditions: FilterCondition[];
  logic: "and" | "or";
  onFiltersChange: (conditions: FilterCondition[], logic: "and" | "or") => void;
}

const renderFilterForm = (
  filter: Partial<FilterCondition>,
  onChange: (updates: Partial<FilterCondition>) => void,
) => (
  <div className="space-y-4">
    <div>
      <Label>Condition Type</Label>
      <Select
        value={filter.condition_type}
        onValueChange={(value) => {
          onChange({
            condition_type: value as "static" | "computed",
            expression: "",
          });
        }}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="static">Static</SelectItem>
          <SelectItem value="computed">Computed</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div>
      <Label htmlFor="expression">Expression</Label>
      <Textarea
        id="expression"
        value={filter.expression || ""}
        onChange={(e) => onChange({ expression: e.target.value })}
        placeholder={
          filter.condition_type === "static"
            ? "Field name (e.g., price, volume, market_cap)"
            : "Formula (e.g., c/prv(c,30) > 1.2, rsi(14) > 70)"
        }
        rows={2}
      />
      <p className="text-sm text-muted-foreground mt-1">
        {filter.condition_type === "static"
          ? "Enter the field name you want to filter on"
          : "Enter a computed expression that evaluates to true/false or rank"}
      </p>
    </div>

    <div>
      <Label>Evaluation Period</Label>
      <Select
        value={filter.evaluation_period}
        onValueChange={(value) =>
          onChange({
            evaluation_period: value as "now" | "within_last" | "x_bar_ago",
            // Reset value when changing evaluation period
            value: value === "now" ? undefined : filter.value,
          })
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="now">Now</SelectItem>
          <SelectItem value="within_last">Within Last X Bars</SelectItem>
          <SelectItem value="x_bar_ago">X Bars Ago</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {(filter.evaluation_period === "within_last" ||
      filter.evaluation_period === "x_bar_ago") && (
      <div>
        <Label htmlFor="value">Value</Label>
        <Input
          id="value"
          type="number"
          value={filter.value || ""}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            onChange({ value: isNaN(val) ? undefined : val });
          }}
          placeholder="Number of bars"
        />
      </div>
    )}

    <div>
      <Label>Evaluation Type</Label>
      <Select
        value={filter.evaluation_type}
        onValueChange={(value) =>
          onChange({
            evaluation_type: value as "boolean" | "rank",
            // Reset rank fields when changing to boolean
            ...(value === "boolean" && {
              rank_min: undefined,
              rank_max: undefined,
            }),
          })
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="boolean">Boolean</SelectItem>
          <SelectItem value="rank">Rank</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground mt-1">
        {filter.evaluation_type === "boolean"
          ? "Filter returns true/false"
          : "Filter returns rank percentile (0-100)"}
      </p>
    </div>

    {filter.evaluation_type === "rank" && (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="rank_min">Min Rank</Label>
          <Input
            id="rank_min"
            type="number"
            min="0"
            max="100"
            value={filter.rank_min || ""}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onChange({ rank_min: isNaN(val) ? undefined : val });
            }}
            placeholder="0-100"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Minimum rank percentile
          </p>
        </div>
        <div>
          <Label htmlFor="rank_max">Max Rank</Label>
          <Input
            id="rank_max"
            type="number"
            min="0"
            max="100"
            value={filter.rank_max || ""}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onChange({ rank_max: isNaN(val) ? undefined : val });
            }}
            placeholder="0-100"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Maximum rank percentile
          </p>
        </div>
      </div>
    )}
  </div>
);

export function FilterManager({
  conditions,
  logic,
  onFiltersChange,
}: FilterManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<FilterCondition | null>(
    null,
  );
  const [editingFilterIndex, setEditingFilterIndex] = useState<number | null>(
    null,
  );
  const [newFilter, setNewFilter] = useState<Partial<FilterCondition>>({
    condition_type: "static",
    evaluation_period: "now",
    evaluation_type: "boolean",
  });

  const handleAddFilter = () => {
    if (!newFilter.expression) return;

    const filter: FilterCondition = {
      expression: newFilter.expression,
      condition_type: newFilter.condition_type || "static",
      evaluation_period: newFilter.evaluation_period || "now",
      evaluation_type: newFilter.evaluation_type || "boolean",
      ...(newFilter.value !== undefined && { value: newFilter.value }),
      ...(newFilter.evaluation_type === "rank" && {
        rank_min: newFilter.rank_min,
        rank_max: newFilter.rank_max,
      }),
    };

    onFiltersChange([...conditions, filter], logic);
    setNewFilter({
      condition_type: "static",
      evaluation_period: "now",
      evaluation_type: "boolean",
    });
  };

  const handleUpdateFilter = () => {
    if (editingFilterIndex === null || !editingFilter) return;

    const updatedConditions = [...conditions];
    updatedConditions[editingFilterIndex] = editingFilter;
    onFiltersChange(updatedConditions, logic);
    setEditingFilter(null);
    setEditingFilterIndex(null);
  };

  const handleDeleteFilter = (index: number) => {
    onFiltersChange(
      conditions.filter((_, i) => i !== index),
      logic,
    );
  };

  const handleNewFilterChange = (updates: Partial<FilterCondition>) => {
    setNewFilter((prev) => ({ ...prev, ...updates }));
  };

  const handleEditFilterChange = (updates: Partial<FilterCondition>) => {
    setEditingFilter((prev) => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm mr-2"
        >
          <Filter className="w-4 h-4 mr-1" />
          Filters
          {conditions.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {conditions.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Filters</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Logic Operator */}
          {conditions.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Logic Operator</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={logic}
                  onValueChange={(value) =>
                    onFiltersChange(conditions, value as "and" | "or")
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="and">AND</SelectItem>
                    <SelectItem value="or">OR</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2">
                  {logic === "and"
                    ? "All conditions must be true"
                    : "At least one condition must be true"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Add New Filter */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Filter</CardTitle>
            </CardHeader>
            <CardContent>
              {renderFilterForm(newFilter, handleNewFilterChange)}
              <Button onClick={handleAddFilter} className="w-full mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add Filter
              </Button>
            </CardContent>
          </Card>

          {/* Edit Filter */}
          {editingFilter && (
            <Card>
              <CardHeader>
                <CardTitle>Edit Filter</CardTitle>
              </CardHeader>
              <CardContent>
                {renderFilterForm(editingFilter, handleEditFilterChange)}
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleUpdateFilter} className="flex-1">
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingFilter(null);
                      setEditingFilterIndex(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Filters */}
          {conditions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active Filters ({conditions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {conditions.map((condition, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div className="flex-1">
                        <div className="font-medium">Filter {index + 1}</div>
                        <div className="text-sm text-muted-foreground">
                          <Badge variant="outline" className="mr-2">
                            {condition.condition_type}
                          </Badge>
                          <Badge variant="outline" className="mr-2">
                            {condition.evaluation_period}
                            {condition.value && ` (${condition.value})`}
                          </Badge>
                          <Badge variant="outline" className="mr-2">
                            {condition.evaluation_type}
                          </Badge>
                          {condition.evaluation_type === "rank" && (
                            <>
                              {condition.rank_min && (
                                <Badge variant="secondary" className="mr-1">
                                  Min: {condition.rank_min}
                                </Badge>
                              )}
                              {condition.rank_max && (
                                <Badge variant="secondary" className="mr-1">
                                  Max: {condition.rank_max}
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                        <div className="text-sm mt-1 font-mono bg-gray-50 p-1 rounded">
                          {condition.expression}
                        </div>
                        {index < conditions.length - 1 && (
                          <Badge variant="secondary" className="mt-1">
                            {logic.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingFilter({ ...condition });
                            setEditingFilterIndex(index);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFilter(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ColumnManagerProps {
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
}

// Generate column ID from display name
const generateColumnId = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

// Static field options based on defaultColumns - use field property as value
const staticFieldOptions = defaultColumns
  .map((col) => ({
    value: col.field || col.colId || "",
    label: col.headerName || col.colId || "",
    colId: col.colId || "",
  }))
  .filter((opt) => opt.value);

export function ColumnManager({
  columns,
  onColumnsChange,
}: ColumnManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<ColumnConfig | null>(null);
  const [editingColumnIndex, setEditingColumnIndex] = useState<number | null>(
    null,
  );
  const [newColumn, setNewColumn] = useState<Partial<ColumnConfig>>({
    type: "static",
  });

  const handleAddColumn = () => {
    if (!newColumn.name) return;

    const columnId = generateColumnId(newColumn.name);

    const column: ColumnConfig = {
      id: columnId,
      name: newColumn.name,
      type: newColumn.type || "static",
      ...(newColumn.type === "static" && {
        property_name: newColumn.property_name,
      }),
      ...(newColumn.type === "computed" && {
        expression: newColumn.expression,
      }),
      ...(newColumn.type === "condition" && {
        logic: newColumn.logic || "and",
        conditions: newColumn.conditions || [],
      }),
    };

    onColumnsChange([...columns, column]);
    setNewColumn({ type: "static" });
  };

  const handleUpdateColumn = () => {
    if (editingColumnIndex === null || !editingColumn) return;

    const updatedColumns = [...columns];
    updatedColumns[editingColumnIndex] = editingColumn;
    onColumnsChange(updatedColumns);
    setEditingColumn(null);
    setEditingColumnIndex(null);
  };

  const handleDeleteColumn = (id: string) => {
    onColumnsChange(columns.filter((col) => col.id !== id));
  };

  // Fixed update handlers to properly merge state
  const handleNewColumnChange = (updates: Partial<ColumnConfig>) => {
    setNewColumn((prev) => ({ ...prev, ...updates }));
  };

  const handleEditColumnChange = (updates: Partial<ColumnConfig>) => {
    setEditingColumn((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const renderColumnForm = (
    column: Partial<ColumnConfig>,
    onChange: (updates: Partial<ColumnConfig>) => void,
    isEditing = false,
  ) => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Display Name</Label>
        <Input
          id="name"
          value={column.name || ""}
          onChange={(e) => {
            const name = e.target.value;
            const updates: Partial<ColumnConfig> = { name };
            if (!isEditing) {
              updates.id = generateColumnId(name);
            }
            onChange(updates);
          }}
          placeholder="Column Name"
        />
      </div>

      {!isEditing && (
        <div>
          <Label>Column Type</Label>
          <Select
            value={column.type}
            onValueChange={(value) => {
              // Reset type-specific fields when changing type
              const updates: Partial<ColumnConfig> = {
                type: value as any,
                property_name: undefined,
                expression: undefined,
                logic: value === "condition" ? "and" : undefined,
                conditions: value === "condition" ? [] : undefined,
              };
              onChange(updates);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="static">Static</SelectItem>
              <SelectItem value="computed">Computed</SelectItem>
              <SelectItem value="condition">Condition</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {column.type === "static" && (
        <div>
          <Label htmlFor="property">Property Name</Label>
          <Select
            value={column.property_name}
            onValueChange={(fieldValue) => {
              // Find the selected option to get both field and colId
              const selectedOption = staticFieldOptions.find(
                (opt) => opt.value === fieldValue,
              );
              const updates: Partial<ColumnConfig> = {
                property_name: fieldValue,
              };
              if (selectedOption && !isEditing) {
                updates.id = selectedOption.colId;
              }
              onChange(updates);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a field" />
            </SelectTrigger>
            <SelectContent>
              {staticFieldOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {column.type === "computed" && (
        <div>
          <Label htmlFor="expression">Formula Expression</Label>
          <Textarea
            id="expression"
            value={column.expression || ""}
            onChange={(e) => onChange({ expression: e.target.value })}
            placeholder="c/sma(c,20)"
            rows={3}
          />
        </div>
      )}

      {column.type === "condition" && (
        <ConditionEditor
          logic={column.logic || "and"}
          conditions={column.conditions || []}
          onChange={(logic, conditions) => onChange({ logic, conditions })}
        />
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm"
        >
          <Settings className="w-4 h-4 mr-1" />
          Columns
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Columns</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Column */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Column</CardTitle>
            </CardHeader>
            <CardContent>
              {renderColumnForm(newColumn, handleNewColumnChange)}
              <Button onClick={handleAddColumn} className="w-full mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add Column
              </Button>
            </CardContent>
          </Card>

          {/* Edit Column */}
          {editingColumn && (
            <Card>
              <CardHeader>
                <CardTitle>Edit Column</CardTitle>
              </CardHeader>
              <CardContent>
                {renderColumnForm(editingColumn, handleEditColumnChange, true)}
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleUpdateColumn} className="flex-1">
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingColumn(null);
                      setEditingColumnIndex(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rest of existing columns display */}
          <Card>
            <CardHeader>
              <CardTitle>Existing Columns ({columns.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {columns.map((column, index) => (
                  <div
                    key={column.id}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{column.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {column.type} • {column.id}
                        {column.property_name &&
                          ` • Field: ${column.property_name}`}
                        {column.expression &&
                          ` • Formula: ${column.expression.substring(0, 30)}${column.expression.length > 30 ? "..." : ""}`}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingColumn({ ...column });
                          setEditingColumnIndex(index);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteColumn(column.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ConditionEditorProps {
  logic: "and" | "or";
  conditions: Array<{
    expression: string;
    condition_type: "computed";
    evaluation_period: "now" | "within_last" | "x_bar_ago";
    evaluation_type: "boolean" | "rank";
    value?: number;
    rank_min?: number;
    rank_max?: number;
  }>;
  onChange: (
    logic: "and" | "or",
    conditions: ConditionEditorProps["conditions"],
  ) => void;
}

function ConditionEditor({
  logic,
  conditions,
  onChange,
}: ConditionEditorProps) {
  const addCondition = () => {
    onChange(logic, [
      ...conditions,
      {
        expression: "",
        condition_type: "computed",
        evaluation_period: "now",
        evaluation_type: "boolean",
      },
    ]);
  };

  const updateCondition = (
    index: number,
    updates: Partial<(typeof conditions)[0]>,
  ) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    onChange(logic, newConditions);
  };

  const removeCondition = (index: number) => {
    onChange(
      logic,
      conditions.filter((_, i) => i !== index),
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Logic Operator</Label>
        <Select
          value={logic}
          onValueChange={(value) => onChange(value as any, conditions)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="and">AND</SelectItem>
            <SelectItem value="or">OR</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Conditions</Label>
        {conditions.map((condition, index) => (
          <div key={index} className="border p-3 rounded space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Condition {index + 1}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeCondition(index)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>

            <Textarea
              value={condition.expression}
              onChange={(e) =>
                updateCondition(index, { expression: e.target.value })
              }
              placeholder="c > sma(c, 20)"
              rows={2}
            />

            <div className="grid grid-cols-2 gap-2">
              <Select
                value={condition.evaluation_period}
                onValueChange={(value) =>
                  updateCondition(index, { evaluation_period: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="now">Now</SelectItem>
                  <SelectItem value="within_last">
                    Within Last X Bars
                  </SelectItem>
                  <SelectItem value="x_bar_ago">X Bars Ago</SelectItem>
                </SelectContent>
              </Select>

              {(condition.evaluation_period === "within_last" ||
                condition.evaluation_period === "x_bar_ago") && (
                <Input
                  type="number"
                  value={condition.value || ""}
                  onChange={(e) =>
                    updateCondition(index, { value: parseInt(e.target.value) })
                  }
                  placeholder="Value"
                />
              )}
            </div>

            <div>
              <Select
                value={condition.evaluation_type}
                onValueChange={(value) =>
                  updateCondition(index, {
                    evaluation_type: value as any,
                    // Reset rank fields when changing to boolean
                    ...(value === "boolean" && {
                      rank_min: undefined,
                      rank_max: undefined,
                    }),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="rank">Rank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {condition.evaluation_type === "rank" && (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={condition.rank_min || ""}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    updateCondition(index, {
                      rank_min: isNaN(val) ? undefined : val,
                    });
                  }}
                  placeholder="Min Rank"
                />
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={condition.rank_max || ""}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    updateCondition(index, {
                      rank_max: isNaN(val) ? undefined : val,
                    });
                  }}
                  placeholder="Max Rank"
                />
              </div>
            )}
          </div>
        ))}

        <Button onClick={addCondition} variant="outline" size="sm">
          <Plus className="w-3 h-3 mr-1" />
          Add Condition
        </Button>
      </div>
    </div>
  );
}
