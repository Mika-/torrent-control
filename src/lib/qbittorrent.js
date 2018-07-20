class qBittorrentApi extends BaseClient {

    constructor(serverOptions) {
        super();

        this.options = {
            apiVersion: 2,
            ...serverOptions
        };
        this.cookie = null;
    }

    logIn() {
        const {hostname, username, password} = this.options;
        const loginPath = this.options.apiVersion === 2 ? 'api/v2/auth/login' : 'login';

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
                    throw new Error(browser.i18n.getMessage('apiError', response.status.toString() + ': ' + response.statusText));
            })
            .then((text) => {
                if (text === 'Ok.')
                    resolve();
                else if (text === 'Fails.')
                    throw new Error(browser.i18n.getMessage('loginError'));
                else
                    throw new Error(browser.i18n.getMessage('apiError', text));
            })
            .catch((error) => reject(error));
        });
    }

    logOut() {
        const {hostname} = this.options;
        const logoutPath = this.options.apiVersion === 2 ? 'api/v2/auth/logout' : 'logout';

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

    addTorrent(torrent) {
        const {hostname} = this.options
        const addTorrentPath = this.options.apiVersion === 2 ? 'api/v2/torrents/add' : 'command/upload';

        return new Promise((resolve, reject) => {
            let form = new FormData();

            if (this.options.apiVersion === 2)
                form.append('fileselect', torrent, 'temp.torrent');
            else
                form.append('torrents', torrent, 'temp.torrent');

            fetch(hostname + addTorrentPath, {
                method: 'POST',
                body: form
            })
            .then((response) => {
                if (response.ok)
                    resolve();
                else
                    throw new Error(browser.i18n.getMessage('torrentAddError'));
            })
            .catch((error) => reject(error));
        });
    }

    addTorrentUrl(url) {
        const {hostname} = this.options;
        const addTorrentUrlPath = this.options.apiVersion === 2 ? 'api/v2/torrents/add' : 'command/download';

        return new Promise((resolve, reject) => {
            let form = new FormData();
            form.append('urls', url);

            fetch(hostname + addTorrentUrlPath, {
                method: 'POST',
                body: form
            })
            .then((response) => {
                if (response.ok)
                    resolve();
                else
                    throw new Error(browser.i18n.getMessage('torrentAddError'));
            })
            .catch((error) => reject(error));
        });
    }

    _attachListeners() {
        const {hostname} = this.options;
        let sessionCookie = this.cookie;

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
