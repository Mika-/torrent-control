'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @author https://github.com/acvetkov
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @overview ChromeEvent class
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

var _isFunction = require('lodash/isFunction');

var _isFunction2 = _interopRequireDefault(_isFunction);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ChromeEvent = function () {

    /**
     * @constructor
     */
    function ChromeEvent() {
        _classCallCheck(this, ChromeEvent);

        this._listeners = [];
    }

    /**
     * Manual dispatch
     */


    _createClass(ChromeEvent, [{
        key: 'dispatch',
        value: function dispatch() {
            this.trigger.apply(this, arguments);
        }

        /**
         * Call all subscribed handlers
         */

    }, {
        key: 'trigger',
        value: function trigger() {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            this._listeners.forEach(function (handler) {
                handler.apply(null, args);
            });
        }

        /**
         * Async call all subscribed handlers
         */

    }, {
        key: 'triggerAsync',
        value: function triggerAsync() {
            var _this = this;

            for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                args[_key2] = arguments[_key2];
            }

            setTimeout(function () {
                _this.trigger.apply(_this, args);
            }, 0);
        }

        /**
         * Call all subscribed handlers, pass arguments ass array
         * @param {Array} args
         */

    }, {
        key: 'applyTrigger',
        value: function applyTrigger(args) {
            this.trigger.apply(this, args);
        }

        /**
         * Async call all subscribed handlers, pass arguments ass array
         * @param {Array} args
         */

    }, {
        key: 'applyTriggerAsync',
        value: function applyTriggerAsync(args) {
            this.triggerAsync.apply(this, args);
        }

        /**
         * Add event listener
         * @param {Function} handler
         */

    }, {
        key: 'addListener',
        value: function addListener(handler) {
            if ((0, _isFunction2.default)(handler)) {
                this._listeners.push(handler);
            }
        }

        /**
         * Remove event listener
         * @param {Function} handler
         */

    }, {
        key: 'removeListener',
        value: function removeListener(handler) {
            var index = this._listeners.indexOf(handler);
            if (index >= 0) {
                this._listeners.splice(index, 1);
            }
        }

        /**
         * Check event listener exists
         * @param {Function} handler
         * @returns {Boolean}
         */

    }, {
        key: 'hasListener',
        value: function hasListener(handler) {
            return this._listeners.indexOf(handler) >= 0;
        }

        /**
         * Remove all listeners
         */

    }, {
        key: 'removeListeners',
        value: function removeListeners() {
            this._listeners = [];
        }
    }]);

    return ChromeEvent;
}();

exports.default = ChromeEvent;
module.exports = exports['default'];