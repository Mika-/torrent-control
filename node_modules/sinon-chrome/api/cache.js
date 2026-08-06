"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @author https://github.com/acvetkov
 * @overview Base cache class
 */

var BaseCache = function () {
  function BaseCache() {
    _classCallCheck(this, BaseCache);
  }

  _createClass(BaseCache, [{
    key: "getKey",


    /**
     * @param {String} prop
     * @param {String} namespace
     * @returns {string}
     */
    value: function getKey(prop, namespace) {
      return namespace + "." + prop;
    }
  }]);

  return BaseCache;
}();

exports.default = BaseCache;
module.exports = exports["default"];