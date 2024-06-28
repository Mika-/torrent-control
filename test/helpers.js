import { promises } from 'node:fs';
import JSDOM from 'jsdom';

export const getTestTorrent = async () => {
    const jsdom = new JSDOM.JSDOM();

    return new jsdom.window.Blob([await promises.readFile('./test/test.torrent')], {
        type: 'application/x-bittorrent',
    });
}

export const getTestHtml = async () => {
    const jsdom = new JSDOM.JSDOM();

    return new jsdom.window.Blob(['<!doctype html>'], {
        type: 'text/html',
    });
}
