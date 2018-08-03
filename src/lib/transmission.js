class TransmissionApi extends BaseClient {

    constructor(serverSettings) {
        super();

        this.settings = serverSettings;
        this.session = null;
    }

    logIn() {
        const {hostname} = this.settings;

        this._attachListeners();

        return new Promise((resolve, reject) => {
            fetch(hostname + 'transmission/rpc', {
                method: 'POST',
                credentials: 'include',
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
        this.removeEventListeners();
        this.session = null;

        return Promise.resolve();
    }

    addTorrent(torrent) {
        const {hostname} = this.settings;

        return new Promise((resolve, reject) => {
            base64Encode(torrent).then((base64torrent) =>
                fetch(hostname + 'transmission/rpc', {
                    method: 'POST',
                    credentials: 'include',
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
        const {hostname} = this.settings;

        return new Promise((resolve, reject) => {
            fetch(hostname + 'transmission/rpc', {
                method: 'POST',
                credentials: 'include',
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
        const {username, password} = this.settings;
        let session = this.session;

        if (username && password)
            this.addAuthRequiredListener();

        this.addHeadersReceivedEventListener((details) => {
            const sessionHeader = details.responseHeaders.find((header) => header.name.toLowerCase() === 'x-transmission-session-id');

            if (sessionHeader)
                session = sessionHeader.value;
        });

        this.addBeforeSendHeadersEventListener((details) => {
            let requestHeaders = details.requestHeaders;

            if (session) {
                requestHeaders.push({
                    name: 'X-Transmission-Session-Id',
                    value: session
                });
            }

            return {
                requestHeaders: requestHeaders
            };
        });
    }

}
