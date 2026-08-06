import BaseClient from './baseclient.js';
import {base64Encode} from '../base64.js';

export default class TransmissionApi extends BaseClient {

    constructor(serverSettings) {
        super();

        this.settings = serverSettings;
        this.session = null;
    }

    get rpcUrl() {
        const {hostname} = this.settings;

        if (hostname.endsWith('/rpc') || hostname.endsWith('/rpc/'))
            return hostname;

        return hostname + 'transmission/rpc';
    }

    logIn() {
        this._attachListeners();

        return new Promise((resolve, reject) => {
            fetch(this.rpcUrl, {
                method: 'POST',
                headers: new Headers({
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({
                    method: 'session-get'
                })
            })
            .then((response) => {
                if (response.status === 200)
                    return response.json();
                else if (response.status === 401)
                    throw new Error(chrome.i18n.getMessage('loginError'));
                else if (response.status === 409 && response.headers.has('X-Transmission-Session-Id'))
                    return { result: 'success' };
                else
                    throw new Error(chrome.i18n.getMessage('apiError', response.status.toString() + ': ' + response.statusText));
            })
            .then((json) => {
                if (json.result === 'success')
                    resolve();
                else
                    throw new Error(chrome.i18n.getMessage('loginError'));
            })
            .catch((error) => reject(error));
        });
    }

    logOut() {
        this.removeEventListeners();
        this.session = null;

        return Promise.resolve();
    }

    addTorrent(torrent, options = {}) {
                return new Promise((resolve, reject) => {
            base64Encode(torrent).then((base64torrent) => {
                let request = {
                    method: 'torrent-add',
                    arguments: {
                        metainfo: base64torrent
                    }
                };

                if (options.paused)
                    request.arguments.paused = options.paused;

                if (options.path)
                    request.arguments['download-dir'] = options.path;

                if (options.label)
                    request.arguments.labels = [options.label];

                const headers = new Headers({
                    'Content-Type': 'application/json'
                });

                if (this.session) {
                    headers.append('X-Transmission-Session-Id', this.session);
                }

                return fetch(this.rpcUrl, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(request)
                })
                .then((response) => response.json())
                .then((json) => {
                    if (json.result === 'success')
                        resolve();
                    else
                        throw new Error(chrome.i18n.getMessage('torrentAddError'));
                })
            }).catch((error) => reject(error));
        });
    }

    addTorrentUrl(url, options = {}) {
        return new Promise((resolve, reject) => {
            let request = {
                method: 'torrent-add',
                arguments: {
                    filename: url
                }
            };

            if (options.paused)
                request.arguments.paused = options.paused;

            if (options.path)
                request.arguments['download-dir'] = options.path;

            if (options.label)
                request.arguments.labels = [options.label];

            const headers = new Headers({
                'Content-Type': 'application/json'
            });

            if (this.session) {
                headers.append('X-Transmission-Session-Id', this.session);
            }


            fetch(this.rpcUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(request)
            })
            .then((response) => response.json())
            .then((json) => {
                if (json.result === 'success')
                    resolve();
                else
                    throw new Error(chrome.i18n.getMessage('torrentAddError'));
            })
            .catch((error) => reject(error));
        });
    }

    _attachListeners() {
        const {username, password} = this.settings;

        if (username !== '' && password !== '') {
            this.addAuthRequiredListener(username, password);
        }

        this.addHeadersReceivedEventListener((details) => {
            const sessionHeader = details.responseHeaders.find((header) => header.name.toLowerCase() === 'x-transmission-session-id');

            if (sessionHeader) {
                this.session = sessionHeader.value;
            }
        });
    }

}
