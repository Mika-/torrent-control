import fetchMock from 'fetch-mock';

import {getTestTorrent} from '../helpers.js';
import TransmissionApi from '../../src/lib/transmission.js';

describe('TransmissionApi', () => {
    let instance;

    before(() => {
        instance = new TransmissionApi({
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
        fetchMock.postOnce('https://example.com:1234/transmission/rpc', {
            status: 200,
            body: {
                result: 'success',
            },
        });

        await instance.logIn();

        expect(chrome.webRequest.onHeadersReceived.addListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onBeforeSendHeaders.addListener.calledOnce).to.equal(true);

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(fetchMock.lastOptions().body.toString()).to.equal('{"method":"session-get"}');
    });

    it('Login fail', async () => {
        fetchMock.postOnce('https://example.com:1234/transmission/rpc', {
            status: 401,
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
        expect(fetchMock.lastOptions().body.toString()).to.equal('{"method":"session-get"}');
    });

    it('Add torrent', async () => {
        fetchMock.postOnce('https://example.com:1234/transmission/rpc', {
            status: 200,
            body: {
                result: 'success',
            },
        });

        const torrentFile = await getTestTorrent();

        await instance.addTorrent(torrentFile);

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(fetchMock.lastOptions().body.toString()).to.match(/{"method":"torrent-add","arguments":{"metainfo":".+?"}}/);
    });

    it('Add torrent with options', async () => {
        fetchMock.postOnce('https://example.com:1234/transmission/rpc', {
            status: 200,
            body: {
                result: 'success',
            },
        });

        const torrentFile = await getTestTorrent();

        await instance.addTorrent(torrentFile, {
            paused: true,
            path: '/mnt/storage',
            label: 'misc',
        });

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(fetchMock.lastOptions().body.toString()).to.match(/{"method":"torrent-add","arguments":{"metainfo":".+?","paused":true,"download-dir":"\/mnt\/storage","labels":\["misc"]}}/);
    });

    it('Add torrent url', async () => {
        fetchMock.postOnce('https://example.com:1234/transmission/rpc', {
            status: 200,
            body: {
                result: 'success',
            },
        });

        await instance.addTorrentUrl('https://example.com/test.torrent', {});

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(fetchMock.lastOptions().body.toString()).to.equal('{"method":"torrent-add","arguments":{"filename":"https://example.com/test.torrent"}}');
    });

    it('Add torrent url fail', async () => {
        fetchMock.postOnce('https://example.com:1234/transmission/rpc', {
            status: 200,
            body: {
                result: 'error',
            },
        });

        try {
            await instance.addTorrentUrl('https://example.com/not_a_torrent_file', {});
        } catch (e) {
            expect(e).to.be.a('Error');
        }

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
    });

    it('Add torrent url with options', async () => {
        fetchMock.postOnce('https://example.com:1234/transmission/rpc', {
            status: 200,
            body: {
                result: 'success',
            },
        });

        await instance.addTorrentUrl('https://example.com/test.torrent', {
            paused: true,
            path: '/mnt/storage',
        });

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(fetchMock.lastOptions().body.toString()).to.equal('{"method":"torrent-add","arguments":{"filename":"https://example.com/test.torrent","paused":true,"download-dir":"/mnt/storage"}}');
    });
});
