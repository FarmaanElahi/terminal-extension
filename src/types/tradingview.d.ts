interface Subscription<T> {
  subscribe: (id: string, cb: (p: T) => void) => void;
  unsubscribe: (cb: (p: T) => void) => void;
}

export interface ResolvedSymbol {
  source2: {
    country: string;
    description: string;
    "exchange-type": string;
    id: string;
    name: string;
    url: string;
  };
  currency_code: string;
  source_id: string;
  session_holidays: string;
  subsession_id: string;
  provider_id: string;
  currency_id: string;
  country: string;
  pro_perm: string;
  measure: string;
  allowed_adjustment: string;
  short_description: string;
  variable_tick_size: string;
  isin: string;
  language: string;
  name: string;
  full_name: string;
  pro_name: string;
  base_name: string[];
  description: string;
  exchange: string;
  pricescale: number;
  pointvalue: number;
  minmov: number;
  session: string;
  session_display: string;
  subsessions: Array<{
    description: string;
    id: string;
    private: boolean;
    session: string;
    "session-correction": string;
    "session-display": string;
  }>;
  type: string;
  typespecs: string[];
  has_intraday: boolean;
  fractional: boolean;
  listed_exchange: string;
  legs: string[];
  is_tradable: boolean;
  minmove2: number;
  timezone: string;
  aliases: string[];
  alternatives: any[];
  is_replayable: boolean;
  has_adjustment: boolean;
  has_extended_hours: boolean;
  bar_source: string;
  bar_transform: string;
  bar_fillgaps: boolean;
  visible_plots_set: string;
  "isin-displayed": string;
  "is-tickbars-available": boolean;
  figi: {
    "country-composite": string;
    "exchange-level": string;
  };
  corrections: string;
}

interface IOrderLine {
  // Getters
  getBodyBackgroundColor(): string;

  getBodyBorderColor(): string;

  getBodyFont(): string;

  getBodyTextColor(): string;

  getCancelButtonBackgroundColor(): string;

  getCancelButtonBorderColor(): string;

  getCancelButtonIconColor(): string;

  getCancelTooltip(): string;

  getCancellable(): boolean;

  getEditable(): boolean;

  getExtendLeft(): boolean;

  getLineColor(): string;

  getLineLength(): number;

  getLineLengthUnit(): OrderLineLengthUnit;

  getLineStyle(): number;

  getLineWidth(): number;

  getModifyTooltip(): string;

  getPrice(): number;

  getQuantity(): string;

  getQuantityBackgroundColor(): string;

  getQuantityBorderColor(): string;

  getQuantityFont(): string;

  getQuantityTextColor(): string;

  getText(): string;

  getTooltip(): string;

  // Event handlers
  onCancel(callback: () => void): this;

  onCancel<T>(data: T, callback: (data: T) => void): this;

  onModify(callback: () => void): this;

  onModify<T>(data: T, callback: (data: T) => void): this;

  onMove(callback: () => void): this;

  onMove<T>(data: T, callback: (data: T) => void): this;

  onMoving(callback: () => void): this;

  onMoving<T>(data: T, callback: (data: T) => void): this;

  // Setters
  setBodyBackgroundColor(value: string): this;

  setBodyBorderColor(value: string): this;

  setBodyFont(value: string): this;

  setBodyTextColor(value: string): this;

  setCancelButtonBackgroundColor(value: string): this;

  setCancelButtonBorderColor(value: string): this;

  setCancelButtonIconColor(value: string): this;

  setCancelTooltip(value: string): this;

  setCancellable(value: boolean): this;

  setEditable(value: boolean): this;

  setExtendLeft(value: boolean): this;

  setLineColor(value: string): this;

  setLineLength(value: number, unit?: OrderLineLengthUnit): this;

  setLineStyle(value: number): this;

  setLineWidth(value: number): this;

  setModifyTooltip(value: string): this;

  setPrice(value: number): this;

  setQuantity(value: string): this;

  setQuantityBackgroundColor(value: string): this;

  setQuantityBorderColor(value: string): this;

  setQuantityFont(value: string): this;

  setQuantityTextColor(value: string): this;

  setText(value: string): this;

  setTooltip(value: string): this;

  // Utility
  remove(): void;
}

export declare global {
  interface Window {
    TradingViewApi: TradingViewApi;
  }

  const TradingViewApi: {
    getSymbolInterval: () => { symbol: string; interval: string };
    changeSymbol: (symbol: string, interval: string) => void;
    chart: () => {
      onSymbolChanged: () => Subscription<ResolvedSymbol>;
      createOrderLine: () => Promise<IOrderLine>;
      crossHairMoved: () => Subscription<{ price: number; time: number }>;
    };
  };
}
