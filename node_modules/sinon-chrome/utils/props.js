'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /**
                                                                                                                                                                                                                                                                               * @author https://github.com/acvetkov
                                                                                                                                                                                                                                                                               * @overview props utils
                                                                                                                                                                                                                                                                               */

exports.getAll = getAll;

var _lodash = require('lodash');

/**
 * Collect all props namespaces
 * @param {Object} props
 * @param {String} namespace
 * @returns {Object}
 */
function getAll(props) {
    var namespace = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    return (0, _lodash.reduce)(props, function (result, data, prop) {
        var ns = namespace ? namespace + '.' + prop : '' + prop;
        if ((0, _lodash.isPlainObject)(data.properties) && (0, _lodash.isPlainObject)(data.value)) {
            return (0, _lodash.assign)({}, result, getAll(data.properties, ns));
        }
        result['' + ns] = getValue(data.value, data.$ref);
        return result;
    }, {});
}

/**
 * @param {*} val
 * @param {String} ref
 * @returns {*}
 */
function getValue(val, ref) {
    if (ref) {
        return ref;
    }
    if (!val || (typeof val === 'undefined' ? 'undefined' : _typeof(val)) === 'object') {
        return null;
    }
    return val;
}