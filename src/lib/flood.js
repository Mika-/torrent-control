class floodApi extends BaseClient {

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

            fetch(hostname + 'auth/authenticate', {
                method: 'POST',
                body: form
            })
            .then((response) => {
                if (response.ok)
                    return response.json();
                else
                    throw new Error(browser.i18n.getMessage('apiError', response.status.toString() + ': ' + response.statusText));
            })
            .then((json) => {
                if (json.success === true) {
                    resolve();
                }
                else if (json.success === false)
                    throw new Error(browser.i18n.getMessage('loginError'));
                else
                    throw new Error(browser.i18n.getMessage('apiError', text));
            })
            .catch((error) => reject(error));
        });
    }

    logOut() {
        this.removeEventListeners();

        return Promise.resolve();
    }

    addTorrent(torrent) {
        const {hostname} = this.options;

        return new Promise((resolve, reject) => {
            let form = new FormData();
            form.append('torrents', torrent, 'temp.torrent');
            form.append('start', 'true');
            form.append('tags', '');

            fetch(hostname + 'api/client/add-files', {
                method: 'POST',
                body: form
            })
            .then((response) => {
                if (response.ok)
                    resolve();
                else
                    throw new Error(browser.i18n.getMessage('apiError', response.status.toString() + ': ' + response.statusText));
            })
            .catch((error) => reject(error));
        });
    }

    addTorrentUrl(url) {
        const {hostname} = this.options;

        return new Promise((resolve, reject) => {
            fetch(hostname + 'api/client/add', {
                method: 'POST',
                headers: new Headers({
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({
                    start: true,
                    urls: [
                        url,
                    ]
                })
            })
            .then((response) => {
                if (response.ok)
                    resolve();
                else
                    throw new Error(browser.i18n.getMessage('apiError', response.status.toString() + ': ' + response.statusText));
            })
            .catch((error) => reject(error));
        });
    }

    _attachListeners() {
        let sessionCookie = this.cookie;

        this.addHeadersReceivedEventListener((details) => {
            const cookie = details.responseHeaders.find((header) => header.name.toLowerCase() === 'set-cookie');

            if (cookie)
                sessionCookie = cookie.value.match(/jwt=(.+?);/)[0];
        });

        this.addBeforeSendHeadersEventListener((details) => {
            let requestHeaders = details.requestHeaders;

            requestHeaders = requestHeaders.filter((header) => {
                return ![
                    'cookie',
                ].includes(header.name.toLowerCase());
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
