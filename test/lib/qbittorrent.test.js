import fetchMock from 'fetch-mock';

import {getTestTorrent} from '../helpers.js';
import qBittorrentApi from '../../src/lib/qbittorrent.js';

describe('qBittorrentApi', () => {
    let instance;

    before(() => {
        global.FormData = class FormData {
            append(name, value) {
                this[name] = value;
            }
            get (name) {
                return this[name];
            }
        }

        instance = new qBittorrentApi({
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
        fetchMock.postOnce('https://example.com:1234/api/v2/auth/login', 'Ok.');

        await instance.logIn();

        expect(chrome.webRequest.onHeadersReceived.addListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onBeforeSendHeaders.addListener.calledOnce).to.equal(true);

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(fetchMock.lastOptions().body.toString()).to.equal('username=testuser&password=testpassw0rd');
    });

    it('Login with HTTP Auth', async () => {
        fetchMock.postOnce('https://example.com:1234/api/v2/auth/login', 'Ok.');

        const authInstance = new qBittorrentApi({
            username: 'testuser',
            password: 'testpassw0rd',
            hostname: 'https://example.com:1234/',
            httpAuth: {
                username: 'httpUser',
                password: 'httpPassw0rd',
            },
        });

        await authInstance.logIn();

        expect(chrome.webRequest.onHeadersReceived.addListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onBeforeSendHeaders.addListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onAuthRequired.addListener.calledOnce).to.equal(true);

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(fetchMock.lastOptions().body.toString()).to.equal('username=testuser&password=testpassw0rd');
    });

    it('Login fail', async () => {
        fetchMock.postOnce('https://example.com:1234/api/v2/auth/login', 'Fails.');

        try {
            await instance.logIn();
        } catch (e) {
            expect(e).to.be.a('Error');
        }

        expect(chrome.webRequest.onHeadersReceived.addListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onBeforeSendHeaders.addListener.calledOnce).to.equal(true);

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(fetchMock.lastOptions().body.toString()).to.equal('username=testuser&password=testpassw0rd');
    });

    it('Logout', async () => {
        fetchMock.getOnce('https://example.com:1234/api/v2/auth/logout', 200);

        await instance.logOut();

        expect(chrome.webRequest.onHeadersReceived.removeListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onBeforeSendHeaders.removeListener.calledOnce).to.equal(true);

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('GET');
    });

    it('Add torrent', async () => {
        fetchMock.postOnce('https://example.com:1234/api/v2/torrents/add', 200);

        const torrentFile = await getTestTorrent();

        await instance.addTorrent(torrentFile);

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(fetchMock.lastOptions().body).to.deep.equal({
            fileselect: torrentFile,
        });
    });

    it('Add torrent with options', async () => {
        fetchMock.postOnce('https://example.com:1234/api/v2/torrents/add', 200);

        const torrentFile = await getTestTorrent();

        await instance.addTorrent(torrentFile, {
            paused: true,
            path: '/mnt/storage',
            label: 'Test',
            sequentialDownload: true,
            firstLastPiecePrio: true,
            skip_checking: true,
        });

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(fetchMock.lastOptions().body).to.deep.equal({
            fileselect: torrentFile,
            paused: 'true',
            savepath: '/mnt/storage',
            category: 'Test',
            sequentialDownload: 'true',
            firstLastPiecePrio: 'true',
            skip_checking: 'true',
        });
    });

    it('Add torrent url', async () => {
        fetchMock.postOnce('https://example.com:1234/api/v2/torrents/add', 200);

        await instance.addTorrentUrl('https://example.com/test.torrent');

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(fetchMock.lastOptions().body).to.deep.equal({
            urls: 'https://example.com/test.torrent',
        });
    });

    it('Add torrent url fail', async () => {
        fetchMock.postOnce('https://example.com:1234/api/v2/torrents/add', 400);

        try {
            await instance.addTorrentUrl('https://example.com/not_a_torrent_file', {});
        } catch (e) {
            expect(e).to.be.a('Error');
        }

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
    });

    it('Add torrent url with options', async () => {
        fetchMock.postOnce('https://example.com:1234/api/v2/torrents/add', 200);

        await instance.addTorrentUrl('https://example.com/test.torrent', {
            paused: true,
            path: '/mnt/storage',
            label: 'Test',
            sequentialDownload: true,
            firstLastPiecePrio: true,
            skip_checking: true,
        });

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(fetchMock.lastOptions().body).to.deep.equal({
            urls: 'https://example.com/test.torrent',
            paused: 'true',
            savepath: '/mnt/storage',
            category: 'Test',
            sequentialDownload: 'true',
            firstLastPiecePrio: 'true',
            skip_checking: 'true',
        });
    });

    it('Add RSS feed', async () => {
        fetchMock.postOnce('https://example.com:1234/api/v2/rss/addFeed', 200);

        await instance.addRssFeed('https://example.com/rss');

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(fetchMock.lastOptions().body).to.deep.equal({
            url: 'https://example.com/rss',
            path: '',
        });
    });
});
