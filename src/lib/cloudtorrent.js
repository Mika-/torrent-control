class CloudTorrentApi extends BaseClient {

    constructor(serverSettings) {
        super();

        this.settings = serverSettings;
    }

    logIn() {
        const {username, password} = this.settings;

        if (username && password)
            this.addAuthRequiredListener(username, password);

        return Promise.resolve();
    }

    logOut() {
        this.removeEventListeners();

        return Promise.resolve();
    }

    addTorrent(torrent) {
        const {hostname} = this.settings;

        return new Promise((resolve, reject) => {
            fetch(hostname + 'api/torrentfile', {
                method: 'POST',
                credentials: 'include',
                headers: new Headers({
                    'Content-Type': 'application/x-bittorrent'
                }),
                body: torrent
            })
            .then((response) => {
                if (response.ok)
                    return response.text();
                else if (response.status === 400)
                    throw new Error(chrome.i18n.getMessage('torrentAddError'));
                else if (response.status === 401)
                    throw new Error(chrome.i18n.getMessage('loginError'));
                else
                    throw new Error(chrome.i18n.getMessage('apiError', response.status.toString() + ': ' + response.statusText));
            })
            .then((text) => {
                if (text === 'OK')
                    resolve();
                else
                    throw new Error(chrome.i18n.getMessage('apiError', text));
            })
            .catch((error) => reject(error));
        });
    }

    addTorrentUrl(url) {
        const {hostname} = this.settings;

        return new Promise((resolve, reject) => {
            fetch(hostname + 'api/magnet', {
                method: 'POST',
                credentials: 'include',
                headers: new Headers({
                    'Content-Type': 'text/plain'
                }),
                body: url
            })
            .then((response) => {
                if (response.ok)
                    return response.text();
                else if (response.status === 400)
                    throw new Error(chrome.i18n.getMessage('torrentAddError'));
                else if (response.status === 401)
                    throw new Error(chrome.i18n.getMessage('loginError'));
                else
                    throw new Error(chrome.i18n.getMessage('apiError', response.status.toString() + ': ' + response.statusText));
            })
            .then((text) => {
                if (text === 'OK')
                    resolve();
                else
                    throw new Error(chrome.i18n.getMessage('apiError', text));
            })
            .catch((error) => reject(error));
        });
    }

}
