import {
    fetchTorrent,
} from '../src/index.js';

import {
    getTestTorrent,
    getTestHtml,
} from './helpers.js';

describe('Main tests', () => {
    beforeEach(() => {
        chrome.flush();
    });

    it('fetchTorrent', async () => {
        const testTorrent = await getTestTorrent();

        chrome.tabs.get.withArgs(2).yields({});
        chrome.tabs.sendMessage.yields({
            ok: true,
            status: 200,
            statusText: 'OK',
            content: testTorrent,
        });

        const responseData = await fetchTorrent('https://example.com/test.torrent', 2);

        expect(responseData).to.deep.equal({
            torrent: testTorrent,
            torrentName: 'ubuntu-20.04-desktop-amd64.iso',
        })

        expect(chrome.tabs.get.calledOnce).to.equal(true);
        expect(chrome.tabs.sendMessage.calledOnce).to.equal(true);
    });

    it('fetchTorrent Network error', async () => {
        chrome.tabs.get.withArgs(3).yields({});
        chrome.tabs.sendMessage.yields(new Error('NetworkError when attempting to fetch resource.'));

        try {
            await fetchTorrent('https://example.com/test.torrent', 3);
        } catch (e) {
            expect(e.message).to.equal('NetworkError when attempting to fetch resource.');
        }

        expect(chrome.tabs.get.calledOnce).to.equal(true);
        expect(chrome.tabs.sendMessage.calledOnce).to.equal(true);
    });

    it('fetchTorrent Not found', async () => {
        chrome.tabs.get.withArgs(3).yields({});
        chrome.tabs.sendMessage.yields({
            ok: false,
            status: 404,
            statusText: 'Not found',
            content: await getTestHtml(),
        });
        chrome.i18n.getMessage.withArgs('torrentFetchError', '404: Not found').returns('Failed to fetch torrent. (404: Not found)');

        try {
            await fetchTorrent('https://example.com/test.torrent', 3);
        } catch (e) {
            expect(e.message).to.equal('Failed to fetch torrent. (404: Not found)');
        }

        expect(chrome.tabs.get.calledOnce).to.equal(true);
        expect(chrome.tabs.sendMessage.calledOnce).to.equal(true);
        expect(chrome.i18n.getMessage.calledOnce).to.equal(true);
    });

    it('fetchTorrent Invalid mime type', async () => {
        chrome.tabs.get.withArgs(3).yields({});
        chrome.tabs.sendMessage.yields({
            ok: true,
            status: 200,
            statusText: 'OK',
            content: await getTestHtml(),
        });
        chrome.i18n.getMessage.withArgs('torrentParseError', 'Unknown type: text/html').returns('Failed to read torrent. (Unknown type: text/html)');

        try {
            await fetchTorrent('https://example.com/test.torrent', 3);
        } catch (e) {
            expect(e.message).to.equal('Failed to read torrent. (Unknown type: text/html)');
        }

        expect(chrome.tabs.get.calledOnce).to.equal(true);
        expect(chrome.tabs.sendMessage.calledOnce).to.equal(true);
        expect(chrome.i18n.getMessage.calledOnce).to.equal(true);
    });
});
