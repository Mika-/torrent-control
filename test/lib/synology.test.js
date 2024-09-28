import sinon from 'sinon';
import {getTestTorrent} from '../helpers.js';
import SynologyApi from '../../src/lib/synology.js';

describe('SynologyApi', () => {
    /** @type {SynologyApi} */
    let instance;

    before(() => {
        instance = new SynologyApi({
            username: 'testuser',
            password: 'testpassw0rd',
            hostname: 'https://example.com:1234/',
        });
    });

    it('Add torrent', async () => {
        const fetchStub = sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
            text: () => Promise.resolve(),
        });

        const torrentFile = await getTestTorrent();

        await instance.addTorrent(torrentFile, {
            path: '/mnt/storage',
        });

        expect(fetchStub.calledOnce).to.equal(true);
        expect(fetchStub.lastCall.args[0]).to.equal('https://example.com:1234/webapi/DownloadStation/task.cgi');
        expect(fetchStub.lastCall.args[1].method).to.equal('POST');
        expect(fetchStub.lastCall.args[1].body).to.deep.equal({
            api: 'SYNO.DownloadStation.Task',
            file: torrentFile,
            method: 'create',
            password: 'testpassw0rd',
            username: 'testuser',
            version: '1',
            destination: '/mnt/storage',
        });
    });

    it('Add torrent url', async () => {
        const fetchStub = sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: true,
            status: 200,
            text: () => Promise.resolve('OK'),
        });

        await instance.addTorrentUrl('https://example.com/test.torrent');

        expect(fetchStub.calledOnce).to.equal(true);
        expect(fetchStub.lastCall.args[0]).to.equal('https://example.com:1234/webapi/DownloadStation/task.cgi');
        expect(fetchStub.lastCall.args[1].method).to.equal('POST');
        expect(fetchStub.lastCall.args[1].body).to.deep.equal({
            api: 'SYNO.DownloadStation.Task',
            uri: 'https://example.com/test.torrent',
            method: 'create',
            password: 'testpassw0rd',
            username: 'testuser',
            version: '1',
        });
    });

    it('Add torrent url fail', async () => {
        const fetchStub = sinon.stub(global, 'fetch');

        fetchStub.resolves({
            ok: false,
            status: 400,
        });

        try {
            await instance.addTorrentUrl('https://example.com/not_a_torrent_file');
        } catch (e) {
            expect(e).to.be.a('Error');
        }

        expect(fetchStub.calledOnce).to.equal(true);
        expect(fetchStub.lastCall.args[0]).to.equal('https://example.com:1234/webapi/DownloadStation/task.cgi');
        expect(fetchStub.lastCall.args[1].method).to.equal('POST');
    });
});
