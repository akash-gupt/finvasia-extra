"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocket = exports.RestAPI = void 0;
var RestAPI_1 = require("./src/RestAPI");
Object.defineProperty(exports, "RestAPI", { enumerable: true, get: function () { return __importDefault(RestAPI_1).default; } });
var WebSocket_1 = require("./src/WebSocket");
Object.defineProperty(exports, "WebSocket", { enumerable: true, get: function () { return __importDefault(WebSocket_1).default; } });
