'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @author https://github.com/acvetkov
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @overview chrome.cookies.Cookie fake module
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

var _isUndefined = require('lodash/isUndefined');

var _isUndefined2 = _interopRequireDefault(_isUndefined);

var _urijs = require('urijs');

var _urijs2 = _interopRequireDefault(_urijs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ChromeCookie = function () {
    function ChromeCookie(details) {
        _classCallCheck(this, ChromeCookie);

        ChromeCookie.assertParams(details);
        this.details = details;
        this.url = details.url;
    }

    /**
     * get chrome cookie value
     * @returns {Object}
     */


    _createClass(ChromeCookie, [{
        key: 'info',
        get: function get() {
            var domain = new _urijs2.default(this.details.url).hostname();
            var data = {
                name: this.details.name || '',
                value: this.details.value || '',
                domain: domain,
                hostOnly: domain.charAt(0) !== '.',
                httpOnly: Boolean(this.details.httpOnly),
                secure: Boolean(this.details.secure),
                session: (0, _isUndefined2.default)(this.details.expirationDate),
                path: this.details.path || new _urijs2.default(this.details.url).path()
            };
            if (this.details.expirationDate) {
                data.expirationDate = this.details.expirationDate;
            }
            return data;
        }

        /**
         * assert cookie params
         * @param {CookieDetails} details
         */

    }], [{
        key: 'assertParams',
        value: function assertParams(details) {
            if (!details.url) {
                throw new Error('details.url required');
            }
        }
    }]);

    return ChromeCookie;
}();

exports.default = ChromeCookie;
module.exports = exports['default'];