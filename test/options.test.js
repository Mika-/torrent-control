import {
    loadOptions,
    saveOptions,
} from '../src/util.js';

describe('Test options', () => {
    beforeEach(() => {
        chrome.flush();
    });

    it('Load default options', async () => {
        chrome.storage.local.get.withArgs(['globals', 'servers']).yields({});

        expect(chrome.storage.local.set.notCalled).to.equal(true);
        const loadedOptions = await loadOptions();
        expect(chrome.storage.local.get.calledOnce).to.equal(true);
        expect(loadedOptions).to.deep.equal({
            globals: {
                addAdvanced: false,
                currentServer: 0,
                addPaused: false,
                contextMenu: 1,
                catchUrls: true,
                enableNotifications: true,
                labels: [],
                matchRegExp: []
            },
            servers: [
                {
                    name: 'Default',
                    application: 'biglybt',
                    hostname: '',
                    username: '',
                    password: '',
                    directories: [],
                    clientOptions: {},
                    httpAuth: null,
                    defaultLabel: null,
                    defaultDirectory: null,
                }
            ]
        });
    });

    it('Save and load custom options', async () => {
        const modifiedOptions = {
            globals: {
                addAdvanced: false,
                currentServer: 0,
                addPaused: true,
                contextMenu: 0,
                catchUrls: false,
                enableNotifications: true,
                labels: [],
                matchRegExp: []
            },
            servers: [
                {
                    name: 'My client',
                    application: 'cloudtorrent',
                    hostname: 'https://127.0.0.1/',
                    username: '',
                    password: '',
                    directories: [],
                    clientOptions: {},
                    httpAuth: {
                        username: 'httpUsername',
                        password: 'httpPassword'
                    },
                    defaultLabel: null,
                    defaultDirectory: null,
                }
            ]
        };

        expect(chrome.storage.local.set.notCalled).to.equal(true);
        saveOptions(modifiedOptions);
        expect(chrome.storage.local.set.calledOnce).to.equal(true);

        chrome.storage.local.get.withArgs(['globals', 'servers']).yields(modifiedOptions);

        expect(chrome.storage.local.get.notCalled).to.equal(true);
        const loadedOptions = await loadOptions();
        expect(chrome.storage.local.get.calledOnce).to.equal(true);
        expect(loadedOptions).to.deep.equal(modifiedOptions);
    });

    it('Populate missing options', async () => {
        const modifiedOptions = {
            globals: {
                addAdvanced: false,
                currentServer: 0,
                addPaused: true,
                catchUrls: false,
                enableNotifications: true,
                labels: []
            },
            servers: [
                {
                    name: 'My client',
                    application: 'cloudtorrent',
                    hostname: 'https://127.0.0.1/',
                    username: '',
                    password: '',
                    directories: [],
                    clientOptions: {}
                }
            ]
        };

        expect(chrome.storage.local.set.notCalled).to.equal(true);
        saveOptions(modifiedOptions);
        expect(chrome.storage.local.set.calledOnce).to.equal(true);

        chrome.storage.local.get.withArgs(['globals', 'servers']).yields(modifiedOptions);

        expect(chrome.storage.local.get.notCalled).to.equal(true);
        const loadedOptions = await loadOptions();
        expect(chrome.storage.local.get.calledOnce).to.equal(true);
        expect(loadedOptions).to.deep.equal({
            globals: {
                addAdvanced: false,
                currentServer: 0,
                addPaused: true,
                contextMenu: 1,
                catchUrls: false,
                enableNotifications: true,
                labels: [],
                matchRegExp: [],
            },
            servers: [
                {
                    name: 'My client',
                    application: 'cloudtorrent',
                    hostname: 'https://127.0.0.1/',
                    username: '',
                    password: '',
                    directories: [],
                    clientOptions: {},
                    httpAuth: null,
                    defaultLabel: null,
                    defaultDirectory: null,
                }
            ]
        });
    });
});
