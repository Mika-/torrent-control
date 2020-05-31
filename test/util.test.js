const expect = require('chai').expect;
const { JSDOM } = require('jsdom');

import {getTestTorrent} from './helpers';
import {
    isTorrentUrl,
    getTorrentName,
    isMagnetUrl,
    getMagnetUrlName,
    getURL,
} from '../src/util';

describe('Test helpers', () => {
    it('isTorrentUrl', () => {
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

    it('isMagnetUrl', () => {
        const validUrls = [
            'magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a&dn=Test Torrent',
        ];
        validUrls.forEach((url) => expect(isMagnetUrl(url)).to.equal(true));

        const invalidUrls = [
            'https://example.com/file.torrent',
        ];
        invalidUrls.forEach((url) => expect(isMagnetUrl(url)).to.equal(false));
    });

    it('getMagnetUrlName', () => {
        expect(getMagnetUrlName('magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a&dn=Test Torrent')).to.equal('Test Torrent');
        expect(getMagnetUrlName('magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a&dn=Test Torrent&tr=http://tracker.example.com/announce')).to.equal('Test Torrent');

        expect(getMagnetUrlName('magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a')).to.equal(false);
        expect(getMagnetUrlName('https://example.com/file.torrent')).to.equal(false);
    });

    it('getTorrentName', async () => {
        const jsdom = new JSDOM();
        global.FileReader = jsdom.window.FileReader;

        const torrentFile = await getTestTorrent();

        expect(await getTorrentName(torrentFile)).to.equal('ubuntu-20.04-desktop-amd64.iso');

        delete global.FileReader;
    });

    it('Get server url with basic auth', () => {
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
