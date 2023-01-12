import ApiRequest from './ApiRequest';
interface OrderParams {
    /**
     * NSE / NFO / CDS / MCX / BSE
     */
    exchange: 'NSE' | 'NFO' | 'CDS' | 'MCX' | 'BSE';
    tradingSymbol: string;
    transactionType: 'S' | 'B';
    quantity: number;
    price: number;
    triggerPrice?: number;
    disclosedQuantity: number;
    product: 'C' | 'M' | 'H';
    orderType: 'LMT' | 'MKT' | 'SL-LMT' | 'SL-MKT';
    validity?: string;
    tag?: string;
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
declare class RestAPI {
    static routes: {
        "auth.login": string;
        orders: string;
        "orders.history": string;
        "orders.place": string;
        "orders.modify": string;
        "orders.cancel": string;
        "market.quote": string;
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
    getOrders(): Promise<any[]>;
    getOrderHistory(orderId: string): Promise<any>;
    getQuote(exchange: string, token: string): Promise<any>;
    placeOrder(params: OrderParams): Promise<any>;
    cancelOrder(orderId: string): Promise<any>;
    modifyOrder(orderId: string, params: ModifyOrderParams): Promise<any>;
}
export default RestAPI;
