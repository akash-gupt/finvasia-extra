"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocket = exports.RestAPI = void 0;
var RestAPI_1 = require("./src/RestAPI");
Object.defineProperty(exports, "RestAPI", { enumerable: true, get: function () { return __importDefault(RestAPI_1).default; } });
var WebSocket_1 = require("./src/WebSocket");
Object.defineProperty(exports, "WebSocket", { enumerable: true, get: function () { return __importDefault(WebSocket_1).default; } });
__exportStar(require("./src/RestAPI"), exports);
__exportStar(require("./src/types"), exports);
