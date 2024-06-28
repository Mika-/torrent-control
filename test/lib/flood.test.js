import sinon from 'sinon';
import {getTestTorrent} from '../helpers.js';
import {base64Encode} from '../../src/base64.js';
import FloodApi from '../../src/lib/flood.js';

describe('FloodApi', () => {
    /** @type {FloodApi} */
    let instance;

    before(() => {
        instance = new FloodApi({
            username: 'testuser',
            password: 'testpassw0rd',
            hostname: 'https://example.com:1234/',
        });
    });

    it('Login', async () => {
        const fetchStub= sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
            headers: new Headers({
                'content-type': 'application/json',
            }),
            json: () => Promise.resolve({
                success: true,
                username: 'testuser',
                level: 10,
            }),
        });

        await instance.logIn();

        expect(chrome.webRequest.onHeadersReceived.addListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onBeforeSendHeaders.addListener.calledOnce).to.equal(true);

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/api/auth/authenticate');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.deep.equal({
            username: 'testuser',
            password: 'testpassw0rd',
        });
    });

    it('Login with HTTP Auth', async () => {
        const fetchStub= sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
            headers: new Headers({
                'content-type': 'application/json',
            }),
            json: () => Promise.resolve({
                success: true,
                username: 'testuser',
                level: 10,
            }),
        });

        const authInstance = new FloodApi({
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
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/api/auth/authenticate');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.deep.equal({
            username: 'testuser',
            password: 'testpassw0rd',
        });
    });

    it('Login fail', async () => {
        const fetchStub= sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: false,
            status: 401,
            headers: new Headers({
                'content-type': 'application/json',
            }),
            json: () => Promise.resolve({
                message: 'Failed login.',
            }),
        });

        try {
            await instance.logIn();
        } catch (e) {
            expect(e).to.be.a('Error');
        }

        expect(chrome.webRequest.onHeadersReceived.addListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onBeforeSendHeaders.addListener.calledOnce).to.equal(true);

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/api/auth/authenticate');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.deep.equal({
            username: 'testuser',
            password: 'testpassw0rd',
        });
    });

    it('Logout', async () => {
        await instance.logOut();

        expect(chrome.webRequest.onHeadersReceived.removeListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onBeforeSendHeaders.removeListener.calledOnce).to.equal(true);
    });

    it('Add torrent', async () => {
        const fetchStub= sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
        });

        const torrentFile = await getTestTorrent();
        const base64Torrent = await base64Encode(torrentFile);

        await instance.addTorrent(torrentFile);

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/api/torrents/add-files');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.deep.equal({
            files: [
                base64Torrent,
            ],
            destination: '',
            tags: [],
            start: true
        });
    });

    it('Add torrent with options', async () => {
        const fetchStub= sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
        });

        const torrentFile = await getTestTorrent();
        const base64Torrent = await base64Encode(torrentFile);

        await instance.addTorrent(torrentFile, {
            paused: true,
            path: '/mnt/storage',
            label: 'Test',
        });

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/api/torrents/add-files');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.deep.equal({
            files: [
                base64Torrent,
            ],
            destination: '/mnt/storage',
            tags: ['Test'],
            start: false
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
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/api/torrents/add-urls');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.deep.equal({
            urls: [
                'https://example.com/test.torrent',
            ],
            destination: '',
            tags: [],
            start: true
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
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/api/torrents/add-urls');
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
        });

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/api/torrents/add-urls');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.deep.equal({
            urls: [
                'https://example.com/test.torrent',
            ],
            destination: '/mnt/storage',
            tags: ['Test'],
            start: false
        });
    });
});
