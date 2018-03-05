class qBittorrentApi extends BaseClient {

    constructor(serverOptions) {
        super();

        this.options = serverOptions;
        this.cookie = null;
    }

    logIn() {
        const {hostname, username, password} = this.options;

        this._attachListeners();

        return new Promise((resolve, reject) => {
            let form = new URLSearchParams();
            form.set('username', username);
            form.set('password', password);

            fetch(hostname + 'login', {
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

        return new Promise((resolve, reject) => {
            fetch(hostname + 'logout', {
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

        return new Promise((resolve, reject) => {
            let form = new FormData();
            form.append('torrents', torrent, 'temp.torrent');

            fetch(hostname + 'command/upload', {
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

        return new Promise((resolve, reject) => {
            let form = new FormData();
            form.append('urls', url);

            fetch(hostname + 'command/download', {
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
            const cookie = details.responseHeaders.find((header) => header.name.toLowerCase() === 'set-cookie');

            if (cookie)
                sessionCookie = cookie.value.match(/SID=(.+?);/)[0];
        });

        this.addBeforeSendHeadersEventListener((details) => {
            let requestHeaders = details.requestHeaders;

            requestHeaders = requestHeaders.filter((header) => {
                return ![
                    'cookie',
                    'origin',
                    'referer',
                ].includes(header.name.toLowerCase());
            });

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
