'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ChromeI18n = function () {
    /**
     * @constructor
     * @param {Object} translations
     */
    function ChromeI18n() {
        var translations = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, ChromeI18n);

        this._translations = translations;
    }

    /**
     * Install plugin
     * @param {Object} chrome
     */


    _createClass(ChromeI18n, [{
        key: 'install',
        value: function install(chrome) {
            var plugin = this;
            this.chrome = chrome;

            Object.defineProperty(this.chrome, 'i18n', {
                get: function get() {
                    return plugin;
                }
            });
        }

        /**
         * Get message by name and apply provided substitutions
         * @param {String} messageName
         * @param {Array} substitutions
         * @returns {String}
         */

    }, {
        key: 'getMessage',
        value: function getMessage(messageName) {
            var _ref = this._translations[messageName] || {},
                _ref$message = _ref.message,
                message = _ref$message === undefined ? undefined : _ref$message,
                _ref$placeholders = _ref.placeholders,
                placeholders = _ref$placeholders === undefined ? {} : _ref$placeholders;

            for (var _len = arguments.length, substitutions = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                substitutions[_key - 1] = arguments[_key];
            }

            var flattenSubstitutions = (0, _lodash.flatten)(substitutions);

            if ((0, _lodash.isEmpty)(flattenSubstitutions) || (0, _lodash.isEmpty)(placeholders)) {
                return String(message);
            }

            return message.replace(/\$([\w-]+)\$/g, function (ignored, name) {
                var _ref2 = placeholders[name] || {},
                    content = _ref2.content;

                if (!content) {
                    return undefined;
                }

                var index = Math.max(parseInt(content.replace('$', ''), 10) - 1, 0);

                return flattenSubstitutions[index];
            });
        }

        /**
         * Get accept-languages from the browser
         * @param {Function} callback
         */

    }, {
        key: 'getAcceptLanguages',
        value: function getAcceptLanguages() {
            var callback = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};

            callback(['en-US', 'en', 'el', 'fr', 'it']);
        }

        /**
         * Get the browser UI language of the browser
         * @returns {String}
         */

    }, {
        key: 'getUILanguage',
        value: function getUILanguage() {
            return 'en-US';
        }

        /**
         * Detect language from a given string
         * @param {String} text
         * @param {Function} callback
         */

    }, {
        key: 'detectLanguage',
        value: function detectLanguage() {
            var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
            var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};

            callback('en-US');
        }
    }]);

    return ChromeI18n;
}();

exports.default = ChromeI18n;
module.exports = exports['default'];