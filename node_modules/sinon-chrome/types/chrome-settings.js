'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @author https://github.com/acvetkov
 * @overview types#ChromeSettings
 */

var ChromeSettings = function () {

    /**
     * @param {StubsCache} stubs
     * @param {EventsCache} events
     * @param {PropsCache} props
     * @param {String} namespace
     */
    function ChromeSettings(stubs, events, props, namespace) {
        _classCallCheck(this, ChromeSettings);

        this.stub = stubs;
        this.events = events;
        this.namespace = namespace;
    }

    _createClass(ChromeSettings, [{
        key: 'get',
        value: function get() {
            return {
                get: this.stub.get('get', this.namespace),
                set: this.stub.get('set', this.namespace),
                clear: this.stub.get('clear', this.namespace),
                onChange: this.events.get('onChange', this.namespace)
            };
        }
    }]);

    return ChromeSettings;
}();

exports.default = ChromeSettings;
module.exports = exports['default'];