'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stableApiFf = require('../config/stable-api-ff.json');

var _stableApiFf2 = _interopRequireDefault(_stableApiFf);

var _api = require('../api');

var _api2 = _interopRequireDefault(_api);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @author https://github.com/acvetkov
 * @overview Firefox's WebExtensions api
 */

exports.default = new _api2.default(_stableApiFf2.default).create();
module.exports = exports['default'];