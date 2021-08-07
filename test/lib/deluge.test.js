import fetchMock from 'fetch-mock';

import {getTestTorrent} from '../helpers.js';
import {base64Encode} from '../../src/base64.js';
import DelugeApi from '../../src/lib/deluge.js';

describe('DelugeApi', () => {
    let instance;

    before(() => {
        instance = new DelugeApi({
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
        fetchMock.postOnce('https://example.com:1234/json', {
            status: 200,
            body: {
                result: true,
                error: null,
            },
        });

        await instance.logIn();

        expect(chrome.webRequest.onHeadersReceived.addListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onBeforeSendHeaders.addListener.calledOnce).to.equal(true);

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(JSON.parse(fetchMock.lastOptions().body)).to.deep.equal({
            method: 'auth.login',
            params: [
                'testpassw0rd'
            ],
            id: 1
        });
    });

    it('Login with HTTP Auth', async () => {
        fetchMock.postOnce('https://example.com:1234/json', {
            status: 200,
            body: {
                result: true,
                error: null,
            },
        });

        const authInstance = new DelugeApi({
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
        expect(JSON.parse(fetchMock.lastOptions().body)).to.deep.equal({
            method: 'auth.login',
            params: [
                'testpassw0rd'
            ],
            id: 1
        });
    });

    it('Login fail', async () => {
        fetchMock.postOnce('https://example.com:1234/json', {
            status: 200,
            body: {
                result: false,
                error: 'fail',
            },
        });

        try {
            await instance.logIn();
        } catch (e) {
            expect(e).to.be.a('Error');
        }

        expect(chrome.webRequest.onHeadersReceived.addListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onBeforeSendHeaders.addListener.calledOnce).to.equal(true);

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(JSON.parse(fetchMock.lastOptions().body)).to.deep.equal({
            method: 'auth.login',
            params: [
                'testpassw0rd'
            ],
            id: 1
        });
    });

    it('Logout', async () => {
        fetchMock.postOnce('https://example.com:1234/json', {
            status: 200,
        });

        await instance.logOut();

        expect(chrome.webRequest.onHeadersReceived.removeListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onBeforeSendHeaders.removeListener.calledOnce).to.equal(true);

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(JSON.parse(fetchMock.lastOptions().body)).to.deep.equal({
            method: 'auth.delete_session',
            params: [],
            id: 4
        });
    });

    it('Add torrent', async () => {
        fetchMock.postOnce('https://example.com:1234/json', {
            status: 200,
            body: {
                error: null,
            },
        });

        const torrentFile = await getTestTorrent();
        const base64Torrent = await base64Encode(torrentFile);

        await instance.addTorrent(torrentFile);

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(JSON.parse(fetchMock.lastOptions().body)).to.deep.equal({
            method: 'core.add_torrent_file',
            params: [
                'temp.torrent',
                base64Torrent,
                {}
            ],
            id: 2
        });
    });

    it('Add torrent with options', async () => {
        fetchMock.postOnce('https://example.com:1234/json', {
            status: 200,
            body: {
                error: null,
            },
        });

        const torrentFile = await getTestTorrent();
        const base64Torrent = await base64Encode(torrentFile);

        await instance.addTorrent(torrentFile, {
            paused: true,
            path: '/mnt/storage',
        });

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(JSON.parse(fetchMock.lastOptions().body)).to.deep.equal({
            method: 'core.add_torrent_file',
            params: [
                'temp.torrent',
                base64Torrent,
                {
                    add_paused: true,
                    download_location: '/mnt/storage',
                }
            ],
            id: 2
        });
    });

    it('Add torrent url', async () => {
        fetchMock.postOnce('https://example.com:1234/json', {
            status: 200,
            body: {
                error: null,
            },
        });

        await instance.addTorrentUrl('https://example.com/test.torrent');

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(JSON.parse(fetchMock.lastOptions().body)).to.deep.equal({
            method: 'core.add_torrent_magnet',
            params: [
                'https://example.com/test.torrent',
                {}
            ],
            id: 2
        });
    });

    it('Add torrent url fail', async () => {
        fetchMock.postOnce('https://example.com:1234/json', {
            status: 200,
            body: {
                error: 'fail',
            },
        });

        try {
            await instance.addTorrentUrl('https://example.com/not_a_torrent_file', {});
        } catch (e) {
            expect(e).to.be.a('Error');
        }

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(JSON.parse(fetchMock.lastOptions().body)).to.deep.equal({
            method: 'core.add_torrent_magnet',
            params: [
                'https://example.com/not_a_torrent_file',
                {}
            ],
            id: 2
        });
    });

    it('Add torrent url with options', async () => {
        fetchMock.postOnce('https://example.com:1234/json', {
            status: 200,
            body: {
                error: null,
            },
        });
        await instance.addTorrentUrl('https://example.com/test.torrent', {
            paused: true,
            path: '/mnt/storage',
        });

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(JSON.parse(fetchMock.lastOptions().body)).to.deep.equal({
            method: 'core.add_torrent_magnet',
            params: [
                'https://example.com/test.torrent',
                {
                    add_paused: true,
                    download_location: '/mnt/storage',
                }
            ],
            id: 2
        });
    });
});
