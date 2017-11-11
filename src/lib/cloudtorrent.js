class CloudTorrentApi extends BaseClient {

    constructor(serverOptions) {
        super();

        this.options = serverOptions;

        if (this.options.username && this.options.password)
            this._attachListeners();
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

    _attachListeners() {
        const {username, password, hostname} = this.options;

        browser.webRequest.onBeforeSendHeaders.addListener((details) => {
                let requestHeaders = details.requestHeaders;

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
