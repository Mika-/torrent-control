class CloudTorrentApi extends BaseClient {

    constructor(serverOptions) {
        super();

        this.options = serverOptions;
    }

    logIn() {
        const {username, password} = this.options;

        if (username && password) {
            this.addBeforeSendHeadersEventListener((details) => {
                let requestHeaders = details.requestHeaders;

                requestHeaders = requestHeaders.filter((header) => {
                    return ![
                        'authorization',
                    ].includes(header.name.toLowerCase());
                });

                requestHeaders.push({
                    name: 'Authorization',
                    value: 'Basic ' + btoa(username + ':' + password)
                });

                return {
                    requestHeaders: requestHeaders
                };
            });
        }

        return Promise.resolve();
    }

    logOut() {
        this.removeEventListeners();

        return Promise.resolve();
    }

    addTorrent(torrent) {
        const {hostname} = this.options

        return new Promise((resolve, reject) => {
            fetch(hostname + 'api/torrentfile', {
                method: 'POST',
                headers: new Headers({
                    'Content-Type': 'application/x-bittorrent'
                }),
                body: torrent
            })
            .then((response) => {
                if (response.ok)
                    resolve();
                else
                    reject(new Error(browser.i18n.getMessage('torrentAddError')));
            })
            .catch((error) => reject(error));
        });
    }

    addTorrentUrl(url) {
        const {hostname} = this.options

        return new Promise((resolve, reject) => {
            fetch(hostname + 'api/magnet', {
                method: 'POST',
                headers: new Headers({
                    'Content-Type': 'text/plain'
                }),
                body: url
            })
            .then((response) => {
                if (response.ok)
                    resolve();
                else
                    reject(new Error(browser.i18n.getMessage('torrentAddError')));
            })
            .catch((error) => reject(error));
        });
    }

}
