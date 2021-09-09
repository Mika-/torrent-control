import BaseClient from './baseclient.js';

export default class qBittorrentApi extends BaseClient {

    constructor(serverSettings) {
        super();

        this.settings = {
            apiVersion: 2,
            ...serverSettings
        };
        this.cookie = null;
    }

    logIn() {
        const {hostname, username, password, apiVersion} = this.settings;
        const loginPath = apiVersion === 2 ? 'api/v2/auth/login' : 'login';

        this._attachListeners();

        return new Promise((resolve, reject) => {
            let form = new URLSearchParams();
            form.set('username', username);
            form.set('password', password);

            fetch(hostname + loginPath, {
                method: 'POST',
                body: form
            })
            .then((response) => {
                if (response.ok)
                    return response.text();
                else
                    throw new Error(chrome.i18n.getMessage('apiError', response.status.toString() + ': ' + response.statusText));
            })
            .then((text) => {
                if (text === 'Ok.')
                    resolve();
                else if (text === 'Fails.')
                    throw new Error(chrome.i18n.getMessage('loginError'));
                else
                    throw new Error(chrome.i18n.getMessage('apiError', text));
            })
            .catch((error) => reject(error));
        });
    }

    logOut() {
        const {hostname, apiVersion} = this.settings;
        const logoutPath = apiVersion === 2 ? 'api/v2/auth/logout' : 'logout';

        return new Promise((resolve, reject) => {
            fetch(hostname + logoutPath, {
                method: 'GET'
            })
            .finally((response) => {
                this.removeEventListeners();
                this.cookie = null;
                resolve();
            })
            .catch((error) => reject(error));
        });
    }

    addTorrent(torrent, options = {}) {
        const {hostname, apiVersion} = this.settings;
        const addTorrentPath = apiVersion === 2 ? 'api/v2/torrents/add' : 'command/upload';

        return new Promise((resolve, reject) => {
            let form = new FormData();

            if (apiVersion === 2) {
                form.append('fileselect', torrent, 'temp.torrent');

                if (options.paused)
                    form.append('paused', options.paused.toString());

                if (options.path)
                    form.append('savepath', options.path);

                if (options.label)
                    form.append('category', options.label);

                if (options.sequentialDownload)
                    form.append('sequentialDownload', 'true');

                if (options.firstLastPiecePrio)
                    form.append('firstLastPiecePrio', 'true');

                if (options.skip_checking)
                    form.append('skip_checking', 'true');
            } else {
                form.append('torrents', torrent, 'temp.torrent');
            }

            fetch(hostname + addTorrentPath, {
                method: 'POST',
                body: form
            })
            .then((response) => {
                if (response.ok)
                    resolve();
                else
                    throw new Error(chrome.i18n.getMessage('torrentAddError'));
            })
            .catch((error) => reject(error));
        });
    }

    addTorrentUrl(url, options = {}) {
        const {hostname, apiVersion} = this.settings;
        const addTorrentUrlPath = apiVersion === 2 ? 'api/v2/torrents/add' : 'command/download';

        return new Promise((resolve, reject) => {
            let form = new FormData();
            form.append('urls', url);

            if (apiVersion === 2) {
                if (options.paused)
                    form.append('paused', options.paused.toString());

                if (options.path)
                    form.append('savepath', options.path);

                if (options.label)
                    form.append('category', options.label);

                if (options.sequentialDownload)
                    form.append('sequentialDownload', 'true');

                if (options.firstLastPiecePrio)
                    form.append('firstLastPiecePrio', 'true');

                if (options.skip_checking)
                    form.append('skip_checking', 'true');
            }

            fetch(hostname + addTorrentUrlPath, {
                method: 'POST',
                body: form
            })
            .then((response) => {
                if (response.ok)
                    resolve();
                else
                    throw new Error(chrome.i18n.getMessage('torrentAddError'));
            })
            .catch((error) => reject(error));
        });
    }

    addRssFeed(url) {
        const {hostname} = this.settings;

        return new Promise((resolve, reject) => {
            let form = new FormData();
            form.append('url', url);
            form.append('path', '');

            fetch(hostname + 'api/v2/rss/addFeed', {
                method: 'POST',
                body: form
            })
            .then((response) => {
                if (response.ok)
                    resolve();
                else
                    throw new Error(chrome.i18n.getMessage('rssFeedAddError'));
            })
            .catch((error) => reject(error));
        });
    }

    _attachListeners() {
        const {hostname, httpAuth} = this.settings;
        let sessionCookie = this.cookie;

        if (httpAuth) {
            this.addAuthRequiredListener(httpAuth.username, httpAuth.password);
        }

        this.addHeadersReceivedEventListener((details) => {
            const cookie = this.getCookie(details.responseHeaders, 'SID');

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
                'origin',
                'referer',
            ]);

            requestHeaders.push({
                name: 'Referer',
                value: hostname
            });

            requestHeaders.push({
                name: 'Origin',
                value: hostname
            });

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
