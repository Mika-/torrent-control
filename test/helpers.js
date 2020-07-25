import fsPromises from 'fs/promises';
import JSDOM from 'jsdom';

export const getTestTorrent = async () => {
    const jsdom = new JSDOM.JSDOM();

    return new jsdom.window.Blob([await fsPromises.readFile('./test/test.torrent')], {
        type: 'application/x-bittorrent',
    });
}
