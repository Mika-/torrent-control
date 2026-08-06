'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stableApiApps = require('../config/stable-api-apps.json');

var _stableApiApps2 = _interopRequireDefault(_stableApiApps);

var _api = require('../api');

var _api2 = _interopRequireDefault(_api);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @author https://github.com/acvetkov
 * @overview Apps entry point
 */

exports.default = new _api2.default(_stableApiApps2.default).create();
module.exports = exports['default'];