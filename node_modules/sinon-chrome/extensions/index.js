'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stableApi = require('../config/stable-api.json');

var _stableApi2 = _interopRequireDefault(_stableApi);

var _api = require('../api');

var _api2 = _interopRequireDefault(_api);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @author https://github.com/acvetkov
 * @overview Extensions entry point
 */

exports.default = new _api2.default(_stableApi2.default).create();
module.exports = exports['default'];