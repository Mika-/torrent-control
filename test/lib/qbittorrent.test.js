import sinon from 'sinon';
import {getTestTorrent} from '../helpers.js';
import qBittorrentApi from '../../src/lib/qbittorrent.js';

describe('qBittorrentApi (5.0.0)', () => {
    /** @type {qBittorrentApi} */
    let instance;

    before(() => {
        instance = new qBittorrentApi({
            username: 'testuser',
            password: 'testpassw0rd',
            hostname: 'https://example.com:1234/',
        });
    });

    it('Login (<5.2)', async () => {
        const fetchStub = sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
            text: () => Promise.resolve('Ok.'),
        });

        await instance.logIn();

        expect(chrome.webRequest.onHeadersReceived.addListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onBeforeSendHeaders.addListener.calledOnce).to.equal(true);

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/api/v2/auth/login');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(fetchStub.firstCall.args[1].body.toString()).to.equal('username=testuser&password=testpassw0rd');

        instance.listeners.onHeadersReceived({
            responseHeaders: [
                {
                    name: 'set-cookie',
                    value: 'SID=062elnAQzhtqWynll9vQGvYa1oKldhnr; HttpOnly; SameSite=Strict; path=/',
                },
            ],
        });

        expect(instance.cookie).to.equal('SID=062elnAQzhtqWynll9vQGvYa1oKldhnr');
    });

    it('Login', async () => {
        const fetchStub = sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 204,
            text: () => Promise.resolve(''),
        });

        await instance.logIn();

        expect(chrome.webRequest.onHeadersReceived.addListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onBeforeSendHeaders.addListener.calledOnce).to.equal(true);

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/api/v2/auth/login');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(fetchStub.firstCall.args[1].body.toString()).to.equal('username=testuser&password=testpassw0rd');

        instance.listeners.onHeadersReceived({
            responseHeaders: [
                {
                    name: 'set-cookie',
                    value: 'QBT_SID_8080=i4C0S3/xM9aJP5Q0duGWQ01QdJhoz0VN; HttpOnly; SameSite=Strict; expires=Mon, 23-Feb-2026 18:29:20 GMT; path=/',
                },
            ],
        });

        expect(instance.cookie).to.equal('QBT_SID_8080=i4C0S3/xM9aJP5Q0duGWQ01QdJhoz0VN');
    });

    it('Login with HTTP Auth', async () => {
        const fetchStub = sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
            text: () => Promise.resolve('Ok.'),
        });

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

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/api/v2/auth/login');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(fetchStub.firstCall.args[1].body.toString()).to.equal('username=testuser&password=testpassw0rd');
    });

    it('Login fail (<5.2)', async () => {
        const fetchStub = sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
            text: () => Promise.resolve('Fails.'),
        });

        try {
            await instance.logIn();
        } catch (e) {
            expect(e).to.be.a('Error');
        }

        expect(chrome.webRequest.onHeadersReceived.addListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onBeforeSendHeaders.addListener.calledOnce).to.equal(true);

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/api/v2/auth/login');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(fetchStub.firstCall.args[1].body.toString()).to.equal('username=testuser&password=testpassw0rd');
    });

    it('Login fail', async () => {
        const fetchStub = sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 401,
            text: () => Promise.resolve('Unauthorized'),
        });

        try {
            await instance.logIn();
        } catch (e) {
            expect(e).to.be.a('Error');
        }

        expect(chrome.webRequest.onHeadersReceived.addListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onBeforeSendHeaders.addListener.calledOnce).to.equal(true);

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/api/v2/auth/login');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(fetchStub.firstCall.args[1].body.toString()).to.equal('username=testuser&password=testpassw0rd');
    });

    it('Logout', async () => {
        const fetchStub= sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
            text: () => Promise.resolve('Fails.'),
        });

        await instance.logOut();

        expect(chrome.webRequest.onHeadersReceived.removeListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onBeforeSendHeaders.removeListener.calledOnce).to.equal(true);

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/api/v2/auth/logout');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
    });

    it('Add torrent', async () => {
        const fetchStub= sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
        });

        const torrentFile = await getTestTorrent();

        await instance.addTorrent(torrentFile);

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/api/v2/torrents/add');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(fetchStub.firstCall.args[1].body).to.deep.equal({
            fileselect: torrentFile,
        });
    });

    it('Add torrent with options', async () => {
        const fetchStub= sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
        });

        const torrentFile = await getTestTorrent();

        await instance.addTorrent(torrentFile, {
            paused: true,
            path: '/mnt/storage',
            label: 'Test',
            sequentialDownload: true,
            firstLastPiecePrio: true,
            skip_checking: true,
            contentLayout: 'Subfolder',
        });

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/api/v2/torrents/add');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(fetchStub.firstCall.args[1].body).to.deep.equal({
            fileselect: torrentFile,
            stopped: 'true',
            savepath: '/mnt/storage',
            category: 'Test',
            sequentialDownload: 'true',
            firstLastPiecePrio: 'true',
            skip_checking: 'true',
            contentLayout: 'Subfolder',
        });
    });

    it('Add torrent url', async () => {
        const fetchStub= sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
        });

        await instance.addTorrentUrl('https://example.com/test.torrent');

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/api/v2/torrents/add');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(fetchStub.firstCall.args[1].body).to.deep.equal({
            urls: 'https://example.com/test.torrent',
        });
    });

    it('Add torrent url fail', async () => {
        const fetchStub= sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: false,
            status: 400,
        });

        try {
            await instance.addTorrentUrl('https://example.com/not_a_torrent_file', {});
        } catch (e) {
            expect(e).to.be.a('Error');
        }

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/api/v2/torrents/add');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
    });

    it('Add torrent url with options', async () => {
        const fetchStub= sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
        });

        await instance.addTorrentUrl('https://example.com/test.torrent', {
            paused: true,
            path: '/mnt/storage',
            label: 'Test',
            sequentialDownload: true,
            firstLastPiecePrio: true,
            skip_checking: true,
        });

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/api/v2/torrents/add');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(fetchStub.firstCall.args[1].body).to.deep.equal({
            urls: 'https://example.com/test.torrent',
            stopped: 'true',
            savepath: '/mnt/storage',
            category: 'Test',
            sequentialDownload: 'true',
            firstLastPiecePrio: 'true',
            skip_checking: 'true',
        });
    });

    it('Add RSS feed', async () => {
        const fetchStub= sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
        });

        await instance.addRssFeed('https://example.com/rss');

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/api/v2/rss/addFeed');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(fetchStub.firstCall.args[1].body).to.deep.equal({
            url: 'https://example.com/rss',
            path: '',
        });
    });
});
