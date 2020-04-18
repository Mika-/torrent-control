import { expect } from 'chai';
const chrome = require('sinon-chrome/extensions');
(global as any).chrome = chrome;

import {
    notification,
} from '../src/index';

describe('Test notifications', () => {
    beforeEach(() => {
        chrome.flush();
    });

    it('notification(message)', () => {
        expect(chrome.notifications.create.notCalled).to.equal(true);
        notification('Test message');
        expect(chrome.notifications.create.calledOnce).to.equal(true);

    });
});
