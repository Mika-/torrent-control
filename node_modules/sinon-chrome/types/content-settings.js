'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @author https://github.com/acvetkov
 * @overview ContentSettings
 */

var ContentSettings = function () {

    /**
     * @param {StubsCache} stubs
     * @param {EventsCache} events
     * @param {PropsCache} props
     * @param {String} namespace
     */
    function ContentSettings(stubs, events, props, namespace) {
        _classCallCheck(this, ContentSettings);

        this.stub = stubs;
        this.namespace = namespace;
    }

    _createClass(ContentSettings, [{
        key: 'get',
        value: function get() {
            return {
                clear: this.stub.get('clear', this.namespace),
                get: this.stub.get('get', this.namespace),
                set: this.stub.get('set', this.namespace),
                getResourceIdentifiers: this.stub.get('getResourceIdentifiers', this.namespace)
            };
        }
    }]);

    return ContentSettings;
}();

exports.default = ContentSettings;
module.exports = exports['default'];