import {
    clientList,
    whitelist,
    isTorrentUrl,
    isMagnetUrl,
    getClient,
    getHostFilter,
    getServerForUrl,
    matchesRoutePattern,
    getTorrentName,
    getMagnetUrlName,
    regExpFromString,
} from '../src/util.js';

import {getTestTorrent} from './helpers.js';

describe('Test helpers', () => {
    beforeEach(() => {
        chrome.flush();
    });

    for (const client of clientList) {
        it(`Test load client instance ${client.id}`, () => {
            const instance = getClient({
                application: client.id,
                hostname: 'https://example.com:1234/',
            });

            expect(instance).to.be.a('object');
        })
    }

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

    it('regExpFromString', () => {
        expect(regExpFromString('abcd')).to.deep.equal(/abcd/);
        expect(regExpFromString('/abcd/g')).to.deep.equal(/abcd/g);
        expect(regExpFromString('(\\d+)')).to.deep.equal(/(\d+)/);
        expect(regExpFromString('m\/m')).to.deep.equal(/m\/m/);
        expect(regExpFromString('/\\/download\\.php\\?id=[a-z0-9]{40}&f=.+?&key=/')).to.deep.equal(/\/download\.php\?id=[a-z0-9]{40}&f=.+?&key=/);
    });

    it('matchesRoutePattern hostname patterns', () => {
        const matches = [
            ['https://tracker.example.com/torrents.php?id=1', 'tracker.example.com'],
            ['https://TRACKER.example.com/file.torrent', 'tracker.example.com'],
            ['https://tracker.example.com:8080/file.torrent', 'tracker.example.com'],
            ['https://example.com/file.torrent', '*.example.com'],
            ['https://tracker.example.com/file.torrent', '*.example.com'],
            ['https://a.b.example.com/file.torrent', '*.example.com'],
            ['https://tracker.example.com/file.torrent', 'tracker.*.com'],
            ['https://example.com/file.torrent', '  example.com  '],
            // A pasted address is shorthand for its hostname
            ['https://example.com/file.torrent', 'https://example.com/'],
            ['https://tracker.example.com/file.torrent', 'https://tracker.example.com:8080/gui/'],
            ['https://example.com/file.torrent', 'example.com/'],
        ];
        matches.forEach(([url, pattern]) =>
            expect(matchesRoutePattern(url, pattern)).to.equal(true, `${pattern} vs ${url}`));

        const nonMatches = [
            ['https://tracker.example.com/file.torrent', 'example.com'],
            ['https://notexample.com/file.torrent', 'example.com'],
            ['https://example.com.evil.net/file.torrent', 'example.com'],
            ['https://a.b.example.com/file.torrent', 'tracker.*.com'],
            ['https://example.com/file.torrent', ''],
            ['https://example.com/dl/1', 'example.com/dl'],
            ['not a url at all', 'example.com'],
            // Magnet links have no hostname
            ['magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a', 'example.com'],
        ];
        nonMatches.forEach(([url, pattern]) =>
            expect(matchesRoutePattern(url, pattern)).to.equal(false, `${pattern} vs ${url}`));
    });

    it('matchesRoutePattern regexp patterns', () => {
        expect(matchesRoutePattern('https://example.com/dl/1', '/^https:\\/\\/example\\.com\\/dl\\//')).to.equal(true);
        expect(matchesRoutePattern('https://example.com/up/1', '/^https:\\/\\/example\\.com\\/dl\\//')).to.equal(false);
        expect(matchesRoutePattern('https://EXAMPLE.com/dl/1', '/example\\.com/i')).to.equal(true);

        // Regexps are tested against the whole URL, so they also apply to magnets
        expect(matchesRoutePattern('magnet:?xt=urn:btih:abc&tr=http://tracker.example.com/announce', '/tracker\\.example\\.com/')).to.equal(true);

        // An unparseable pattern must not throw
        expect(matchesRoutePattern('https://example.com/file.torrent', '/[unclosed/')).to.equal(false);
    });

    it('getServerForUrl', () => {
        const servers = [
            {name: 'Default', routeUrls: []},
            {name: 'Seedbox', routeUrls: ['tracker-one.example', '*.tracker-two.org']},
            {name: 'Local', routeUrls: ['/^https:\\/\\/gaz\\..*\\/dl\\//']},
            {name: 'Legacy'},
        ];

        expect(getServerForUrl('https://tracker-one.example/file.torrent', servers)).to.equal(1);
        expect(getServerForUrl('https://dl.tracker-two.org/file.torrent', servers)).to.equal(1);
        expect(getServerForUrl('https://gaz.example.com/dl/1', servers)).to.equal(2);

        // No match, and a server without routeUrls must not throw
        expect(getServerForUrl('https://example.com/file.torrent', servers)).to.equal(null);
        expect(getServerForUrl('magnet:?xt=urn:btih:abc', servers)).to.equal(null);
        expect(getServerForUrl('https://example.com/file.torrent', [])).to.equal(null);
    });

    it('getServerForUrl returns the first matching server', () => {
        const servers = [
            {name: 'First', routeUrls: ['*.example.com']},
            {name: 'Second', routeUrls: ['tracker.example.com']},
        ];

        expect(getServerForUrl('https://tracker.example.com/file.torrent', servers)).to.equal(0);
    });

    it('Test getHostFilter', () => {
        const testCases = [
            {
                hostname: 'http://example.com/',
                result: 'http://example.com/*',
            },
            {
                hostname: 'https://example.com/',
                result: 'https://example.com/*',
            },
            {
                hostname: 'https://example.com:8080/webui',
                result: 'https://example.com/*',
            },
            {
                hostname: 'https://long.sub.domain.example.com/',
                result: 'https://long.sub.domain.example.com/*',
            },
            {
                hostname: 'https://user:pass@example.com:9000',
                result: 'https://example.com/*',
            },
            {
                hostname: 'https://127.0.0.1:8080/',
                result: 'https://127.0.0.1/*',
            },
            {
                hostname: 'https://[2001:0db8:0000:0000:0000:0000:1420:57ab]:8080/webui',
                result: 'https://[2001:db8::1420:57ab]/*',
            },
        ];

        testCases.forEach((testCase) => {
            expect(getHostFilter(testCase.hostname)).to.equal(testCase.result)
        });
    });
});
