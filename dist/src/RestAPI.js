"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const util_1 = require("./util");
const routes_json_1 = __importDefault(require("./routes.json"));
const ApiRequest_1 = __importDefault(require("./ApiRequest"));
const NOT_OK = 'Not_Ok';
const orderParamSchema = zod_1.z.object({
    exchange: zod_1.z.string().transform((v) => v.toUpperCase()),
    tradingSymbol: zod_1.z.string(),
    transactionType: zod_1.z.enum(['s', 'S', 'b', 'B']).transform((v) => v.toUpperCase()),
    quantity: zod_1.z
        .number()
        .positive()
        .transform((v) => v.toString()),
    price: zod_1.z
        .number()
        .nonnegative()
        .default(0)
        .transform((v) => v.toString()),
    triggerPrice: zod_1.z
        .number()
        .nonnegative()
        .default(0)
        .transform((v) => v.toString()),
    disclosedQuantity: zod_1.z
        .number()
        .nonnegative()
        .default(0)
        .transform((v) => v.toString()),
    product: zod_1.z.enum(['nrml', 'NRML', 'mis', 'MIS', 'cnc', 'CNC']).transform((v) => {
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
    orderType: zod_1.z.enum(['m', 'M', 'l', 'L', 'sl', 'SL', 'sl-m', 'SL-M']).transform((v) => {
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
    validity: zod_1.z
        .enum(['day', 'DAY', 'ioc', 'IOC'])
        .default('DAY')
        .transform((v) => v.toUpperCase()),
    tag: zod_1.z.string().optional(),
});
const modifyOrderParamSchema = zod_1.z.object({
    exchange: zod_1.z.string().transform((v) => v.toUpperCase()),
    tradingSymbol: zod_1.z.string(),
    quantity: zod_1.z
        .number()
        .positive()
        .transform((v) => v.toString()),
    price: zod_1.z
        .number()
        .nonnegative()
        .default(0)
        .transform((v) => v.toString()),
    triggerPrice: zod_1.z
        .number()
        .nonnegative()
        .default(0)
        .transform((v) => v.toString()),
    orderType: zod_1.z.enum(['m', 'M', 'l', 'L', 'sl', 'SL', 'sl-m', 'SL-M']).transform((v) => {
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
    validity: zod_1.z
        .enum(['day', 'DAY', 'ioc', 'IOC'])
        .optional()
        .transform((v) => (v ? v.toUpperCase() : v)),
});
class RestAPI {
    constructor(options) {
        if (!options) {
            options = Object.assign({ userId: undefined, accessToken: undefined, debug: false }, options);
        }
        this.userId = options.userId;
        this.accountId = options.userId;
        this.accessToken = options.accessToken;
        this.debug = !!options.debug;
        // initialize ApiRequest instance
        this.apiRequest = new ApiRequest_1.default(RestAPI.baseURL, RestAPI.routes, this.accessToken);
        this.apiRequest.debug = !!options.debug;
    }
    setUserId(userId) {
        this.userId = userId;
        this.accountId = userId;
    }
    setAccessToken(accessToken) {
        this.accessToken = accessToken;
        this.apiRequest.setAccessToken(this.accessToken);
    }
    login(userId, password, factor2, vendorCode, apiKey, imei) {
        return __awaiter(this, void 0, void 0, function* () {
            const payload = {
                source: 'API',
                apkversion: 'js:1.0.0',
                uid: userId,
                pwd: (0, util_1.sha256)(password),
                factor2,
                vc: vendorCode,
                appkey: (0, util_1.sha256)(`${userId}|${apiKey}`),
                imei: imei || 'api',
            };
            const data = yield this.apiRequest.post('auth.login', {}, payload);
            // api returns status code 200 event for failed login
            if (data.stat === NOT_OK || !data.susertoken) {
                throw new Error(data.emsg || 'Login failed');
            }
            this.setAccessToken(data.susertoken);
            this.setUserId(data.actid);
            return data;
        });
    }
    getOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.apiRequest.post('orders', {}, { uid: this.userId });
            if (Array.isArray(data)) {
                return data;
            }
            // handle no data response object
            if (data.emsg && data.emsg.includes('no data')) {
                return [];
            }
            // unknown data format
            throw data;
        });
    }
    getOrderHistory(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!orderId) {
                throw new Error('orderId is required');
            }
            const data = yield this.apiRequest.post('orders.history', {}, { uid: this.userId, norenordno: orderId });
            // handle error response object
            if (data.stat === NOT_OK) {
                if (data.emsg && data.emsg.includes('UnAuthorized Order access')) {
                    throw {
                        status: 404,
                        message: 'Order id not found',
                        errorType: 'FinvasiaApiError',
                    };
                }
                else {
                    throw data;
                }
            }
            return data;
        });
    }
    getQuote(exchange, token) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!exchange) {
                throw new Error('exchange is required');
            }
            if (!token) {
                throw new Error('token is required');
            }
            return this.apiRequest.post('market.quote', {}, { uid: this.userId, exch: exchange, token });
        });
    }
    placeOrder(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let parsed;
            try {
                parsed = orderParamSchema.parse(params);
            }
            catch (error) {
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
            const data = yield this.apiRequest.post('orders.place', {}, payload);
            data.orderId = data.norenordno;
            delete data.norenordno;
            return data;
        });
    }
    cancelOrder(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!orderId) {
                throw new Error('orderId is required');
            }
            const data = yield this.apiRequest.post('orders.cancel', {}, { uid: this.userId, norenordno: orderId });
            data.orderId = data.result;
            delete data.result;
            return data;
        });
    }
    modifyOrder(orderId, params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!orderId) {
                throw new Error('orderId is required');
            }
            let parsed;
            try {
                parsed = modifyOrderParamSchema.parse(params);
            }
            catch (error) {
                const validationError = error.format();
                validationError.errorType = 'FinvasiaValidationError';
                throw validationError;
            }
            const payload = {
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
            const data = yield this.apiRequest.post('orders.modify', {}, payload);
            data.orderId = data.result;
            delete data.result;
            return data;
        });
    }
}
RestAPI.routes = routes_json_1.default;
RestAPI.baseURL = `https://api.shoonya.com/NorenWClientTP`;
exports.default = RestAPI;
