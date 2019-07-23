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

    it('getMagnetUrlName(url)', () => {
        const util = rewire('./../src/util');

        const getMagnetUrlName = util.__get__('getMagnetUrlName');

        expect(getMagnetUrlName('magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a&dn=Test Torrent')).to.equal('Test Torrent');
        expect(getMagnetUrlName('magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a&dn=Test Torrent&tr=http://tracker.example.com/announce')).to.equal('Test Torrent');

        expect(getMagnetUrlName('magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a')).to.equal(false);
        expect(getMagnetUrlName('https://example.com/file.torrent')).to.equal(false);
    });
});
