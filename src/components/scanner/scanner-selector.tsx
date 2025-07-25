import {
  Check,
  ChevronsUpDown,
  Copy,
  Edit,
  Loader2,
  Plus,
  Trash,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button, buttonVariants } from "@/components/ui/button";
import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  useAllScanner,
  useCreateScanner,
  useDeleteScanner,
  useScanners,
  useSymbolSearch,
  useUpdateScanner,
} from "@/lib/api";
import { toast } from "sonner";
import { Scanner } from "@/types/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useCurrentScanner } from "@/hooks/use-active-scanner";

export function ScannerSelector() {
  const { scannerId, setScannerId, types, type } = useCurrentScanner();
  const { data: scanners = [] } = useScanners(types);
  const [open, setOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [newScanner, setNewScanner] = useState<Scanner>();
  const activeScanner = scanners?.find((s) => s.id === scannerId);
  const [editMode, setEditMode] = useState<"clone" | "update">();

  return (
    <div className="flex gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            size="sm"
            aria-expanded={open}
            className="w-[200px] justify-between "
            onClick={() => {
              if (!activeScanner) setOpen(!open);
            }}
          >
            {activeScanner?.name || `Select ${type}...`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder={`Search ${type}...`} className="h-9" />
            <CommandList>
              <CommandEmpty>No {type} found.</CommandEmpty>
              <CommandGroup>
                {scanners.map((scanner) => (
                  <CommandItem
                    key={scanner.id}
                    className=" group relative"
                    value={scanner.id}
                    onSelect={(currentValue) => {
                      setScannerId(
                        currentValue === scannerId ? null : currentValue,
                      );
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        scannerId === scanner.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="flex-1">{scanner.name}</span>
                    <Button
                      className="opacity-0 group-hover:opacity-100 h-7 w-7"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setScannerId(scanner.id);
                        setEditMode("update");
                        setNewScanner(scanner);
                        setOpenDialog(true);
                      }}
                    >
                      <Edit size="3" />
                    </Button>
                    <Button
                      className="opacity-0 group-hover:opacity-100 h-7 w-7"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewScanner(scanner);
                        setEditMode("clone");
                        setOpenDialog(true);
                      }}
                    >
                      <Copy size="3" />
                    </Button>
                    <DeleteScanner scanner={scanner}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 h-7 w-7"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash size="3" />
                      </Button>
                    </DeleteScanner>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setNewScanner(undefined);
          setOpenDialog(true);
        }}
      >
        <Plus className="size-4" />
      </Button>

      {
        <CreateScanner
          open={openDialog}
          setOpen={setOpenDialog}
          default={newScanner}
          newMode={editMode}
        />
      }
    </div>
  );
}

export function CreateScanner({
  open,
  setOpen,
  default: defaultState,
  newMode,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  default?: Scanner;
  newMode?: "clone" | "update";
}) {
  const { types, setScannerId, type } = useCurrentScanner();
  const { data: all } = useAllScanner();
  const { data: watchlists = [] } = useScanners(types);

  const [listType, setListType] = useState<Scanner["type"]>("simple");
  const [selectedWatchlists, setSelectedWatchlists] = useState<string[]>([]);
  const [selectedScreeners, setSelectedScreeners] = useState<string[]>([]);
  const [symbolInput, setSymbolInput] = useState("");
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const { data: symbolResults = [], isLoading: isSearching } =
    useSymbolSearch(symbolInput);

  const { mutate: create, isPending: isCreatePending } = useCreateScanner(
    (scanner) => {
      setOpen(false);
      toast(`${scanner.name} created!`);
      setScannerId(scanner.id);
    },
  );

  const { mutate: update, isPending: isUpdatedPending } = useUpdateScanner(
    (scanner) => {
      setOpen(false);
      toast(`${scanner.name} updated!`);
      setScannerId(scanner.id);
    },
  );

  const [scannerName, setNewScannerName] = useState<string>("");

  useEffect(() => {
    if (open) {
      const watchlist =
        all
          ?.filter(
            (a) =>
              a.type === "simple" && defaultState?.combo_lists?.includes(a.id),
          )
          .map((s) => s.id) ?? [];

      const screener =
        all
          ?.filter(
            (a) =>
              a.type === "screener" &&
              defaultState?.combo_lists?.includes(a.id),
          )
          .map((s) => s.id) ?? [];
      setNewScannerName(defaultState?.name || "");
      setListType(defaultState?.type ?? "simple");
      setSelectedWatchlists(watchlist);
      setSelectedScreeners(screener);
      setSelectedSymbols(defaultState?.symbols || []);
      setSymbolInput("");
    }
  }, [defaultState, open, all]);

  const { data: screeners = [] } = useScanners(["screener"]);

  const handleSubmit = () => {
    if (defaultState?.id && newMode === "update") {
      return handleUpdate();
    }
    handleCreate();
  };
  const handleUpdate = () => {
    if (defaultState?.id) {
      update({
        id: defaultState.id,
        payload: {
          type: listType,
          name: scannerName,
          state: defaultState?.state,
          combo_lists: [...selectedWatchlists, ...selectedScreeners],
          symbols: selectedSymbols,
        },
      });
    }
  };
  const handleCreate = () => {
    if (type === "Screener") {
      create({
        type: "screener",
        name: scannerName,
        state: defaultState?.state,
      });
    }
    if (type === "Watchlist") {
      if (listType === "simple") {
        create({
          type: "simple",
          name: scannerName,
          state: defaultState?.state,
          symbols: selectedSymbols,
        });
      }
      if (listType === "combo") {
        create({
          type: "combo",
          name: scannerName,
          state: defaultState?.state,
          combo_lists: [...selectedWatchlists, ...selectedScreeners],
          symbols: [],
        });
      }
    }
    setOpen(false);
  };

  const handleWatchlistSelection = (watchlistId: string) => {
    setSelectedWatchlists((prevSelected) =>
      prevSelected.includes(watchlistId)
        ? prevSelected.filter((id) => id !== watchlistId)
        : [...prevSelected, watchlistId],
    );
  };

  const handleScreenerSelection = (screenerId: string) => {
    setSelectedScreeners((prevSelected) =>
      prevSelected.includes(screenerId)
        ? prevSelected.filter((id) => id !== screenerId)
        : [...prevSelected, screenerId],
    );
  };

  const addSymbol = (symbol: string) => {
    if (!selectedSymbols.includes(symbol)) {
      setSelectedSymbols([...selectedSymbols, symbol]);
      setSymbolInput("");
    }
  };

  const removeSymbol = (symbol: string) => {
    setSelectedSymbols(selectedSymbols.filter((s) => s !== symbol));
  };

  const disabled = useMemo(() => {
    if (scannerName) return false;
    if (type === "Watchlist") {
      if (listType === "combo") {
        return (
          selectedWatchlists.length === 0 && selectedScreeners.length === 0
        );
      }
      if (listType === "simple") {
        return selectedSymbols.length === 0;
      }
    }
    return true;
  }, [
    type,
    listType,
    selectedWatchlists,
    selectedScreeners,
    selectedSymbols,
    scannerName,
  ]);

  const isPending = defaultState ? isUpdatedPending : isCreatePending;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {defaultState?.name ? `Clone ${type}` : `Create New ${type}`}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{type} Name</Label>
            <Input
              id="name"
              value={scannerName}
              onChange={(e) => setNewScannerName(e.target.value)}
              placeholder={`Enter ${type} name`}
            />
          </div>

          {type === "Watchlist" && (
            <div className="grid gap-2">
              <Label>List Type</Label>
              <Tabs
                defaultValue="simple"
                value={listType}
                onValueChange={(value) =>
                  setListType(value as "simple" | "combo")
                }
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="simple">Simple List</TabsTrigger>
                  <TabsTrigger value="combo">Combo List</TabsTrigger>
                </TabsList>

                <TabsContent value="simple">
                  <div className="py-2 space-y-4">
                    <div className="text-sm text-muted-foreground">
                      A simple list contains individual symbols only.
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="symbol-search">Add Symbols</Label>

                      {/* Symbol search input with integrated tag management */}
                      <div className="flex flex-wrap min-h-10 px-3 py-2 border rounded-md gap-1 focus-within:ring-1 focus-within:ring-ring">
                        {selectedSymbols.map((symbol) => (
                          <Badge
                            key={symbol}
                            variant="secondary"
                            className="flex items-center gap-1 h-6"
                          >
                            {symbol}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => removeSymbol(symbol)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}

                        <div className="flex-1 min-w-[8rem]">
                          <Input
                            id="symbol-search"
                            value={symbolInput}
                            onChange={(e) => setSymbolInput(e.target.value)}
                            placeholder={
                              selectedSymbols.length === 0
                                ? "Search for symbols (e.g., AAPL, MSFT)"
                                : "Add more symbols..."
                            }
                            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-6 p-0"
                          />
                        </div>
                      </div>

                      {/* Symbol search results dropdown */}
                      {symbolInput.trim() !== "" && (
                        <div className="relative">
                          {isSearching ? (
                            <div className="absolute top-0 w-full border rounded-md p-3 flex items-center justify-center bg-background z-10">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
                              <span className="text-sm text-muted-foreground">
                                Searching...
                              </span>
                            </div>
                          ) : symbolResults.length > 0 ? (
                            <div className="absolute top-0 w-full border rounded-md max-h-[200px] overflow-y-auto bg-background z-10">
                              <Command>
                                <CommandList>
                                  <CommandGroup>
                                    {symbolResults.map((result) => (
                                      <CommandItem
                                        key={result.ticker}
                                        onSelect={() => {
                                          addSymbol(result.ticker as string);
                                        }}
                                        className="flex justify-between cursor-pointer"
                                      >
                                        <div className="flex items-center">
                                          <span className="mr-2">
                                            {result.name}
                                          </span>
                                          <span className="text-sm text-muted-foreground truncate">
                                            {result.description || result.name}
                                          </span>
                                        </div>
                                        <Plus className="h-4 w-4 opacity-70" />
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </div>
                          ) : (
                            <div className="absolute top-0 w-full border rounded-md p-3 bg-background z-10">
                              <p className="text-sm text-muted-foreground">
                                No matching symbols found
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Help text for selected symbols */}
                      <div className="text-xs text-muted-foreground mt-1">
                        {selectedSymbols.length === 0
                          ? "Search and select symbols to add to your watchlist"
                          : `${selectedSymbols.length} symbol${selectedSymbols.length > 1 ? "s" : ""} selected`}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="combo">
                  <div className="py-2 space-y-4">
                    <div className="text-sm text-muted-foreground mb-2">
                      A combo list can include multiple watchlists and
                      screeners.
                    </div>

                    <div className="space-y-2">
                      <Label>Select Watchlists</Label>
                      <div className="border rounded-md p-3 max-h-[150px] overflow-y-auto">
                        {watchlists.length > 0 ? (
                          watchlists.map((list) => (
                            <div
                              key={list.id}
                              className="flex items-center space-x-2 py-1"
                            >
                              <Checkbox
                                id={`watchlist-${list.id}`}
                                checked={selectedWatchlists.includes(list.id)}
                                onCheckedChange={() =>
                                  handleWatchlistSelection(list.id)
                                }
                              />
                              <Label
                                htmlFor={`watchlist-${list.id}`}
                                className="cursor-pointer"
                              >
                                {list.name}
                              </Label>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground py-1">
                            No watchlists available
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Select Screeners</Label>
                      <div className="border rounded-md p-3 max-h-[150px] overflow-y-auto">
                        {screeners.map((screener) => (
                          <div
                            key={screener.id}
                            className="flex items-center space-x-2 py-1"
                          >
                            <Checkbox
                              id={`screener-${screener.id}`}
                              checked={selectedScreeners.includes(screener.id)}
                              onCheckedChange={() =>
                                handleScreenerSelection(screener.id)
                              }
                            />
                            <Label
                              htmlFor={`screener-${screener.id}`}
                              className="cursor-pointer"
                            >
                              {screener.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button disabled={disabled} onClick={handleSubmit}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {defaultState?.name && newMode === "update"
              ? "Update"
              : defaultState?.name && newMode === "clone"
                ? "Clone"
                : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteScanner({
  scanner,
  children,
}: {
  scanner: Scanner;
  children: ReactNode;
}) {
  const { type } = useCurrentScanner();
  const { mutate: deleteScanner } = useDeleteScanner(() =>
    toast(`Deleted ${scanner.name}`),
  );

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {type}</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete
            <span className=" text-destructive"> {scanner.name}</span> watchlist
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            onClick={() => deleteScanner(scanner.id)}
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
