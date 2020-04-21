import { promises as fsPromises } from 'fs';
import { expect } from 'chai';
import fetchMock from 'fetch-mock';
import qBittorrentApi from '../../src/lib/qbittorrent';
const chrome = require('sinon-chrome/extensions');
(global as any).chrome = chrome;


describe('qBittorrentApi', () => {
    let instance;

    before(() => {
        (global as any).FormData = class FormData {
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
        fetchMock.reset();
    });

    it('Login', async () => {
        fetchMock.postOnce('https://example.com:1234/api/v2/auth/login', 'Ok.');

        await instance.logIn();

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(fetchMock.lastOptions().body.toString()).to.equal('username=testuser&password=testpassw0rd');
    });

    it('Logout', async () => {
        fetchMock.getOnce('https://example.com:1234/api/v2/auth/logout', 200);

        await instance.logOut();

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('GET');
    });

    it('Add torrent', async () => {
        fetchMock.postOnce('https://example.com:1234/api/v2/torrents/add', 200);

        const torrentFile = await fsPromises.readFile('./test/test.torrent');

        await instance.addTorrent(torrentFile, {});

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(fetchMock.lastOptions().body).to.deep.equal({
            fileselect: torrentFile,
        });
    });

    it('Add torrent with options', async () => {
        fetchMock.postOnce('https://example.com:1234/api/v2/torrents/add', 200);

        const torrentFile = await fsPromises.readFile('./test/test.torrent');

        await instance.addTorrent(torrentFile, {
            paused: true,
            path: '/mnt/storage',
            label: 'Test',
            sequentialDownload: true,
            firstLastPiecePrio: true,
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
        });
    });

    it('Add torrent url', async () => {
        fetchMock.postOnce('https://example.com:1234/api/v2/torrents/add', 200);

        await instance.addTorrentUrl('https://example.com/test.torrent', {});

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
