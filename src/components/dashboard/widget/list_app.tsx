import { WidgetProps } from "./widget-props";
import { useListScan } from "@/lib/api.ts";
import { AgGridReact } from "ag-grid-react";
import { useCallback, useMemo, useState } from "react";
import { defaultColumns } from "@/components/symbols/columns.tsx";
import { ColDef } from "ag-grid-community";
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
import { Edit, Plus, Settings, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GetRowIdFunc } from "ag-grid-community";

export function ListApp(_props: WidgetProps) {
  const [state, setState] = useState({
    conditions: [],
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
        id: "test",
        name: "TI65",
        type: "computed",
        expression: "c/sma(c,65)",
      },
      {
        id: "m20_20",
        name: "M20",
        type: "computed",
        expression: "c/min(c,30)",
      },
      {
        id: "bullish_setup",
        name: "Bullish Setup",
        type: "condition",
        logic: "and",
        conditions: [
          {
            expression: "c > sma(c, 20)",
            condition_type: "computed",
            evaluation_period: "now",
          },
          {
            expression: "c > sma(c, 50)",
            condition_type: "computed",
            evaluation_period: "now",
          },
          {
            expression: "v > sma(v, 20)",
            condition_type: "computed",
            evaluation_period: "within_last",
            value: 3,
          },
        ],
      },
    ] as ColumnConfig[],
    logic: "and",
    sort_columns: [
      {
        column: "Bullish Setup",
        direction: "desc",
      },
    ],
  });

  const { data } = useListScan(state);

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
    () =>
      state.columns
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
          } as ColDef;
        })
        .filter((c) => c)
        .map((c) => c as ColDef),
    [state.columns, ignoreColumnsProperty],
  );

  const handleColumnsChange = (newColumns: ColumnConfig[]) => {
    setState((prevState) => ({
      ...prevState,
      columns: newColumns,
    }));
  };

  const getRowId = useCallback<GetRowIdFunc>((r) => r.data.ticker, []);

  return (
    <div className={"h-full flex flex-col relative"}>
      <ColumnManager
        columns={state.columns}
        onColumnsChange={handleColumnsChange}
      />
      <AgGridReact
        className="ag-terminal-theme flex-1"
        rowData={rows}
        getRowId={getRowId}
        columnDefs={columns}
      />
    </div>
  );
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
          className="absolute top-2 right-2 z-10 bg-white/90 backdrop-blur-sm"
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
