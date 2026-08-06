"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const protocol_1 = __importDefault(require("../../protocol"));
const command_1 = __importDefault(require("../../command"));
const OKAY_OUTPUT_REGEXP = /^(Success|Failure \[(.*?)\]|Exception)(.*)$/;
const INSTALL_EXCEPTION_CODE = 'INSTALL_EXCEPTION';
class InstallError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
    }
}
class InstallCommand extends command_1.default {
    execute(apk) {
        this._send(`shell:pm install -r ${this._escapeCompat(apk)}`);
        return this.parser.readAscii(4).then((reply) => {
            switch (reply) {
                case protocol_1.default.OKAY:
                    return this.parser
                        .searchLine(OKAY_OUTPUT_REGEXP)
                        .then((match) => {
                        if (match[1] === 'Success') {
                            return true;
                        }
                        else if (match[1] === 'Exception') {
                            return this.parser.readLine().then((buffer) => {
                                throw new InstallError(buffer.toString(), INSTALL_EXCEPTION_CODE);
                            });
                        }
                        else {
                            const code = match[2];
                            throw new InstallError(`${apk} could not be installed [${code}]`, code);
                        }
                    })
                        .finally(() => {
                        return this.parser.readAll();
                    });
                case protocol_1.default.FAIL:
                    return this.parser.readError();
                default:
                    return this.parser.unexpected(reply, 'OKAY or FAIL');
            }
        });
    }
}
exports.default = InstallCommand;
//# sourceMappingURL=install.js.map