import BaseClient from './baseclient.js';
import {base64Encode} from '../base64.js';

export default class FloodApi extends BaseClient {

    constructor(serverSettings) {
        super();

        this.settings = serverSettings;
        this.cookie = null;
    }

    logIn() {
        const {hostname, username, password} = this.settings;

        this._attachListeners();

        return new Promise((resolve, reject) => {
            let request = {
                username: username,
                password: password,
            };

            fetch(hostname + 'api/auth/authenticate', {
                method: 'POST',
                headers: new Headers({
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify(request)
            })
            .then((response) => {
                if (response.ok)
                    return response.json();
                else
                    throw new Error(chrome.i18n.getMessage('apiError', response.status.toString() + ': ' + response.statusText));
            })
            .then((json) => {
                if (json.success === true) {
                    resolve();
                }
                else if (json.success === false)
                    throw new Error(chrome.i18n.getMessage('loginError'));
                else
                    throw new Error(chrome.i18n.getMessage('apiError', text));
            })
            .catch((error) => reject(error));
        });
    }

    logOut() {
        this.removeEventListeners();

        return Promise.resolve();
    }

    addTorrent(torrent, options = {}) {
        const {hostname} = this.settings;

        return new Promise((resolve, reject) => {
            base64Encode(torrent).then((base64torrent) => {
                let request = {
                    files: [
                        base64torrent,
                    ],
                    destination: options.path || '',
                    tags: options.label ? [options.label] : [],
                    start: !(options.paused || false)
                };

                return fetch(hostname + 'api/torrents/add-files', {
                    method: 'POST',
                    headers: new Headers({
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify(request)
                })
                .then((response) => {
                    if (response.ok)
                        resolve();
                    else
                        throw new Error(chrome.i18n.getMessage('apiError', response.status.toString() + ': ' + response.statusText));
                });
            }).catch((error) => reject(error));
        });
    }

    addTorrentUrl(url, options = {}) {
        const {hostname} = this.settings;

        return new Promise((resolve, reject) => {
            let request = {
                urls: [
                    url,
                ],
                destination: options.path || '',
                tags: options.label ? [options.label] : [],
                start: !(options.paused || false)
            };

            fetch(hostname + 'api/torrents/add-urls', {
                method: 'POST',
                headers: new Headers({
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify(request)
            })
            .then((response) => {
                if (response.ok)
                    resolve();
                else
                    throw new Error(chrome.i18n.getMessage('apiError', response.status.toString() + ': ' + response.statusText));
            })
            .catch((error) => reject(error));
        });
    }

    _attachListeners() {
        let sessionCookie = this.cookie;

        this.addHeadersReceivedEventListener((details) => {
            const cookie = this.getCookie(details.responseHeaders, 'jwt');

            if (cookie)
                sessionCookie = cookie;

            return {
                responseHeaders: this.filterHeaders(details.responseHeaders, [
                    'set-cookie',
                ])
            };
        });

        this.addBeforeSendHeadersEventListener((details) => {
            let requestHeaders = this.filterHeaders(details.requestHeaders, [
                'cookie',
            ]);

            if (sessionCookie) {
                requestHeaders.push({
                    name: 'Cookie',
                    value: sessionCookie
                });
            }

            return {
                requestHeaders: requestHeaders
            };
        });
    }

}
