import { expect } from 'chai';
const chrome = require('sinon-chrome/extensions');
(global as any).chrome = chrome;

import {
    isTorrentUrl,
    isMagnetUrl,
    getMagnetUrlName,
    loadOptions,
    saveOptions,
} from '../src/util';

describe('Test helpers', () => {
    beforeEach(() => {
        chrome.flush();
    });

    it('isTorrentUrl(url)', () => {
        const validUrls = [
            'https://example.com/file.torrent',
            'https://example.com/file.torrent?query=value',
            'https://example.com/file.ext?query=file.torrent',
            'https://example.com/torrents.php?action=download&id=1234',
        ];
        validUrls.forEach((url) => expect(isTorrentUrl(url)).to.equal(true));

        const invalidUrls = [
            'https://example.com/file.jpg',
        ];
        invalidUrls.forEach((url) => expect(isTorrentUrl(url)).to.equal(false));
    });

    it('isMagnetUrl(url)', () => {
        const validUrls = [
            'magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a&dn=Test Torrent',
        ];
        validUrls.forEach((url) => expect(isMagnetUrl(url)).to.equal(true));

        const invalidUrls = [
            'https://example.com/file.torrent',
        ];
        invalidUrls.forEach((url) => expect(isMagnetUrl(url)).to.equal(false));
    });

    it('getMagnetUrlName(url)', () => {
        expect(getMagnetUrlName('magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a&dn=Test Torrent')).to.equal('Test Torrent');
        expect(getMagnetUrlName('magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a&dn=Test Torrent&tr=http://tracker.example.com/announce')).to.equal('Test Torrent');

        expect(getMagnetUrlName('magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a')).to.equal(false);
        expect(getMagnetUrlName('https://example.com/file.torrent')).to.equal(false);
    });
});

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
                labels: []
            },
            servers: [
                {
                    name: 'Default',
                    application: 'biglybt',
                    hostname: '',
                    username: '',
                    password: '',
                    directories: [],
                    clientOptions: {}
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
        expect(loadedOptions).to.deep.equal(modifiedOptions);
    });
});
