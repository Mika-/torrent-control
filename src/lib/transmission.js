class TransmissionApi extends BaseClient {

    constructor(serverOptions) {
        super();

        this.options = serverOptions;
        this.session = null;
    }

    logIn() {
        const {hostname, username, password} = this.options;

        if (username && password)
            this._attachListeners();

        return new Promise((resolve, reject) => {
            fetch(hostname + 'transmission/rpc', {
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
                    throw new Error(browser.i18n.getMessage('loginError'));
                else if (response.status === 409 && response.headers.has('X-Transmission-Session-Id'))
                    return this.logIn().then(() => resolve());
                else
                    throw new Error(browser.i18n.getMessage('apiError', response.status.toString() + ': ' + response.statusText));
            })
            .then((json) => {
                if (json.result === 'success')
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
            fetch(hostname + 'transmission/rpc', {
                method: 'POST',
                headers: new Headers({
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({
                    method: 'session-close'
                })
            })
            .then((response) => {
                this.session = null;
                resolve();
            })
            .catch((error) => reject(error));
        });
    }

    addTorrent(torrent) {
        const {hostname} = this.options;

        return new Promise((resolve, reject) => {
            base64Encode(torrent).then((base64torrent) =>
                fetch(hostname + 'transmission/rpc', {
                    method: 'POST',
                    headers: new Headers({
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({
                        method: 'torrent-add',
                        arguments: {
                            metainfo: base64torrent
                        }
                    })
                })
                .then((response) => response.json())
                .then((json) => {
                    if (json.result === 'success')
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
            fetch(hostname + 'transmission/rpc', {
                method: 'POST',
                headers: new Headers({
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({
                    method: 'torrent-add',
                    arguments: {
                        filename: url
                    }
                })
            })
            .then((response) => response.json())
            .then((json) => {
                if (json.result === 'success')
                    resolve();
                else
                    throw new Error(browser.i18n.getMessage('torrentAddError'));
            })
            .catch((error) => reject(error));
        });
    }

    _attachListeners() {
        const {username, password, hostname} = this.options;
        let session = this.session;

        browser.webRequest.onHeadersReceived.addListener((details) => {
                const sessionHeader = details.responseHeaders.find((header) => header.name.toLowerCase() === 'x-transmission-session-id');

                if (sessionHeader)
                    session = sessionHeader.value;
            },
            {urls: [hostname.replace(/\:\d+/, '') + '*']},
            ['responseHeaders']
        );

        browser.webRequest.onBeforeSendHeaders.addListener((details) => {
                let requestHeaders = details.requestHeaders;

                if (session) {
                    requestHeaders.push({
                        name: 'X-Transmission-Session-Id',
                        value: session
                    });
                }

                requestHeaders.push({
                    name: 'Authorization',
                    value: 'Basic ' + btoa(username + ':' + password)
                });

                return {
                    requestHeaders: requestHeaders
                };
            },
            {urls: [hostname.replace(/\:\d+/, '') + '*']},
            ['blocking', 'requestHeaders']
        );
    }

}
