import { z } from 'zod';
import { sha256 } from './util';
import routes from './routes.json';
import ApiRequest from './ApiRequest';

const NOT_OK = 'Not_Ok';

interface OrderParams {
  exchange: string;
  tradingSymbol: string;
  transactionType: string;
  quantity: number;
  price: number;
  triggerPrice: number;
  disclosedQuantity: number;
  product: string;
  orderType: string;
  validity: string;
  tag: string;
}

interface ModifyOrderParams {
  exchange: string;
  tradingSymbol: string;
  quantity: number;
  price: number;
  triggerPrice: number;
  orderType: string;
  validity: string;
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

const orderParamSchema = z.object({
  exchange: z.string().transform((v) => v.toUpperCase()),
  tradingSymbol: z.string(),
  transactionType: z.enum(['s', 'S', 'b', 'B']).transform((v) => v.toUpperCase()),
  quantity: z
    .number()
    .positive()
    .transform((v) => v.toString()),
  price: z
    .number()
    .nonnegative()
    .default(0)
    .transform((v) => v.toString()),
  triggerPrice: z
    .number()
    .nonnegative()
    .default(0)
    .transform((v) => v.toString()),
  disclosedQuantity: z
    .number()
    .nonnegative()
    .default(0)
    .transform((v) => v.toString()),
  product: z.enum(['nrml', 'NRML', 'mis', 'MIS', 'cnc', 'CNC']).transform((v) => {
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
  }),
  orderType: z.enum(['m', 'M', 'l', 'L', 'sl', 'SL', 'sl-m', 'SL-M']).transform((v) => {
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
  }),
  validity: z
    .enum(['day', 'DAY', 'ioc', 'IOC'])
    .default('DAY')
    .transform((v) => v.toUpperCase()),
  tag: z.string().optional(),
});

const modifyOrderParamSchema = z.object({
  exchange: z.string().transform((v) => v.toUpperCase()),
  tradingSymbol: z.string(),
  quantity: z
    .number()
    .positive()
    .transform((v) => v.toString()),
  price: z
    .number()
    .nonnegative()
    .default(0)
    .transform((v) => v.toString()),
  triggerPrice: z
    .number()
    .nonnegative()
    .default(0)
    .transform((v) => v.toString()),
  orderType: z.enum(['m', 'M', 'l', 'L', 'sl', 'SL', 'sl-m', 'SL-M']).transform((v) => {
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
  }),
  validity: z
    .enum(['day', 'DAY', 'ioc', 'IOC'])
    .optional()
    .transform((v) => (v ? v.toUpperCase() : v)),
});

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

  async getOrders() {
    const data = await this.apiRequest.post('orders', {}, { uid: this.userId });
    if (Array.isArray(data)) {
      return data;
    }

    // handle no data response object
    if (data.emsg && data.emsg.includes('no data')) {
      return [];
    }

    // unknown data format
    throw data;
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

  async getQuote(exchange: string, token: string) {
    if (!exchange) {
      throw new Error('exchange is required');
    }
    if (!token) {
      throw new Error('token is required');
    }

    return this.apiRequest.post('market.quote', {}, { uid: this.userId, exch: exchange, token });
  }

  async placeOrder(params: OrderParams) {
    let parsed;
    try {
      parsed = orderParamSchema.parse(params);
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
      qty: parsed.quantity,
      prc: parsed.price,
      trgprc: parsed.triggerPrice,
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
      parsed = modifyOrderParamSchema.parse(params);
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
      qty: parsed.quantity,
      ret: parsed.validity,
    };
    if (parsed.orderType === 'SL-LMT' || parsed.orderType === 'SL-MKT') {
      payload.trgprc = parsed.triggerPrice;
    }
    if (parsed.orderType === 'SL-LMT' || parsed.orderType === 'LMT') {
      payload.prc = parsed.price;
    }

    const data = await this.apiRequest.post('orders.modify', {}, payload);
    data.orderId = data.result;
    delete data.result;
    return data;
  }
}

export default RestAPI;
