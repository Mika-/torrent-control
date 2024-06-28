import sinon from 'sinon';
import {getTestTorrent} from '../helpers.js';
import CloudTorrentApi from '../../src/lib/cloudtorrent.js';

describe('CloudTorrentApi', () => {
    /** @type {CloudTorrentApi} */
    let instance;

    before(() => {
        instance = new CloudTorrentApi({
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

    it('Login without credentials', async () => {
        const loginInstance = new CloudTorrentApi({
            username: '',
            password: '',
            hostname: 'https://example.com:1234/',
        });

        await loginInstance.logIn();

        expect(chrome.webRequest.onAuthRequired.addListener.calledOnce).to.equal(false);
        expect(chrome.webRequest.onCompleted.addListener.calledOnce).to.equal(false);
        expect(chrome.webRequest.onErrorOccurred.addListener.calledOnce).to.equal(false);
    });

    it('Login with only username', async () => {
        const loginInstance = new CloudTorrentApi({
            username: 'testuser',
            password: '',
            hostname: 'https://example.com:1234/',
        });

        await loginInstance.logIn();

        expect(chrome.webRequest.onAuthRequired.addListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onCompleted.addListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onErrorOccurred.addListener.calledOnce).to.equal(true);
    });

    it('Login with only password', async () => {
        const loginInstance = new CloudTorrentApi({
            username: '',
            password: 'testpassw0rd',
            hostname: 'https://example.com:1234/',
        });

        await loginInstance.logIn();

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
        const fetchStub = sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
            text: () => Promise.resolve('OK'),
        });

        const torrentFile = await getTestTorrent();

        await instance.addTorrent(torrentFile);

        expect(fetchStub.calledOnce).to.equal(true);
        expect(fetchStub.lastCall.args[0]).to.equal('https://example.com:1234/api/torrentfile');
        expect(fetchStub.lastCall.args[1].method).to.equal('POST');
        expect(fetchStub.lastCall.args[1].body).to.equal(torrentFile);
    });

    it('Add torrent url', async () => {
        const fetchStub = sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
            text: () => Promise.resolve('OK'),
        });

        await instance.addTorrentUrl('https://example.com/test.torrent', {});

        expect(fetchStub.calledOnce).to.equal(true);
        expect(fetchStub.lastCall.args[0]).to.equal('https://example.com:1234/api/magnet');
        expect(fetchStub.lastCall.args[1].method).to.equal('POST');
        expect(fetchStub.lastCall.args[1].body).to.equal('https://example.com/test.torrent');
    });

    it('Add torrent url fail', async () => {
        const fetchStub = sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: false,
            status: 400,
        });

        try {
            await instance.addTorrentUrl('https://example.com/not_a_torrent_file', {});
        } catch (e) {
            expect(e).to.be.a('Error');
        }

        expect(fetchStub.calledOnce).to.equal(true);
        expect(fetchStub.lastCall.args[0]).to.equal('https://example.com:1234/api/magnet');
        expect(fetchStub.lastCall.args[1].body).to.equal('https://example.com/not_a_torrent_file');
        expect(fetchStub.lastCall.args[1].method).to.equal('POST');
    });
});
