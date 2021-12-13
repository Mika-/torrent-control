import fetchMock from 'fetch-mock';

import {getTestTorrent} from '../helpers.js';
import ruTorrentApi from '../../src/lib/rutorrent.js';

describe('ruTorrentApi', () => {
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

        instance = new ruTorrentApi({
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
        fetchMock.getOnce('https://example.com:1234/', {
            status: 200,
            body: {
                // ruTorrent HTML is here: https://github.com/Novik/ruTorrent/blob/master/index.html
                result: '<html></html>',
            },
        });

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
        fetchMock.postOnce('https://example.com:1234/php/addtorrent.php?json=1', {
            status: 200,
            body: {
                result: 'Success',
            },
        });

        const torrentFile = await getTestTorrent();

        await instance.addTorrent(torrentFile, {});

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(fetchMock.lastOptions().body).to.deep.equal({
            "torrent_file[]": torrentFile,
        });
    });

    it('Add torrent with options', async () => {
        fetchMock.postOnce('https://example.com:1234/php/addtorrent.php?json=1', {
            status: 200,
            body: {
                result: 'Success',
            },
        });

        const torrentFile = await getTestTorrent();

        await instance.addTorrent(torrentFile, {
            paused: true,
            path: '/mnt/storage',
            label: 'Test',
            fast_resume: true,
        });

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(fetchMock.lastOptions().body).to.deep.equal({
            "torrent_file[]": torrentFile,
            torrents_start_stopped: 'true',
            dir_edit: '/mnt/storage',
            label: 'Test',
            fast_resume: '1',
        });
    });

    it('Add torrent url', async () => {
        fetchMock.getOnce('https://example.com:1234/php/addtorrent.php?json=1&url=https%3A%2F%2Fexample.com%2Ftest.torrent', {
            status: 200,
            body: {
                result: 'Success',
            },
        });

        await instance.addTorrentUrl('https://example.com/test.torrent', {});

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('GET');
    });

    it('Add torrent url fail', async () => {
        fetchMock.getOnce('https://example.com:1234/php/addtorrent.php?json=1&url=https%3A%2F%2Fexample.com%2Fnot_a_torrent_file', {
            status: 200,
            body: {
                result: 'Failed',
            },
        });

        try {
            await instance.addTorrentUrl('https://example.com/not_a_torrent_file', {});
        } catch (e) {
            expect(e).to.be.a('Error');
        }

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('GET');
    });

    it('Add torrent url with options', async () => {
        fetchMock.getOnce('https://example.com:1234/php/addtorrent.php?json=1&url=https%3A%2F%2Fexample.com%2Ftest.torrent&torrents_start_stopped=true&dir_edit=%2Fmnt%2Fstorage&label=Test', {
            status: 200,
            body: {
                result: 'Success',
            },
        });

        await instance.addTorrentUrl('https://example.com/test.torrent', {
            paused: true,
            path: '/mnt/storage',
            label: 'Test',
            sequentialDownload: true,
            firstLastPiecePrio: true,
        });

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('GET');
    });

    it('Add RSS feed', async () => {
        fetchMock.postOnce('https://example.com:1234/plugins/rss/action.php', {
            status: 200,
            body: {
                errors: [],
            },
        });

        await instance.addRssFeed('https://example.com/rss');

        expect(fetchMock.calls().length).to.equal(1);
        expect(fetchMock.lastOptions().method).to.equal('POST');
        expect(fetchMock.lastOptions().body).to.deep.equal({
            url: 'https://example.com/rss',
            label: '',
            mode: 'add',
        });
    });
});
