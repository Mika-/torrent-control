const fsPromises = require('fs').promises;
const expect = require('chai').expect;
const fetchMock = require('fetch-mock');
const chrome = require('sinon-chrome/extensions');
global.chrome = chrome;

import qBittorrentApi from '../../src/lib/qbittorrent';

describe('qBittorrentApi (<=4.0.4)', () => {
    let instance;

    before(() => {
        global.chrome = chrome;

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
            apiVersion: 1,
        });
    });

    afterEach(() => {
        chrome.flush();
        fetchMock.reset();
    });

    it('Login', async () => {
        fetchMock.postOnce('https://example.com:1234/login', 'Ok.');

        await instance.logIn();

        expect(chrome.webRequest.onHeadersReceived.addListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onBeforeSendHeaders.addListener.calledOnce).to.equal(true);

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(fetchMock.lastOptions().body.toString()).to.equal('username=testuser&password=testpassw0rd');
    });

    it('Logout', async () => {
        fetchMock.getOnce('https://example.com:1234/logout', 200);

        await instance.logOut();

        expect(chrome.webRequest.onHeadersReceived.removeListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onBeforeSendHeaders.removeListener.calledOnce).to.equal(true);

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('GET');
    });

    it('Add torrent', async () => {
        fetchMock.postOnce('https://example.com:1234/command/upload', 200);

        const torrentFile = await fsPromises.readFile('./test/test.torrent');

        await instance.addTorrent(torrentFile, {});

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(fetchMock.lastOptions().body).to.deep.equal({
            torrents: torrentFile,
        });
    });

    it('Add torrent url', async () => {
        fetchMock.postOnce('https://example.com:1234/command/download', 200);

        await instance.addTorrentUrl('https://example.com/test.torrent', {});

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(fetchMock.lastOptions().body).to.deep.equal({
            urls: 'https://example.com/test.torrent',
        });
    });

    it('Add torrent url fail', async () => {
        fetchMock.postOnce('https://example.com:1234/command/download', 400);

        try {
            await instance.addTorrentUrl('https://example.com/not_a_torrent_file', {});
        } catch (e) {
            expect(e).to.be.a('Error');
        }

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
    });
});
