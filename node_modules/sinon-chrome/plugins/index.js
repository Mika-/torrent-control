'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _cookies = require('./cookies');

var _cookies2 = _interopRequireDefault(_cookies);

var _i18n = require('./i18n');

var _i18n2 = _interopRequireDefault(_i18n);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @author https://github.com/acvetkov
 * @overview plugins list
 */

exports.default = {
  CookiePlugin: _cookies2.default,
  I18nPlugin: _i18n2.default
};
module.exports = exports['default'];