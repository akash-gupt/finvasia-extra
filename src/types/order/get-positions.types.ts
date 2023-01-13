import { ExchangeType } from '../common';

export class OriginalPositionResponseItem {
  stat: string;
  uid: string;
  actid: string;
  exch: string;
  token: string;
  tsym: string;
  prarr: string;
  pp: string;
  ls: string;
  ti: string;
  mult: string;
  prcftr: string;
  daybuyqty: string;
  daysellqty: string;
  daybuyamt: string;
  daybuyavgprc: string;
  daysellamt: string;
  daysellavgprc: string;
  cfbuyqty: string;
  cfsellqty: string;
  cfbuyamt: string;
  cfbuyavgprc: string;
  cfsellamt: string;
  cfsellavgprc: string;
  openbuyqty: string;
  opensellqty: string;
  openbuyamt: string;
  openbuyavgprc: string;
  opensellamt: string;
  opensellavgprc: string;
  netqty: string;
  netavgprc: string;
  lp: string;
  urmtom: string;
  rpnl: string;
  cforgavgprc: string;
  bep: string;
}

export class PositionResponseItem {
  symbol: string;
  symbolId: string;
  price: number;
  quantity: number;
  exchange: ExchangeType;
  ltp: number;
  realizedPnl: number;
  breakEvenPrice: number;

  constructor(params: OriginalPositionResponseItem) {
    this.symbol = params.tsym;
    this.symbolId = params.token;
    this.exchange = params.exch as ExchangeType;
    this.price = Number(params.netavgprc);
    this.quantity = Number(params.netqty);
    this.ltp = Number(params.lp);
    this.realizedPnl = Number(params.rpnl);
    this.breakEvenPrice = Number(params.bep);
  }
}
