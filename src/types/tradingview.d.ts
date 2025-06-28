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

export declare global {
  const TradingViewApi: {
    getSymbolInterval: () => { symbol: string; interval: string };
    changeSymbol: (symbol: string, interval: string) => void;
    chart: () => {
      onSymbolChanged: () => Subscription<ResolvedSymbol>;
    };
  };
}
