import fetchMock from 'fetch-mock';

import {getTestTorrent} from '../helpers.js';
import tTorrentApi from '../../src/lib/ttorrent.js';

describe('tTorrentApi', () => {
    let instance;

    before(() => {
        instance = new tTorrentApi({
            username: 'testuser',
            password: 'testpassw0rd',
            hostname: 'https://example.com:1234/',
        });
    });

    afterEach(() => {
        chrome.flush();
        fetchMock.reset();
    });

    it('Login', async () => {
        await instance.logIn();

        expect(chrome.webRequest.onAuthRequired.addListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onCompleted.addListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onErrorOccurred.addListener.calledOnce).to.equal(true);
    });

    it('Logout', async () => {
        await instance.logOut();

        expect(chrome.webRequest.onAuthRequired.removeListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onCompleted.removeListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onErrorOccurred.removeListener.calledOnce).to.equal(true);
    });

    it('Add torrent', async () => {
        fetchMock.postOnce('https://example.com:1234/cmd/downloadTorrent', {
            status: 200,
            body: 'OK',
        });

        const torrentFile = await getTestTorrent();

        await instance.addTorrent(torrentFile);

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastCall()[1].method).to.equal('POST');
        expect(fetchMock.lastCall()[1].body.get('torrentfile')).to.equal(torrentFile);
    });

    it('Add torrent url', async () => {
        fetchMock.postOnce('https://example.com:1234/cmd/downloadFromUrl', {
            status: 200,
            body: 'OK',
        });

        await instance.addTorrentUrl('https://example.com/test.torrent', {});

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastCall()[1].method).to.equal('POST');
        expect(fetchMock.lastCall()[1].body.get('url')).to.equal('https://example.com/test.torrent');
    });

    it('Add torrent url fail', async () => {
        fetchMock.postOnce('https://example.com:1234/cmd/downloadFromUrl', {
            status: 400,
        });

        try {
            await instance.addTorrentUrl('https://example.com/not_a_torrent_file', {});
        } catch (e) {
            expect(e).to.be.a('Error');
        }

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastCall()[1].method).to.equal('POST');
        expect(fetchMock.lastCall()[1].body.get('url')).to.equal('https://example.com/not_a_torrent_file');
    });
});
