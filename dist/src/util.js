"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256 = void 0;
const crypto_1 = __importDefault(require("crypto"));
const sha256 = (data) => {
    const h = crypto_1.default.createHash('sha256');
    h.update(data, 'utf-8');
    return h.digest('hex');
};
exports.sha256 = sha256;
