import 'chai/register-expect.js';
import chrome from 'sinon-chrome';
import JSDOM from 'jsdom';

global.chrome = chrome;

const jsdom = new JSDOM.JSDOM();
global.FileReader = jsdom.window.FileReader;
global.Headers = jsdom.window.Headers;
