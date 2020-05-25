import {notification} from '../src/index.js';
import {loadOptions} from '../src/util.js';

describe('Test notifications', () => {
    before(() => {
        global.loadOptions = loadOptions;
    });

    beforeEach(() => {
        chrome.flush();
    });

    it('notification(message)', () => {
        expect(chrome.notifications.create.notCalled).to.equal(true);
        notification('Test message');
        expect(chrome.notifications.create.calledOnce).to.equal(true);
    });
});
