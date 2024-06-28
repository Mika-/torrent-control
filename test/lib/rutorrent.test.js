import sinon from 'sinon';
import {getTestTorrent} from '../helpers.js';
import ruTorrentApi from '../../src/lib/rutorrent.js';
import JSDOM from "jsdom";

describe('ruTorrentApi', () => {
    /** @type {ruTorrentApi} */
    let instance;

    before(() => {
        instance = new ruTorrentApi({
            username: 'testuser',
            password: 'testpassw0rd',
            hostname: 'https://example.com:1234/',
            clientOptions: {
                authType: 'httpAuth',
                fast_resume: false,
            },
        });
    });

    it('Login', async () => {
        await instance.logIn();

        expect(chrome.webRequest.onAuthRequired.addListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onCompleted.addListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onErrorOccurred.addListener.calledOnce).to.equal(true);
    });

    it('Login form', async () => {
        const authInstance = new ruTorrentApi({
            username: 'testuser',
            password: 'testpassw0rd',
            hostname: 'https://example.com:1234/',
            clientOptions: {
                authType: 'loginForm',
                fast_resume: false,
            },
        });

        const fetchStub= sinon.stub(global, 'fetch');

        fetchStub.onFirstCall().resolves({
            ok: true,
            status: 200,
            text: () => Promise.resolve('<html><body><form method="POST" action="https://example.com:1234/formtarget"><input type="text" name="username" autocomplete="username"><input type="password" name="password" autocomplete="current-password"></form></body></html>'),
        });

        fetchStub.onSecondCall().resolves({
            ok: true,
            status: 200,
            text: () => Promise.resolve('<html></html>'),
        });

        await authInstance.logIn();

        expect(fetchStub.calledTwice).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/');
        expect(fetchStub.firstCall.args[1].method).to.equal('GET');

        expect(fetchStub.secondCall.args[0]).to.equal('https://example.com:1234/formtarget');
        expect(fetchStub.secondCall.args[1].method).to.equal('POST');
        expect(fetchStub.secondCall.args[1].credentials).to.equal('include');
    });

    it('Logout', async () => {
        await instance.logOut();

        expect(chrome.webRequest.onAuthRequired.removeListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onCompleted.removeListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onErrorOccurred.removeListener.calledOnce).to.equal(true);
    });

    it('Add torrent', async () => {
        const fetchStub= sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
            headers: new Headers({
                'content-type': 'application/json',
            }),
            json: () => Promise.resolve({
                result: 'Success',
            }),
        });

        const torrentFile = await getTestTorrent();

        await instance.addTorrent(torrentFile, {});

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/php/addtorrent.php?json=1');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(fetchStub.firstCall.args[1].body).to.deep.equal({
            'torrent_file[]': torrentFile,
        });
    });

    it('Add torrent with options', async () => {
        const fetchStub= sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
            headers: new Headers({
                'content-type': 'application/json',
            }),
            json: () => Promise.resolve({
                result: 'Success',
            }),
        });

        const torrentFile = await getTestTorrent();

        await instance.addTorrent(torrentFile, {
            paused: true,
            path: '/mnt/storage',
            label: 'Test',
            fast_resume: true,
        });

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/php/addtorrent.php?json=1');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(fetchStub.firstCall.args[1].body).to.deep.equal({
            'torrent_file[]': torrentFile,
            torrents_start_stopped: 'true',
            dir_edit: '/mnt/storage',
            label: 'Test',
            fast_resume: '1',
        });
    });

    it('Add torrent url', async () => {
        const fetchStub= sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
            headers: new Headers({
                'content-type': 'application/json',
            }),
            json: () => Promise.resolve({
                result: 'Success',
            }),
        });

        await instance.addTorrentUrl('https://example.com/test.torrent', {});

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/php/addtorrent.php?json=1&url=https%3A%2F%2Fexample.com%2Ftest.torrent');
        expect(fetchStub.firstCall.args[1].method).to.equal('GET');
    });

    it('Add torrent url fail', async () => {
        const fetchStub= sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
        });

        try {
            await instance.addTorrentUrl('https://example.com/not_a_torrent_file', {});
        } catch (e) {
            expect(e).to.be.a('Error');
        }

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/php/addtorrent.php?json=1&url=https%3A%2F%2Fexample.com%2Fnot_a_torrent_file');
        expect(fetchStub.firstCall.args[1].method).to.equal('GET');
    });

    it('Add torrent url with options', async () => {
        const fetchStub= sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
            headers: new Headers({
                'content-type': 'application/json',
            }),
            json: () => Promise.resolve({
                result: 'Success',
            }),
        });

        await instance.addTorrentUrl('https://example.com/test.torrent', {
            paused: true,
            path: '/mnt/storage',
            label: 'Test',
            sequentialDownload: true,
            firstLastPiecePrio: true,
        });

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/php/addtorrent.php?json=1&url=https%3A%2F%2Fexample.com%2Ftest.torrent&torrents_start_stopped=true&dir_edit=%2Fmnt%2Fstorage&label=Test');
        expect(fetchStub.firstCall.args[1].method).to.equal('GET');
    });

    it('Add RSS feed', async () => {
        const fetchStub= sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
            headers: new Headers({
                'content-type': 'application/json',
            }),
            json: () => Promise.resolve({
                errors: [],
            }),
        });

        await instance.addRssFeed('https://example.com/rss');

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/plugins/rss/action.php');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(fetchStub.firstCall.args[1].body).to.deep.equal({
            url: 'https://example.com/rss',
            label: '',
            mode: 'add',
        });
    });
});
