import ApiRequest from './ApiRequest';
import { CreateOrderParams, ExchangeType, ModifyOrderParams, OrderType, PositionResponseItem, ProductType, TransactionType } from './types';
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
declare class OriginalOrderHistoryResponseItem {
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
declare class OrderHistoryResponseItem {
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
    constructor(params: OriginalOrderHistoryResponseItem);
}
type OrderHistoryResponse = OrderHistoryResponseItem[];
declare class RestAPI {
    static routes: {
        "auth.login": string;
        orders: string;
        "orders.history": string;
        "orders.place": string;
        "orders.modify": string;
        "orders.cancel": string;
        "market.quote": string;
        "market.search": string;
        "positions.book": string;
    };
    static baseURL: string;
    apiRequest: ApiRequest;
    debug: boolean;
    accessToken: string | undefined;
    userId: string | undefined;
    accountId: string | undefined;
    constructor(options: {
        userId: string | undefined;
        accessToken: string | undefined;
        debug: boolean;
    });
    setUserId(userId: string): void;
    setAccessToken(accessToken: string): void;
    login(userId: string, password: string, factor2: string, vendorCode: string, apiKey: string, imei?: string): Promise<any>;
    getOrders(): Promise<OrderHistoryResponse>;
    getOrderHistory(orderId: string): Promise<any>;
    getPositionsBook(): Promise<PositionResponseItem[]>;
    getQuote(exchange: string, token: string): Promise<any>;
    searchScript(params: SearchParams): Promise<SearchResponse>;
    placeOrder(params: CreateOrderParams): Promise<OrderResponse>;
    cancelOrder(orderId: string): Promise<any>;
    modifyOrder(orderId: string, params: ModifyOrderParams): Promise<any>;
}
export default RestAPI;
