const chrome = require('sinon-chrome/extensions');
const expect = require('chai').expect;
const rewire = require('rewire');

describe('Test notifications', () => {
    before(() => {
        global.chrome = chrome;

        const util = rewire('./../src/util');
        global.loadOptions = util.__get__('loadOptions');
    });

    beforeEach(() => {
        chrome.flush();
    });

    it('notification(message)', () => {
        const index = rewire('./../src/index');

        const notification = index.__get__('notification');

        expect(chrome.notifications.create.notCalled).to.equal(true);
        notification('Test message');
        expect(chrome.notifications.create.calledOnce).to.equal(true);

    });
});
