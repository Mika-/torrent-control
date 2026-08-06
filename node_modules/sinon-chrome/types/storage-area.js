'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @author https://github.com/acvetkov
 * @overview StorageArea
 */

var StorageArea = function () {

    /**
     * @param {StubsCache} stubs
     * @param {EventsCache} events
     * @param {PropsCache} props
     * @param {String} namespace
     */
    function StorageArea(stubs, events, props, namespace) {
        _classCallCheck(this, StorageArea);

        this.stubs = stubs;
        this.namespace = namespace;
    }

    _createClass(StorageArea, [{
        key: 'get',
        value: function get() {
            return {
                get: this.stubs.get('get', this.namespace),
                getBytesInUse: this.stubs.get('getBytesInUse', this.namespace),
                set: this.stubs.get('set', this.namespace),
                remove: this.stubs.get('remove', this.namespace),
                clear: this.stubs.get('clear', this.namespace)
            };
        }
    }]);

    return StorageArea;
}();

exports.default = StorageArea;
module.exports = exports['default'];