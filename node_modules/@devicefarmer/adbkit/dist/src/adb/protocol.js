"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Protocol {
    static decodeLength(length) {
        return parseInt(length, 16);
    }
    static encodeLength(length) {
        return length.toString(16).padStart(4, '0').toUpperCase();
    }
    static encodeData(data) {
        if (!Buffer.isBuffer(data)) {
            data = Buffer.from(data);
        }
        const len = Protocol.encodeLength(data.length);
        return Buffer.concat([Buffer.from(len), data]);
    }
}
Protocol.OKAY = 'OKAY';
Protocol.FAIL = 'FAIL';
Protocol.STAT = 'STAT';
Protocol.STA2 = 'STA2';
Protocol.LIST = 'LIST';
Protocol.DENT = 'DENT';
Protocol.RECV = 'RECV';
Protocol.DATA = 'DATA';
Protocol.DONE = 'DONE';
Protocol.SEND = 'SEND';
Protocol.QUIT = 'QUIT';
exports.default = Protocol;
//# sourceMappingURL=protocol.js.map