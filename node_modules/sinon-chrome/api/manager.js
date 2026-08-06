"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @author https://github.com/acvetkovk
 * @overview Manager
 */

var Manager =

/**
 * @param {StubsCache} stub
 * @param {EventsCache} events
 * @param {PropsCache} props
 */
function Manager(stub, events, props) {
    var _this = this;

    _classCallCheck(this, Manager);

    this.__stub__ = stub;
    this.__events__ = events;
    this.__props__ = props;
    this.reset = function () {
        _this.__stub__.reset();
        _this.__events__.reset();
        _this.__props__.reset();
    };
    this.flush = function () {
        _this.__stub__.flush();
        _this.__events__.flush();
        _this.__props__.flush();
    };
};

exports.default = Manager;
module.exports = exports["default"];