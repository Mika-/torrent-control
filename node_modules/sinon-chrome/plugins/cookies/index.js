'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @author https://github.com/acvetkov
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @overview ChromeCookies
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

var _find = require('lodash/find');

var _find2 = _interopRequireDefault(_find);

var _filter = require('lodash/filter');

var _filter2 = _interopRequireDefault(_filter);

var _findIndex = require('lodash/findIndex');

var _findIndex2 = _interopRequireDefault(_findIndex);

var _isFunction = require('lodash/isFunction');

var _isFunction2 = _interopRequireDefault(_isFunction);

var _urijs = require('urijs');

var _urijs2 = _interopRequireDefault(_urijs);

var _cookie = require('./cookie');

var _cookie2 = _interopRequireDefault(_cookie);

var _events = require('../../events');

var _events2 = _interopRequireDefault(_events);

var _assert = require('./assert');

var assert = _interopRequireWildcard(_assert);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ChromeCookies = function () {
    function ChromeCookies() {
        var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

        _classCallCheck(this, ChromeCookies);

        this._state = state;
        this.onChanged = new _events2.default();
    }

    /**
     * Install plugin
     * @param {Object} chrome
     */


    _createClass(ChromeCookies, [{
        key: 'install',
        value: function install(chrome) {
            var plugin = this;
            this.chrome = chrome;
            Object.defineProperty(this.chrome, 'cookies', {
                get: function get() {
                    return plugin;
                }
            });
        }

        /**
         * get cookie by criteria
         * @param {Object} details
         * @param {String} details.url
         * @param {String} details.name
         * @param {Function} callback
         * @returns {*}
         */

    }, {
        key: 'get',
        value: function get(details, callback) {
            assert.get.apply(null, arguments);
            var params = {
                name: details.name,
                domain: new _urijs2.default(details.url).hostname()
            };
            return this._invokeResult((0, _find2.default)(this._state, params) || null, callback);
        }

        /**
         * get all cookie list by criteria
         * @param {AllCookieCriteria} details
         * @param {Function} callback
         * @returns {*}
         */

    }, {
        key: 'getAll',
        value: function getAll(details, callback) {
            assert.getAll.apply(this, arguments);
            var params = details;
            if (params.url) {
                params.domain = new _urijs2.default(details.url).hostname();
                delete params.url;
            }
            return this._invokeResult((0, _filter2.default)(this._state, params), callback);
        }

        /**
         * set cookie value
         * @param {ChromeCookie} details
         * @param {Function} callback
         */

    }, {
        key: 'set',
        value: function set(details, callback) {
            assert.set.apply(null, arguments);
            var cookie = new _cookie2.default(details);
            var cookieInfo = cookie.info;
            this._appendCookie(cookieInfo);
            this._invokeResult(cookieInfo, callback);
        }

        /**
         * remove cookie
         * @param {Object} details
         * @param {String} details.url
         * @param {String} details.name
         * @param {Function} [callback]
         */

    }, {
        key: 'remove',
        value: function remove(details, callback) {
            assert.remove.apply(null, arguments);
            var params = {
                name: details.name,
                domain: new _urijs2.default(details.url).hostname()
            };
            var cookieInfo = (0, _find2.default)(this._state, params);
            if (cookieInfo) {
                var index = (0, _find2.default)(this._state, cookieInfo);
                this._state.splice(index, 1);
                this._triggerChange({ cause: 'explicit', removed: true, cookie: cookieInfo });
            }
            this._invokeResult(details, callback);
        }

        /**
         * Append new cookie
         * @param {Object} cookieInfo
         * @private
         */

    }, {
        key: '_appendCookie',
        value: function _appendCookie(cookieInfo) {
            var index = (0, _findIndex2.default)(this._state, {
                name: cookieInfo.name,
                domain: cookieInfo.domain
            });
            if (index >= 0) {
                this._state.splice(index, 1, cookieInfo);
                this._triggerChange({ cause: 'overwrite', removed: true, cookie: cookieInfo });
                this._triggerChange({ cause: 'explicit', removed: false, cookie: cookieInfo });
            } else {
                this._state.push(cookieInfo);
                this._triggerChange({ cause: 'explicit', removed: false, cookie: cookieInfo });
            }
        }

        /**
         * Trigger change event
         * @param {Object} changeInfo
         * @private
         */

    }, {
        key: '_triggerChange',
        value: function _triggerChange(changeInfo) {
            this.onChanged.triggerAsync(changeInfo);
        }

        /**
         * Async invoke result
         * @param {*} result
         * @param {Function} callback
         * @private
         */

    }, {
        key: '_invokeResult',
        value: function _invokeResult(result, callback) {
            if ((0, _isFunction2.default)(callback)) {
                setTimeout(function () {
                    return callback(result);
                }, 0);
            }
        }

        /**
         * @returns {Object}
         */

    }, {
        key: 'state',
        get: function get() {
            return this._state;
        }

        /**
         * @param {Object} value
         */
        ,
        set: function set(value) {
            this._state = value;
        }
    }]);

    return ChromeCookies;
}();

exports.default = ChromeCookies;
module.exports = exports['default'];