class qBittorrentApi {

    constructor(serverOptions) {
        this.options = serverOptions;
        this.cookie = null;

        this._attachListeners();
    }

    logIn() {
        const {hostname, username, password} = this.options;

        return new Promise((resolve, reject) => {
            let form = new FormData();
            form.append('username', username);
            form.append('password', password);

            fetch(hostname + 'login', {
                method: 'POST',
                body: form
            })
            .then((response) => {
                if (response.ok)
                    resolve();
                else
                    reject('Failed to login (' + response.status + ' ' + response.statusText + ')');
            })
            .catch((error) => reject(error));
        });
    }

    logOut() {
        this.cookie = null;
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
                    reject('Failed to add torrent (' + response.status + ' ' + response.statusText + ')');
            })
            .catch((error) => reject(error));
        });
    }

    _attachListeners() {
        const {hostname} = this.options;
        let sessionCookie = this.cookie;

        browser.webRequest.onHeadersReceived.addListener((details) => {
                const cookie = details.responseHeaders.find((header) => header.name.toLowerCase() === 'set-cookie');

                if (cookie)
                    sessionCookie = cookie.value;
            },
            {urls: [hostname.replace(/\:\d+/, '') + '*']},
            ['responseHeaders']
        );

        browser.webRequest.onBeforeSendHeaders.addListener((details) => {
                let requestHeaders = details.requestHeaders;

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
            },
            {urls: [hostname.replace(/\:\d+/, '') + '*']},
            ['blocking', 'requestHeaders']
        );
    }

}
