import {expect} from 'chai';
import sinon from 'sinon';
import chrome from 'sinon-chrome';
import JSDOM from 'jsdom';

global.expect = expect;
global.chrome = chrome;

const jsdom = new JSDOM.JSDOM();
global.DOMParser = jsdom.window.DOMParser;
global.FileReader = jsdom.window.FileReader;
global.Headers = jsdom.window.Headers;

global.FormData = class FormData {
    append(name, value) {
        this[name] = value;
    }
    get (name) {
        return this[name];
    }
};

export const mochaHooks = {
    afterEach() {
        sinon.restore();
        chrome.flush();
    },
};
