'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @author https://github.com/acvetkov
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @overview Create api
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

var _lodash = require('lodash');

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

var _stub = require('./stub');

var _stub2 = _interopRequireDefault(_stub);

var _events = require('./events');

var _events2 = _interopRequireDefault(_events);

var _props = require('./props');

var _props2 = _interopRequireDefault(_props);

var _manager = require('./manager');

var _manager2 = _interopRequireDefault(_manager);

var _props3 = require('../utils/props');

var _chromeSettings = require('../types/chrome-settings');

var _chromeSettings2 = _interopRequireDefault(_chromeSettings);

var _contentSettings = require('../types/content-settings');

var _contentSettings2 = _interopRequireDefault(_contentSettings);

var _elementsPanel = require('../types/elements-panel');

var _elementsPanel2 = _interopRequireDefault(_elementsPanel);

var _sourcePanel = require('../types/source-panel');

var _sourcePanel2 = _interopRequireDefault(_sourcePanel);

var _storageArea = require('../types/storage-area');

var _storageArea2 = _interopRequireDefault(_storageArea);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var typeMap = {
    'types.ChromeSetting': _chromeSettings2.default,
    'StorageArea': _storageArea2.default,
    'SourcesPanel': _sourcePanel2.default,
    'ElementsPanel': _elementsPanel2.default,
    'ContentSetting': _contentSettings2.default
};

var Api = function () {

    /**
     * @param {Array<Object>} config
     */
    function Api(config) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        _classCallCheck(this, Api);

        this.sinon = options.sinon ? options.sinon : _sinon2.default;
        this.NS_RULE = /^(.+)\.(.+)$/;
        this.config = config;
        this.stubs = new _stub2.default(this.sinon);
        this.events = new _events2.default(this.sinon);
        this.props = new _props2.default();
        this.manager = new _manager2.default(this.stubs, this.events, this.props);
    }

    /**
     * Create api stub
     * @returns {Object}
     */


    _createClass(Api, [{
        key: 'create',
        value: function create() {
            var _this = this;

            var browserApi = (0, _lodash.reduce)(this.config, function (api, data) {
                (0, _lodash.set)(api, data.namespace, _this.createInterface(data));
                return api;
            }, {});
            return (0, _lodash.assign)({
                registerPlugin: function registerPlugin(plugin) {
                    plugin.install(this);
                }
            }, browserApi, this.manager);
        }

        /**
         * @param {Object} data
         * @returns {Object}
         */

    }, {
        key: 'createInterface',
        value: function createInterface(data) {
            var _data$functions = data.functions,
                functions = _data$functions === undefined ? [] : _data$functions,
                _data$events = data.events,
                events = _data$events === undefined ? [] : _data$events,
                namespace = data.namespace;

            var result = {};
            this.createFunctions(result, functions, namespace);
            this.createEvents(result, events, namespace);
            this.createProps(result, data);
            return result;
        }

        /**
         * @param {Object} obj
         * @param {Array<Object>} functions
         * @param {String} namespace
         * @returns {Object}
         */

    }, {
        key: 'createFunctions',
        value: function createFunctions(obj, functions, namespace) {
            var stubs = this.stubs;
            return (0, _lodash.reduce)(functions, function (result, func) {
                Object.defineProperty(result, func.name, {
                    get: function get() {
                        return stubs.get(func.name, namespace);
                    },
                    enumerable: true,
                    configurable: true
                });
                return obj;
            }, obj);
        }

        /**
         * @param {Object} obj
         * @param {Array<Object>} events
         * @param {String} namespace
         * @returns {Object}
         */

    }, {
        key: 'createEvents',
        value: function createEvents(obj, events, namespace) {
            var ev = this.events;
            return (0, _lodash.reduce)(events, function (result, event) {
                Object.defineProperty(result, event.name, {
                    get: function get() {
                        return ev.get(event.name, namespace);
                    },
                    enumerable: true,
                    configurable: true
                });
                return obj;
            }, obj);
        }

        /**
         * @param {Object} obj
         * @param {Object} data
         * @returns {Object}
         */

    }, {
        key: 'createProps',
        value: function createProps(obj, data) {
            var _this2 = this;

            var namespace = data.namespace;
            var nsProps = (0, _props3.getAll)(data.properties || {});

            Object.keys(nsProps).forEach(function (key) {
                var value = nsProps[key];
                var matches = key.match(_this2.NS_RULE);

                var prop = key;
                var ns = namespace;
                var propNS = namespace;

                if (matches) {
                    var _matches = _slicedToArray(matches, 3);

                    ns = _matches[1];
                    prop = _matches[2];

                    propNS = namespace + '.' + ns;
                    var result = {};
                    _this2.appendProp(result, prop, propNS, value);
                    var localObject = (0, _lodash.get)(obj, ns);
                    if (!localObject) {
                        (0, _lodash.set)(obj, ns, result);
                    } else {
                        _this2.appendProp(localObject, prop, propNS, value);
                    }
                } else {
                    _this2.appendProp(obj, prop, namespace, value);
                }
            });

            return obj;
        }

        /**
         * @param {Object} obj
         * @param {String} prop
         * @param {String} namespace
         * @param {*} value
         * @returns {*}
         */

    }, {
        key: 'appendProp',
        value: function appendProp(obj, prop, namespace, value) {
            if (value && value in typeMap) {
                var TypeClass = typeMap[value];
                var instance = new TypeClass(this.stubs, this.events, this.props, namespace + '.' + prop);
                return Object.defineProperty(obj, prop, {
                    get: function get() {
                        return instance.get();
                    },

                    enumerable: true,
                    configurable: true
                });
            }
            var property = this.props.get(prop, '' + namespace, value);
            Object.defineProperty(obj, prop, {
                get: function get() {
                    return property.current;
                },
                set: function set(newValue) {
                    property.current = newValue;
                },

                enumerable: true,
                configurable: true
            });
        }
    }]);

    return Api;
}();

exports.default = Api;
module.exports = exports['default'];