const fsPromises = require('fs').promises;
const { JSDOM } = require('jsdom');

export const getTestTorrent = async () => {
    const jsdom = new JSDOM();

    return new jsdom.window.Blob([await fsPromises.readFile('./test/test.torrent')], {
        type: 'application/x-bittorrent',
    });
}
