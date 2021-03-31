import {
    whitelist,
    isTorrentUrl,
    isMagnetUrl,
    getTorrentName,
    getMagnetUrlName,
    getURL,
    regExpFromString,
} from '../src/util.js';

import {getTestTorrent} from './helpers.js';

describe('Test helpers', () => {
    beforeEach(() => {
        chrome.flush();
    });

    it('isTorrentUrl', () => {
        const validUrls = [
            'https://example.com/file.torrent',
            'https://example.com/file.torrent?query=value',
            'https://example.com/file.ext?query=file.torrent',
            'https://example.com/torrents.php?action=download&id=1234',
        ];
        validUrls.forEach((url) => expect(isTorrentUrl(url, whitelist)).to.equal(true, url));

        const invalidUrls = [
            'https://example.com/file.jpg',
        ];
        invalidUrls.forEach((url) => expect(isTorrentUrl(url, whitelist)).to.equal(false, url));
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
        const torrentFile = await getTestTorrent();

        expect(await getTorrentName(torrentFile)).to.equal('ubuntu-20.04-desktop-amd64.iso');
    });

    it('Get server url with basic auth', () => {
        expect(getURL({
            hostname: 'https://127.0.0.1:4000/',
            application: 'rutorrent',
        })).to.equal('https://127.0.0.1:4000/');

        expect(getURL({
            hostname: 'https://127.0.0.1:4000',
            application: 'rutorrent',
        })).to.equal('https://127.0.0.1:4000/');

        expect(getURL({
            hostname: 'https://127.0.0.1:4000/',
            username: 'foo',
            password: 'bar',
            application: 'rutorrent',
        })).to.equal('https://foo:bar@127.0.0.1:4000/');

        expect(getURL({
            hostname: 'https://127.0.0.1:4000/',
            username: '',
            password: '',
            application: 'rutorrent',
        })).to.equal('https://127.0.0.1:4000/');

        expect(getURL({
            hostname: 'https://127.0.0.1:4000/',
            username: 'foo',
            password: 'bar',
            application: 'qbittorrent',
        })).to.equal('https://127.0.0.1:4000/');
    });

    it('regExpFromString', () => {
        expect(regExpFromString('abcd')).to.deep.equal(/abcd/);
        expect(regExpFromString('/abcd/g')).to.deep.equal(/abcd/g);
        expect(regExpFromString('(\\d+)')).to.deep.equal(/(\d+)/);
        expect(regExpFromString('m\/m')).to.deep.equal(/m\/m/);
        expect(regExpFromString('/\\/download\\.php\\?id=[a-z0-9]{40}&f=.+?&key=/')).to.deep.equal(/\/download\.php\?id=[a-z0-9]{40}&f=.+?&key=/);
    });
});
