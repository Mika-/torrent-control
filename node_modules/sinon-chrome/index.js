'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extensions = require('./extensions');

var _extensions2 = _interopRequireDefault(_extensions);

var _plugins = require('./plugins');

var _plugins2 = _interopRequireDefault(_plugins);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @author https://github.com/acvetkov
 * @overview Entry point
 */

_extensions2.default.plugins = _plugins2.default;

exports.default = _extensions2.default;
module.exports = exports['default'];