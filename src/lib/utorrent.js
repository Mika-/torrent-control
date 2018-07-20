class uTorrentApi extends BaseClient {

    constructor(serverOptions) {
        super();

        this.options = serverOptions;
        this.cookie = null;
        this.token = null;
    }

    logIn() {
        const {hostname} = this.options;

        this._attachListeners();

        return new Promise((resolve, reject) => {
            fetch(hostname + 'token.html', {
                method: 'GET',
                credentials: 'include'
            })
            .then((response) => {
                if (response.ok)
                    return response.text()
                else if (response.status === 401)
                    throw new Error(browser.i18n.getMessage('loginError'));
                else
                    throw new Error(browser.i18n.getMessage('apiError', response.status.toString() + ': ' + response.statusText));
            })
            .then((html) => {
                const token = html.match(/<div.+?>(.+?)<\/div>/);

                if (token && token[1]) {
                    this.token = token[1];
                    resolve();
                }
                else {
                    throw new Error(browser.i18n.getMessage('apiError', html));
                }
            })
            .catch((error) => reject(error));
        });
    }

    logOut() {
        this.removeEventListeners();

        this.cookie = null;
        this.token = null;

        return Promise.resolve();
    }

    addTorrent(torrent) {
        const {hostname} = this.options;
        const token = this.token;

        return new Promise((resolve, reject) => {
            let form = new FormData();
            form.append('torrent_file', torrent, 'temp.torrent');

            fetch(hostname + '?token=' + token + '&action=add-file', {
                method: 'POST',
                credentials: 'include',
                body: form
            })
            .then((response) => response.json())
            .then((json) => {
                if (!json.error)
                    resolve();
                else
                    throw new Error(browser.i18n.getMessage('torrentAddError'));
            }).catch((error) => reject(error));
        });
    }

    addTorrentUrl(url) {
        const {hostname} = this.options;
        const token = this.token;

        return new Promise((resolve, reject) => {
            fetch(hostname + '?token=' + token + '&action=add-url&s=' + encodeURIComponent(url), {
                method: 'GET',
                credentials: 'include'
            })
            .then((response) => response.json())
            .then((json) => {
                if (!json.error)
                    resolve();
                else
                    throw new Error(browser.i18n.getMessage('torrentAddError'));
            })
            .catch((error) => reject(error));
        });
    }

    _attachListeners() {
        const {hostname, username, password} = this.options;
        let sessionCookie = this.cookie;

        if (username && password)
            this.addAuthRequiredListener();

        this.addHeadersReceivedEventListener((details) => {
            const cookie = this.getCookie(details.responseHeaders, 'GUID');

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
