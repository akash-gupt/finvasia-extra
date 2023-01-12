export default class ApiRequest {
    routes: {
        [prop: string]: string;
    };
    accessToken: string | undefined;
    requestInstance: any;
    debug: boolean;
    logger: {
        info: (p: any) => void;
        error: (p: any) => void;
    };
    constructor(baseURL: string, routes: {
        [prop: string]: string;
    }, accessToken?: string);
    setAccessToken(accessToken: string): void;
    request(method: 'GET' | 'POST' | 'PUT' | 'DELETE', route: string, qs: {
        [prop: string]: string;
    }, payload: {
        [prop: string]: any;
    }): any;
    get(): void;
    post(route: string, qs: {
        [prop: string]: string;
    }, payload: {
        [prop: string]: any;
    }): any;
    put(): void;
    delete(): void;
}
