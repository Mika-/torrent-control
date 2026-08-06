'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _index = require('../events/index');

var _index2 = _interopRequireDefault(_index);

var _cache = require('./cache');

var _cache2 = _interopRequireDefault(_cache);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @author https://github.com/acvetkov
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @overview Events cache
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

var EventsCache = function (_BaseCache) {
    _inherits(EventsCache, _BaseCache);

    function EventsCache(sinon) {
        _classCallCheck(this, EventsCache);

        var _this = _possibleConstructorReturn(this, (EventsCache.__proto__ || Object.getPrototypeOf(EventsCache)).call(this));

        _this.events = Object.create(null);
        _this.sandbox = sinon.createSandbox();
        return _this;
    }

    /**
     * @param {String} type
     * @param {String} namespace
     * @returns {ChromeEvent}
     */


    _createClass(EventsCache, [{
        key: 'get',
        value: function get(type, namespace) {
            var key = this.getKey(type, namespace);
            if (key in this.events) {
                return this.events[key];
            }
            var event = this.createEvent();
            this.events[key] = event;
            return event;
        }

        /**
         * Remove all listeners
         */

    }, {
        key: 'reset',
        value: function reset() {
            this.sandbox.resetHistory();
            this.sandbox.resetBehavior();
            (0, _lodash.forEach)(this.events, function (event) {
                event.removeListeners();
            });
        }

        /**
         * Drop listeners
         */

    }, {
        key: 'flush',
        value: function flush() {
            this.reset();
        }

        /**
         * Create event
         * @returns {ChromeEvent}
         */

    }, {
        key: 'createEvent',
        value: function createEvent() {
            var event = new _index2.default();
            this.sandbox.spy(event, 'addListener');
            this.sandbox.spy(event, 'hasListener');
            this.sandbox.spy(event, 'removeListener');
            this.sandbox.spy(event, 'removeListeners');
            return event;
        }
    }]);

    return EventsCache;
}(_cache2.default);

exports.default = EventsCache;
module.exports = exports['default'];