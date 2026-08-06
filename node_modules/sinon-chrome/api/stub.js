'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _cache = require('./cache');

var _cache2 = _interopRequireDefault(_cache);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @author https://github.com/acvetkov
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @overview Subs cache
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

var StubsCache = function (_BaseCache) {
    _inherits(StubsCache, _BaseCache);

    function StubsCache(sinon) {
        _classCallCheck(this, StubsCache);

        var _this = _possibleConstructorReturn(this, (StubsCache.__proto__ || Object.getPrototypeOf(StubsCache)).call(this));

        _this.stubs = Object.create(null);
        _this.sinon = sinon;
        return _this;
    }

    /**
     * @param {String} method
     * @param {String} namespace
     * @returns {Function}
     */


    _createClass(StubsCache, [{
        key: 'get',
        value: function get(method, namespace) {
            var key = this.getKey(method, namespace);
            if (key in this.stubs) {
                return this.stubs[key];
            }

            var stub = this.create(key);
            this.store(key, stub);
            return stub;
        }

        /**
         * @param {String} key
         * @param {Function} stub
         */

    }, {
        key: 'store',
        value: function store(key, stub) {
            this.stubs[key] = stub;
        }

        /**
         * @param {String} key
         * @returns {Function}
         */

    }, {
        key: 'create',
        value: function create(key) {
            var _this2 = this;

            var stub = this.sinon.stub();
            stub.flush = function () {
                _this2.deleteStub(key);
            };
            return stub;
        }

        /**
         * @param {String} key
         */

    }, {
        key: 'deleteStub',
        value: function deleteStub(key) {
            if (key in this.stubs) {
                delete this.stubs[key];
            }
        }

        /**
         * Flush sinon stubs (replace by new)
         */

    }, {
        key: 'flush',
        value: function flush() {
            this.stubs = Object.create(null);
            this.sinon.restore();
        }

        /**
         * Reset sinon stubs
         */

    }, {
        key: 'reset',
        value: function reset() {
            var _this3 = this;

            Object.keys(this.stubs).forEach(function (key) {
                _this3.stubs[key].resetHistory();
                _this3.stubs[key].resetBehavior();
            });
            this.sinon.restore();
        }
    }]);

    return StubsCache;
}(_cache2.default);

exports.default = StubsCache;
module.exports = exports['default'];