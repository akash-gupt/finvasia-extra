import { ExchangeType } from './common';

export type GetTimeSeriesParams = {
  exchange: ExchangeType;
  token: string;
  startTime?: number;
  endTime?: number;
  /**
   * in minutes
   */
  interval?: string;
};

export class GetOriginalTimeSeriesResponseItem {
  stat: 'Ok';
  time: string;
  into: string;
  inth: string;
  intl: string;
  intc: string;
  intvwap: string;
  intv: string;
  intoi: string;
  v: string;
  oi: string;
}

export class GetTimeSeriesResponseItem {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: string;

  constructor(params: GetOriginalTimeSeriesResponseItem) {
    this.time = params.time;
    this.high = Number(params.inth);
    this.low = Number(params.intl);
    this.open = Number(params.into);
    this.volume = params.intv;
    this.close = Number(params.intc);
  }
}

export type GetTimeSeriesResponse = GetTimeSeriesResponseItem[];
