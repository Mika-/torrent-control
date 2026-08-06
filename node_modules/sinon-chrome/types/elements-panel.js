'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @author https://github.com/acvetkov
 * @overview ElementsPanel
 */

var ElementsPanel = function () {

    /**
     * @param {StubsCache} stubs
     * @param {EventsCache} events
     * @param {PropsCache} props
     * @param {String} namespace
     */
    function ElementsPanel(stubs, events, props, namespace) {
        _classCallCheck(this, ElementsPanel);

        this.stub = stubs;
        this.events = events;
        this.namespace = namespace;
    }

    _createClass(ElementsPanel, [{
        key: 'get',
        value: function get() {
            return {
                createSidebarPane: this.stub.get('createSidebarPane', this.namespace),
                onSelectionChanged: this.events.get('onSelectionChanged', this.namespace)
            };
        }
    }]);

    return ElementsPanel;
}();

exports.default = ElementsPanel;
module.exports = exports['default'];