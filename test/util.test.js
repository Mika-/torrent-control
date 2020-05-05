const chrome = require('sinon-chrome/extensions');
const expect = require('chai').expect;
const rewire = require('rewire');

describe('Test helpers', () => {
    before(() => {
        global.chrome = chrome;
    });

    beforeEach(() => {
        chrome.flush();
    });

    it('isTorrentUrl(url)', () => {
        const util = rewire('./../src/util');

        const isTorrentUrl = util.__get__('isTorrentUrl');

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
        const util = rewire('./../src/util');

        const isMagnetUrl = util.__get__('isMagnetUrl');

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
        const util = rewire('./../src/util');

        const getMagnetUrlName = util.__get__('getMagnetUrlName');

        expect(getMagnetUrlName('magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a&dn=Test Torrent')).to.equal('Test Torrent');
        expect(getMagnetUrlName('magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a&dn=Test Torrent&tr=http://tracker.example.com/announce')).to.equal('Test Torrent');

        expect(getMagnetUrlName('magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a')).to.equal(false);
        expect(getMagnetUrlName('https://example.com/file.torrent')).to.equal(false);
    });
});

describe('Test options', () => {
    before(() => {
        global.chrome = chrome;
    });

    beforeEach(() => {
        chrome.flush();
    });

    it('Load default options', async () => {
        const util = rewire('./../src/util');

        const loadOptions = util.__get__('loadOptions');

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
        const util = rewire('./../src/util');

        const loadOptions = util.__get__('loadOptions');
        const saveOptions = util.__get__('saveOptions');

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

    it('Get server url with basic auth', () => {

        const util = rewire('../src/util');
        const getURL = util.__get__('getURL');

        expect(getURL({ hostname: 'https://127.0.0.1:4000/' })).to.equal('https://127.0.0.1:4000/')
        expect(getURL({ hostname: 'https://127.0.0.1:4000' })).to.equal('https://127.0.0.1:4000/')
        
        expect(getURL({ 
            hostname: 'https://127.0.0.1:4000/', 
            username: 'foo',
            password: 'bar',
        })).to.equal('https://foo:bar@127.0.0.1:4000/')        
        
        expect(getURL({ 
            hostname: 'https://127.0.0.1:4000/', 
            username: '',
            password: '',
        })).to.equal('https://127.0.0.1:4000/')
    })
});
