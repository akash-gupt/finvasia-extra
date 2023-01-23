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
const util_1 = require("./util");
const routes_json_1 = __importDefault(require("./routes.json"));
const ApiRequest_1 = __importDefault(require("./ApiRequest"));
const types_1 = require("./types");
const class_transformer_1 = require("class-transformer");
const NOT_OK = 'Not_Ok';
class OriginalOrderHistoryResponseItem {
}
class OrderHistoryResponseItem {
    constructor(params) {
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
const transformOrderType = (v) => {
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
const transformProduct = (v) => {
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
                return data.map((item) => new OrderHistoryResponseItem(item));
            }
            // handle no data response object
            if (data.emsg && data.emsg.includes('no data')) {
                return [];
            }
            // unknown data format
            throw data.map((item) => (Object.assign(Object.assign({}, item), { product: transformProduct(item.prd), orderType: transformOrderType(item.prctyp) })));
        });
    }
    getTimeSeries(params) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.apiRequest.post('market.series', {}, {
                uid: this.userId,
                exch: params.exchange,
                token: params.token,
                st: (_a = params.startTime) === null || _a === void 0 ? void 0 : _a.toString(),
                et: (_b = params.endTime) === null || _b === void 0 ? void 0 : _b.toString(),
                intrv: params.interval,
            });
            return data.map((item) => new types_1.GetTimeSeriesResponseItem(item));
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
    getPositionsBook() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.apiRequest.post('positions.book', {}, {});
            return data.map((item) => new types_1.PositionResponseItem(item));
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
    searchScript(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.apiRequest.post('market.search', {}, { uid: this.userId, exch: params.exchange, stext: params.text });
        });
    }
    placeOrder(params) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let parsed;
            try {
                parsed = (0, class_transformer_1.plainToClass)(types_1.CreateOrderParams, params);
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
                qty: parsed.quantity.toString(),
                prc: parsed.price.toString(),
                trgprc: (_a = parsed.triggerPrice) === null || _a === void 0 ? void 0 : _a.toString(),
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
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!orderId) {
                throw new Error('orderId is required');
            }
            let parsed;
            try {
                parsed = (0, class_transformer_1.plainToClass)(types_1.ModifyOrderParams, params);
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
                qty: parsed.quantity.toString(),
                ret: parsed.validity,
            };
            if (parsed.orderType === 'SL-LMT' || parsed.orderType === 'SL-MKT') {
                payload.trgprc = (_a = parsed.triggerPrice) === null || _a === void 0 ? void 0 : _a.toString();
            }
            if (parsed.orderType === 'SL-LMT' || parsed.orderType === 'LMT') {
                payload.prc = parsed.price.toString();
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
