import {expect} from 'chai';
import sinon from 'sinon';
import chrome from 'sinon-chrome';
import JSDOM from 'jsdom';

global.expect = expect;
global.chrome = chrome;

const jsdom = new JSDOM.JSDOM();
global.DOMParser = jsdom.window.DOMParser;
global.FileReader = jsdom.window.FileReader;
global.Headers = class Headers {
    constructor(init) {
        this.map = new Map();
        if (init) {
            for (const key in init) {
                this.map.set(key.toLowerCase(), init[key]);
            }
        }
    }
    append(name, value) {
        this.map.set(name.toLowerCase(), value);
    }
    get(name) {
        return this.map.get(name.toLowerCase()) || null;
    }
    has(name) {
        return this.map.has(name.toLowerCase());
    }
    entries() {
        return this.map.entries();
    }
};

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
