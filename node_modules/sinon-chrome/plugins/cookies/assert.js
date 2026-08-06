'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.get = get;
exports.getAll = getAll;
exports.set = set;
exports.remove = remove;

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _isFunction = require('lodash/isFunction');

var _isFunction2 = _interopRequireDefault(_isFunction);

var _isPlainObject = require('lodash/isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * assert chrome.cookies.get arguments
 * @param {CookieCriteria} details
 * @param {Function} callback
 * @throws TypeError
 */
function get(details, callback) {
    if (!(0, _isString2.default)(details.name)) {
        throwError('name');
    }

    if (!(0, _isString2.default)(details.url)) {
        throwError('url');
    }

    if (!(0, _isFunction2.default)(callback)) {
        throwError('callback');
    }
}

/**
 * assert chrome.cookie.getAll arguments
 * @param {AllCookieCriteria} details
 * @param {Function} callback
 */
/**
 * @author https://github.com/acvetkov
 * @overview Assertation module for chrome.cookies.* methods
 */

function getAll(details, callback) {
    if (!(0, _isPlainObject2.default)(details)) {
        throwError('details');
    }
    if (!(0, _isFunction2.default)(callback)) {
        throwError('callback');
    }
}

/**
 * assert chrome.cookies.set arguments
 * @param {AllCookieCriteria} details
 */
function set(details) {
    if (!(0, _isString2.default)(details.url)) {
        throwError('url');
    }
}

/**
 * assert chrome.cookies.remove arguments
 * @param {Object} details
 */
function remove(details) {
    if (!(0, _isString2.default)(details.url)) {
        throwError('url');
    }
    if (!(0, _isString2.default)(details.name)) {
        throwError('name');
    }
}

/**
 * throws type error
 * @param {String} argument
 */
function throwError(argument) {
    throw new Error(argument + ' required');
}