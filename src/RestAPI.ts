import { string, z } from 'zod';
import { sha256 } from './util';
import routes from './routes.json';
import ApiRequest from './ApiRequest';
import {
  CreateOrderParams,
  ExchangeType,
  GetOriginalTimeSeriesResponseItem,
  GetTimeSeriesParams,
  GetTimeSeriesResponse,
  GetTimeSeriesResponseItem,
  ModifyOrderParams,
  OrderType,
  OriginalPositionResponseItem,
  PositionResponseItem,
  ProductType,
  TransactionType,
} from './types';
import { plainToClass } from 'class-transformer';

const NOT_OK = 'Not_Ok';

export interface SearchParams {
  exchange: ExchangeType;
  text: string;
}

interface SearchResponseItem {
  cname: string;
  exch: ExchangeType;
  instname: string;
  ls: string;
  pp: string;
  ti: string;
  token: string;
  tsym: string;
}

interface SearchResponse {
  values: SearchResponseItem[];
}

export interface OrderResponse {
  request_time: string;
  stat: 'Ok';
  orderId: string;
}

interface ModifyOrderApiParams {
  uid: string | undefined | null;
  norenordno: string | undefined | null;
  exch: string | undefined | null;
  tsym: string | undefined | null;
  prctyp: string | undefined | null;
  prc?: string | undefined | null;
  trgprc?: string | undefined | null;
  qty: string | undefined | null;
  ret: string | undefined | null;
}

class OriginalOrderHistoryResponseItem {
  actid: string;
  exch: ExchangeType;
  kidid: string;
  ls: string;
  mult: string;
  norenordno: string;
  norentm: string;
  pp: string;
  prc: string;
  prcftr: string;
  prctyp: OrderType;
  prd: ProductType;
  qty: string;
  rejreason: string;
  ret: string;
  st_intrn: string;
  stat: 'Ok';
  status: 'REJECTED' | 'SUCCESS';
  ti: string;
  token: string;
  trantype: TransactionType;
  tsym: string;
  uid: string;
  dname: string;
}

class OrderHistoryResponseItem {
  symbolFullName: string;
  symbol: string;
  symbolId: string;
  price: number;
  quantity: number;
  orderNumber: string;
  product: ProductType;
  orderType: OrderType;
  transactionType: TransactionType;
  status: 'REJECTED' | 'SUCCESS';
  createdAt: string;

  constructor(params: OriginalOrderHistoryResponseItem) {
    this.orderNumber = params.norenordno;
    this.orderType = params.prctyp;
    this.price = Number(params.prc);
    this.quantity = Number(params.qty);
    this.status = params.status;
    this.product = params.prd;
    this.transactionType = params.trantype;
    this.symbol = params.tsym;
    this.symbolFullName = params.dname;
    this.symbolId = params.token;
    this.createdAt = new Date().toString();
  }
}

type OrderHistoryResponse = OrderHistoryResponseItem[];

const transformOrderType = (v: string) => {
  switch (v.toUpperCase()) {
    case 'M':
      return 'MKT';
    case 'L':
      return 'LMT';
    case 'SL':
      return 'SL-LMT';
    case 'SL-M':
      return 'SL-MKT';
    default:
      return v;
  }
};

const transformProduct = (v: string) => {
  switch (v.toUpperCase()) {
    case 'NRML':
      return 'M';
    case 'MIS':
      return 'I';
    case 'CNC':
      return 'C';
    default:
      return v;
  }
};

class RestAPI {
  static routes = routes;
  static baseURL = `https://api.shoonya.com/NorenWClientTP`;
  apiRequest: ApiRequest;
  debug: boolean;
  accessToken: string | undefined;
  userId: string | undefined;
  accountId: string | undefined;

  constructor(options: { userId: string | undefined; accessToken: string | undefined; debug: boolean }) {
    if (!options) {
      options = Object.assign({ userId: undefined, accessToken: undefined, debug: false }, options);
    }

    this.userId = options.userId;
    this.accountId = options.userId;
    this.accessToken = options.accessToken;
    this.debug = !!options.debug;

    // initialize ApiRequest instance
    this.apiRequest = new ApiRequest(RestAPI.baseURL, RestAPI.routes, this.accessToken);
    this.apiRequest.debug = !!options.debug;
  }

  setUserId(userId: string) {
    this.userId = userId;
    this.accountId = userId;
  }

  setAccessToken(accessToken: string) {
    this.accessToken = accessToken;
    this.apiRequest.setAccessToken(this.accessToken);
  }

  async login(userId: string, password: string, factor2: string, vendorCode: string, apiKey: string, imei?: string) {
    const payload = {
      source: 'API',
      apkversion: 'js:1.0.0',
      uid: userId,
      pwd: sha256(password),
      factor2,
      vc: vendorCode,
      appkey: sha256(`${userId}|${apiKey}`),
      imei: imei || 'api',
    };

    const data = await this.apiRequest.post('auth.login', {}, payload);

    // api returns status code 200 event for failed login
    if (data.stat === NOT_OK || !data.susertoken) {
      throw new Error(data.emsg || 'Login failed');
    }

    this.setAccessToken(data.susertoken);
    this.setUserId(data.actid);

    return data;
  }

  async getOrders(): Promise<OrderHistoryResponse> {
    const data = await this.apiRequest.post('orders', {}, { uid: this.userId });
    if (Array.isArray(data)) {
      return data.map((item: OriginalOrderHistoryResponseItem) => new OrderHistoryResponseItem(item));
    }

    // handle no data response object
    if (data.emsg && data.emsg.includes('no data')) {
      return [];
    }

    // unknown data format
    throw data.map((item: any) => ({
      ...item,
      product: transformProduct(item.prd),
      orderType: transformOrderType(item.prctyp),
    }));
  }

  async getTimeSeries(params: GetTimeSeriesParams): Promise<GetTimeSeriesResponse> {
    const data = await this.apiRequest.post(
      'market.series',
      {},
      {
        uid: this.userId,
        exch: params.exchange,
        token: params.token,
        st: params.startTime?.toString(),
        et: params.endTime?.toString(),
        intrv: params.interval,
      }
    );

    return data.map((item: GetOriginalTimeSeriesResponseItem) => new GetTimeSeriesResponseItem(item));
  }

  async getOrderHistory(orderId: string) {
    if (!orderId) {
      throw new Error('orderId is required');
    }

    const data = await this.apiRequest.post('orders.history', {}, { uid: this.userId, norenordno: orderId });

    // handle error response object
    if (data.stat === NOT_OK) {
      if (data.emsg && data.emsg.includes('UnAuthorized Order access')) {
        throw {
          status: 404,
          message: 'Order id not found',
          errorType: 'FinvasiaApiError',
        };
      } else {
        throw data;
      }
    }

    return data;
  }

  async getPositionsBook(): Promise<PositionResponseItem[]> {
    const data = await this.apiRequest.post('positions.book', {}, {});
    return data.map((item: OriginalPositionResponseItem) => new PositionResponseItem(item));
  }

  async getQuote(exchange: string, token: string) {
    if (!exchange) {
      throw new Error('exchange is required');
    }
    if (!token) {
      throw new Error('token is required');
    }

    return this.apiRequest.post('market.quote', {}, { uid: this.userId, exch: exchange, token });
  }

  async searchScript(params: SearchParams): Promise<SearchResponse> {
    return this.apiRequest.post('market.search', {}, { uid: this.userId, exch: params.exchange, stext: params.text });
  }

  async placeOrder(params: CreateOrderParams): Promise<OrderResponse> {
    let parsed;
    try {
      parsed = plainToClass(CreateOrderParams, params);
    } catch (error: any) {
      const validationError = error.format();
      validationError.errorType = 'FinvasiaValidationError';
      throw validationError;
    }

    const payload = {
      uid: this.userId,
      actid: this.accountId,
      exch: parsed.exchange,
      tsym: parsed.tradingSymbol,
      trantype: parsed.transactionType,
      qty: parsed.quantity.toString(),
      prc: parsed.price.toString(),
      trgprc: parsed.triggerPrice?.toString(),
      dscqty: parsed.disclosedQuantity,
      prd: parsed.product,
      prctyp: parsed.orderType,
      ret: parsed.validity,
      remarks: parsed.tag,
    };

    const data = await this.apiRequest.post('orders.place', {}, payload);
    data.orderId = data.norenordno;
    delete data.norenordno;
    return data;
  }

  async cancelOrder(orderId: string) {
    if (!orderId) {
      throw new Error('orderId is required');
    }

    const data = await this.apiRequest.post('orders.cancel', {}, { uid: this.userId, norenordno: orderId });
    data.orderId = data.result;
    delete data.result;
    return data;
  }

  async modifyOrder(orderId: string, params: ModifyOrderParams) {
    if (!orderId) {
      throw new Error('orderId is required');
    }

    let parsed;
    try {
      parsed = plainToClass(ModifyOrderParams, params);
    } catch (error: any) {
      const validationError = error.format();
      validationError.errorType = 'FinvasiaValidationError';
      throw validationError;
    }

    const payload: ModifyOrderApiParams = {
      uid: this.userId,
      norenordno: orderId,
      exch: parsed.exchange,
      tsym: parsed.tradingSymbol,
      prctyp: parsed.orderType,
      prc: '0',
      qty: parsed.quantity.toString(),
      ret: parsed.validity,
    };
    if (parsed.orderType === 'SL-LMT' || parsed.orderType === 'SL-MKT') {
      payload.trgprc = parsed.triggerPrice?.toString();
    }
    if (parsed.orderType === 'SL-LMT' || parsed.orderType === 'LMT') {
      payload.prc = parsed.price.toString();
    }

    const data = await this.apiRequest.post('orders.modify', {}, payload);
    data.orderId = data.result;
    delete data.result;
    return data;
  }
}

export default RestAPI;
