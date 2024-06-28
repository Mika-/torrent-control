import sinon from 'sinon';
import {getTestTorrent} from '../helpers.js';
import qBittorrentApi from '../../src/lib/qbittorrent.js';

describe('qBittorrentApi (<=4.0.4)', () => {
    /** @type {qBittorrentApi} */
    let instance;

    before(() => {
        instance = new qBittorrentApi({
            username: 'testuser',
            password: 'testpassw0rd',
            hostname: 'https://example.com:1234/',
            apiVersion: 1,
        });
    });

    it('Login', async () => {
        const fetchStub= sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
            text: () => Promise.resolve('Ok.'),
        });

        await instance.logIn();

        expect(chrome.webRequest.onHeadersReceived.addListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onBeforeSendHeaders.addListener.calledOnce).to.equal(true);

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/login');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(fetchStub.firstCall.args[1].body.toString()).to.equal('username=testuser&password=testpassw0rd');
    });

    it('Logout', async () => {
        const fetchStub= sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
        });

        await instance.logOut();

        expect(chrome.webRequest.onHeadersReceived.removeListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onBeforeSendHeaders.removeListener.calledOnce).to.equal(true);

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/logout');
        expect(fetchStub.firstCall.args[1].method).to.equal('GET');
    });

    it('Add torrent', async () => {
        const fetchStub= sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
        });

        const torrentFile = await getTestTorrent();

        await instance.addTorrent(torrentFile, {});

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/command/upload');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(fetchStub.firstCall.args[1].body).to.deep.equal({
            torrents: torrentFile,
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
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/command/download');
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
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/command/download');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(fetchStub.firstCall.args[1].body).to.deep.equal({
            urls: 'https://example.com/not_a_torrent_file',
        });
    });
});
