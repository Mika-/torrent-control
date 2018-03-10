class DelugeApi extends BaseClient {

    constructor(serverOptions) {
        super();

        this.options = serverOptions;
        this.cookie = null;
    }

    logIn() {
        const {hostname, password} = this.options;

        this._attachListeners();

        return new Promise((resolve, reject) => {
            fetch(hostname + 'json', {
                method: 'POST',
                headers: new Headers({
                    'Content-Type': 'application/json',
                    'X-Internal': true
                }),
                body: JSON.stringify({
                    method: 'auth.login',
                    params: [
                        password
                    ],
                    id: 1
                })
            })
            .then((response) => {
                if (response.ok)
                    return response.json();
                else
                    throw new Error(browser.i18n.getMessage('apiError', response.status.toString() + ': ' + response.statusText));
            })
            .then((json) => {
                if (json.error === null && json.result === true)
                    resolve();
                else
                    throw new Error(browser.i18n.getMessage('loginError'));
            })
            .catch((error) => reject(error));
        });
    }

    logOut() {
        const {hostname} = this.options;

        return new Promise((resolve, reject) => {
            fetch(hostname + 'json', {
                method: 'POST',
                headers: new Headers({
                    'Content-Type': 'application/json',
                    'X-Internal': true
                }),
                body: JSON.stringify({
                    method: 'auth.delete_session',
                    params: [],
                    id: 3
                })
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
        const {hostname} = this.options;

        return new Promise((resolve, reject) => {
            base64Encode(torrent).then((base64torrent) =>
                fetch(hostname + 'json', {
                    method: 'POST',
                    headers: new Headers({
                        'Content-Type': 'application/json',
                        'X-Internal': true
                    }),
                    body: JSON.stringify({
                        method: 'core.add_torrent_file',
                        params: [
                            'temp.torrent',
                            base64torrent,
                            {}
                        ],
                        id: 2
                    })
                })
                .then((response) => {
                    if (response.ok)
                        return response.json();
                    else
                        throw new Error(browser.i18n.getMessage('apiError', response.status.toString() + ': ' + response.statusText));
                })
                .then((json) => {
                    if (json.error === null)
                        resolve();
                    else
                        throw new Error(browser.i18n.getMessage('torrentAddError'));
                })
            ).catch((error) => reject(error));
        });
    }

    addTorrentUrl(url) {
        const {hostname} = this.options;

        return new Promise((resolve, reject) => {
            fetch(hostname + 'json', {
                method: 'POST',
                headers: new Headers({
                    'Content-Type': 'application/json',
                    'X-Internal': true
                }),
                body: JSON.stringify({
                    method: 'core.add_torrent_magnet',
                    params: [
                        url,
                        {}
                    ],
                    id: 2
                })
            })
            .then((response) => {
                if (response.ok)
                    return response.json();
                else
                    throw new Error(browser.i18n.getMessage('apiError', response.status.toString() + ': ' + response.statusText));
            })
            .then((json) => {
                if (json.error === null)
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
                sessionCookie = cookie.value.match(/_session_id=(.+?);/)[0];
        });

        this.addBeforeSendHeadersEventListener((details) => {
            let requestHeaders = details.requestHeaders;
            const isInternal = !!requestHeaders.find((header) => header.name.toLowerCase() === 'x-internal');

            if (isInternal) {
                requestHeaders = requestHeaders.filter((header) => {
                    return ![
                        'cookie',
                        'x-internal',
                    ].includes(header.name.toLowerCase());
                });

                if (sessionCookie) {
                    requestHeaders.push({
                        name: 'Cookie',
                        value: sessionCookie
                    });
                }
            }

            return {
                requestHeaders: requestHeaders
            };
        });
    }

}
