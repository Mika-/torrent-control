import BaseClient from './baseclient'

export default class floodApi extends BaseClient {
    cookie?: string;

    constructor(serverSettings) {
        super();

        this.settings = serverSettings;
        this.cookie = null;
    }

    logIn(): Promise<void> {
        const {hostname, username, password} = this.settings;

        this._attachListeners();

        return new Promise((resolve, reject) => {
            let form = new URLSearchParams();
            form.set('username', username);
            form.set('password', password);

            fetch(hostname + 'auth/authenticate', {
                method: 'POST',
                body: form
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
                    throw new Error(chrome.i18n.getMessage('apiError'));
            })
            .catch((error) => reject(error));
        });
    }

    logOut() {
        this.removeEventListeners();

        return Promise.resolve();
    }

    addTorrent(torrent, options): Promise<void> {
        const {hostname} = this.settings;

        return new Promise((resolve, reject) => {
            let form = new FormData();
            form.append('torrents', torrent, 'temp.torrent');
            form.append('start', (!options.paused).toString());
            form.append('destination', options.path || '');
            form.append('isBasePath', 'false');
            form.append('tags', options.label || '');

            fetch(hostname + 'api/client/add-files', {
                method: 'POST',
                body: form
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

    addTorrentUrl(url, options): Promise<void> {
        const {hostname} = this.settings;

        return new Promise((resolve, reject) => {
            let request = {
                start: !options.paused,
                destination: options.path,
                isBasePath: false,
                urls: [
                    url,
                ],
                tags: options.label ? [options.label] : []
            };

            fetch(hostname + 'api/client/add', {
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
