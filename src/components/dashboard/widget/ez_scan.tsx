import { WidgetProps } from "./widget-props";
import { useListScan } from "@/lib/api.ts";
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
import { Edit, Filter, Plus, Settings, Trash2, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useSymbolSwitcher } from "@/hooks/use-symbol.tsx";

export function EZScanApp(_props: WidgetProps) {
  const [state, setState] = useState({
    market: "india",
    conditions: [] as FilterCondition[],
    columns: [
      {
        id: "name",
        // Header
        name: "Name",
        type: "static",
        // Field in the db
        property_name: "name",
      },
      {
        id: "logo",
        name: "Logo",
        type: "static",
        property_name: "logo",
      },
      {
        id: "price",
        name: "Price",
        type: "computed",
        expression: "c",
      },
      {
        id: "change",
        name: "Change%",
        type: "computed",
        expression: "(c/prv(c) -1 ) * 100",
      },
      {
        id: "net_change",
        name: "Net Change",
        type: "computed",
        expression: "c - prv(c)",
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

  const { data, isFetching } = useListScan(state);

  const switcher = useSymbolSwitcher();
  const onCellFocused = useCallback(
    (event: CellFocusedEvent) => {
      // If the cell was focus because of selection change, we will ignore
      // switching the symbol
      if ((event.column as AgColumn)?.colId === "ag-Grid-SelectionColumn") {
        return;
      }

      const { rowIndex } = event;
      if (rowIndex === undefined || rowIndex === null) return;
      const symbol = event.api.getDisplayedRowAtIndex(rowIndex)?.data;
      if (!symbol) return;
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

  const handleMarketChange = (market: string) => {
    setState((prevState) => ({
      ...prevState,
      market,
    }));
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
      <div className="flex justify-end">
        <MarketManager
          market={state.market}
          onMarketChange={handleMarketChange}
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

      <AgGridReact
        className="ag-terminal-theme flex-1"
        autoSizeStrategy={{ type: "fitCellContents" }}
        rowData={isFetching ? undefined : rows}
        loading={isFetching}
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
  value?: number;
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
    value?: number;
  }>;
}

interface FilterManagerProps {
  conditions: FilterCondition[];
  logic: "and" | "or";
  onFiltersChange: (conditions: FilterCondition[], logic: "and" | "or") => void;
}

export function FilterManager({
  conditions,
  logic,
  onFiltersChange,
}: FilterManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<FilterCondition | null>(
    null,
  );
  const [newFilter, setNewFilter] = useState<Partial<FilterCondition>>({
    condition_type: "static",
    evaluation_period: "now",
  });

  const handleAddFilter = () => {
    if (!newFilter.expression) return;

    const filter: FilterCondition = {
      expression: newFilter.expression,
      condition_type: newFilter.condition_type || "static",
      evaluation_period: newFilter.evaluation_period || "now",
      ...(newFilter.value !== undefined && { value: newFilter.value }),
    };

    onFiltersChange([...conditions, filter], logic);
    setNewFilter({
      condition_type: "static",
      evaluation_period: "now",
    });
  };

  const handleUpdateFilter = () => {
    if (!editingFilter) return;

    const updatedConditions = conditions.map((condition) =>
      condition === conditions.find((c) => c === editingFilter)
        ? editingFilter
        : condition,
    );
    onFiltersChange(updatedConditions, logic);
    setEditingFilter(null);
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
            : "Enter a computed expression that evaluates to true/false"}
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
                    onClick={() => setEditingFilter(null)}
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
                          onClick={() => setEditingFilter({ ...condition })}
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
    if (!editingColumn) return;

    const updatedColumns = columns.map((col) =>
      col.id === editingColumn.id ? editingColumn : col,
    );
    onColumnsChange(updatedColumns);
    setEditingColumn(null);
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
                    onClick={() => setEditingColumn(null)}
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
                {columns.map((column) => (
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
                        onClick={() => setEditingColumn({ ...column })}
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
    value?: number;
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
