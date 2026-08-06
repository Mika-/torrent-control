'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _noop = require('lodash/noop');

var _noop2 = _interopRequireDefault(_noop);

var _cache = require('./cache');

var _cache2 = _interopRequireDefault(_cache);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @author https://github.com/acvetkov
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @overview Props cache
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

var PropsCache = function (_BaseCache) {
    _inherits(PropsCache, _BaseCache);

    function PropsCache() {
        _classCallCheck(this, PropsCache);

        var _this = _possibleConstructorReturn(this, (PropsCache.__proto__ || Object.getPrototypeOf(PropsCache)).call(this));

        _this.props = {};
        return _this;
    }

    /**
     * @param {String} prop
     * @param {String} namespace
     * @param {*} defaultValue
     * @returns {*}
     */


    _createClass(PropsCache, [{
        key: 'get',
        value: function get(prop, namespace, defaultValue) {
            var key = this.getKey(prop, namespace);
            if (key in this.props) {
                return this.props[key];
            }
            var property = this.create(defaultValue);
            this.props[key] = property;
            return property;
        }

        /**
         * @param {*} defaultValue
         * @returns {{default: *, current: *, flush: (function())}}
         */

    }, {
        key: 'create',
        value: function create(defaultValue) {
            return {
                default: defaultValue,
                current: defaultValue,
                flush: function flush() {
                    this.current = defaultValue;
                }
            };
        }

        /**
         * Reset property to default state
         */

    }, {
        key: 'reset',
        value: function reset() {
            (0, _noop2.default)();
        }

        /**
         * Flush property
         */

    }, {
        key: 'flush',
        value: function flush() {
            var _this2 = this;

            Object.keys(this.props).forEach(function (key) {
                return _this2.props[key].flush();
            });
        }
    }]);

    return PropsCache;
}(_cache2.default);

exports.default = PropsCache;
module.exports = exports['default'];