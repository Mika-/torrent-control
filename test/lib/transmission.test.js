import sinon from 'sinon';
import {getTestTorrent} from '../helpers.js';
import TransmissionApi from '../../src/lib/transmission.js';

describe('TransmissionApi', () => {
    /** @type {TransmissionApi} */
    let instance;

    before(() => {
        instance = new TransmissionApi({
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
                result: 'success',
            }),
        });

        await instance.logIn();

        expect(chrome.webRequest.onHeadersReceived.addListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onBeforeSendHeaders.addListener.calledOnce).to.equal(true);

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/transmission/rpc');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.deep.equal({
            method: 'session-get',
        });
    });

    it('Login fail', async () => {
        const fetchStub= sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: false,
            status: 401,
        });

        try {
            await instance.logIn();
        } catch (e) {
            expect(e).to.be.a('Error');
        }

        expect(chrome.webRequest.onHeadersReceived.addListener.calledOnce).to.equal(true);
        expect(chrome.webRequest.onBeforeSendHeaders.addListener.calledOnce).to.equal(true);

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/transmission/rpc');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.deep.equal({
            method: 'session-get',
        });
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
                result: 'success',
            }),
        });

        const torrentFile = await getTestTorrent();

        await instance.addTorrent(torrentFile);

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/transmission/rpc');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(fetchStub.firstCall.args[1].body).to.match(/{"method":"torrent-add","arguments":{"metainfo":".+?"}}/);
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
                result: 'success',
            }),
        });

        const torrentFile = await getTestTorrent();

        await instance.addTorrent(torrentFile, {
            paused: true,
            path: '/mnt/storage',
            label: 'misc',
        });

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/transmission/rpc');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(fetchStub.firstCall.args[1].body).to.match(/{"method":"torrent-add","arguments":{"metainfo":".+?","paused":true,"download-dir":"\/mnt\/storage","labels":\["misc"]}}/);
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
                result: 'success',
            }),
        });

        await instance.addTorrentUrl('https://example.com/test.torrent', {});

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/transmission/rpc');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.deep.equal({
            method: 'torrent-add',
            arguments: {
                filename: 'https://example.com/test.torrent',
            },
        });
    });

    it('Add torrent url fail', async () => {
        const fetchStub= sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
            headers: new Headers({
                'content-type': 'application/json',
            }),
            json: () => Promise.resolve({
                result: 'error',
            }),
        });

        try {
            await instance.addTorrentUrl('https://example.com/not_a_torrent_file', {});
        } catch (e) {
            expect(e).to.be.a('Error');
        }

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/transmission/rpc');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.deep.equal({
            method: 'torrent-add',
            arguments: {
                filename: 'https://example.com/not_a_torrent_file',
            },
        });
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
                result: 'success',
            }),
        });

        await instance.addTorrentUrl('https://example.com/test.torrent', {
            paused: true,
            path: '/mnt/storage',
        });

        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal('https://example.com:1234/transmission/rpc');
        expect(fetchStub.firstCall.args[1].method).to.equal('POST');
        expect(JSON.parse(fetchStub.firstCall.args[1].body)).to.deep.equal({
            method: 'torrent-add',
            arguments: {
                filename: 'https://example.com/test.torrent',
                paused: true,
                'download-dir': '/mnt/storage',
            },
        });
    });
});
