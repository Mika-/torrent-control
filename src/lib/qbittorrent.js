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
                    reject(new Error(browser.i18n.getMessage('loginError')));
            })
            .catch((error) => reject(error));
        });
    }

    logOut() {
        const {hostname} = this.options;

        return new Promise((resolve, reject) => {
            fetch(hostname + 'logout', {
                method: 'POST',
                body: new FormData()
            })
            .then((response) => {
                if (response.ok) {
                    this.cookie = null;
                    this.removeEventListeners();
                    resolve();
                }
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
                    reject(new Error(browser.i18n.getMessage('torrentAddError')));
            })
            .catch((error) => reject(error));
        });
    }

    addTorrentUrl(url) {
        const {hostname} = this.options

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
                    reject(new Error(browser.i18n.getMessage('torrentAddError')));
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
                sessionCookie = cookie.value;
        });

        this.addBeforeSendHeadersEventListener((details) => {
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
        });
    }

}
