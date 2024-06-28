import sinon from 'sinon';
import {getTestTorrent} from '../helpers.js';
import tTorrentApi from '../../src/lib/ttorrent.js';

describe('tTorrentApi', () => {
    /** @type {tTorrentApi} */
    let instance;

    before(() => {
        instance = new tTorrentApi({
            username: 'testuser',
            password: 'testpassw0rd',
            hostname: 'https://example.com:1234/',
        });
    });

    it('Login', async () => {
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
        const fetchStub= sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
            text: () => Promise.resolve('OK'),
        });

        const torrentFile = await getTestTorrent();

        await instance.addTorrent(torrentFile);

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/cmd/downloadTorrent');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(fetchStub.firstCall.args[1].body.get('torrentfile')).to.equal(torrentFile);
    });

    it('Add torrent url', async () => {
        const fetchStub= sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
            text: () => Promise.resolve('OK'),
        });

        await instance.addTorrentUrl('https://example.com/test.torrent', {});

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/cmd/downloadFromUrl');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(fetchStub.firstCall.args[1].body.get('url')).to.equal('https://example.com/test.torrent');
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
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/cmd/downloadFromUrl');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(fetchStub.firstCall.args[1].body.get('url')).to.equal('https://example.com/not_a_torrent_file');
    });
});
