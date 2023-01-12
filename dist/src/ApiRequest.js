"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
class ApiRequest {
    constructor(baseURL, routes, accessToken) {
        this.routes = routes;
        if (accessToken) {
            this.accessToken = accessToken;
        }
        this.debug = false;
        this.logger = console;
        this.requestInstance = axios_1.default.create({ baseURL });
        // add request interceptor
        this.requestInstance.interceptors.request.use((request) => {
            if (this.debug) {
                this.logger.info(request);
            }
            return request;
        });
        // add response interceptor
        this.requestInstance.interceptors.response.use((response) => {
            if (this.debug) {
                this.logger.info(response);
            }
            return response.data;
        }, (error) => {
            if (this.debug) {
                this.logger.error(error);
            }
            const errorResponse = {
                statusCode: 500,
                status: 'Not_Ok',
                message: 'Error',
                errorType: 'FinvasiaApiError',
            };
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                errorResponse.statusCode = error.response.status;
                if (error.response.data) {
                    errorResponse.status = error.response.data.stat;
                    errorResponse.message = error.response.data.emsg;
                }
            }
            else if (error.request) {
                // The request was made but no response was received
                // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                // http.ClientRequest in node.js
                errorResponse.errorType = 'FinvasiaNetworkException';
                errorResponse.message = 'No response from server with error code: ' + error.code;
            }
            return Promise.reject(errorResponse);
        });
    }
    setAccessToken(accessToken) {
        this.accessToken = accessToken;
    }
    request(method, route, qs, payload) {
        const url = this.routes[route];
        const options = {
            method,
            url,
            params: qs,
            data: `jData=${JSON.stringify(payload)}`,
            headers: {},
        };
        if (this.accessToken) {
            options.data += `&jKey=${this.accessToken}`;
        }
        return this.requestInstance.request(options);
    }
    get() { }
    post(route, qs, payload) {
        return this.request('POST', route, qs, payload);
    }
    put() { }
    delete() { }
}
exports.default = ApiRequest;
