"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("./adb/client"));
// import { Keycode } from './adb/keycode';
const util_1 = __importDefault(require("./adb/util"));
class Adb {
    static createClient(options = {}) {
        const opts = {
            bin: options.bin,
            host: options.host || process.env.ADB_HOST,
            port: options.port || 5037,
            timeout: options.timeout || 0
        };
        if (!opts.port) {
            const port = parseInt(process.env.ADB_PORT || '5037', 10);
            if (!isNaN(port)) {
                opts.port = port;
            }
        }
        return new client_1.default(opts);
    }
}
// static Keycode = Keycode;
Adb.util = util_1.default;
exports.default = Adb;
//# sourceMappingURL=adb.js.map