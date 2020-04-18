import BaseClient from './baseclient'

export default class TixatiApi extends BaseClient {
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

    addTorrent(torrent, options): Promise<void> {
        const {hostname} = this.settings;

        return new Promise((resolve, reject) => {
            let form = new FormData();
            form.append('metafile', torrent, 'temp.torrent');
            form.append('addmetafile', 'Add');
            form.append('noautostart', options.paused ? '1' : '0');

            fetch(hostname + 'transfers/action', {
                method: 'POST',
                credentials: 'include',
                body: form
            })
            .then((response) => {
                if (response.ok)
                    return resolve();
                else if (response.status === 400)
                    throw new Error(chrome.i18n.getMessage('torrentAddError'));
                else if (response.status === 401)
                    throw new Error(chrome.i18n.getMessage('loginError'));
                else
                    throw new Error(chrome.i18n.getMessage('apiError', response.status.toString() + ': ' + response.statusText));
            })
            .catch((error) => reject(error));
        });
    }

    addTorrentUrl(url, options): Promise<void> {
        const {hostname} = this.settings;

        return new Promise((resolve, reject) => {
            let form = new FormData();
            form.append('addlinktext', url);
            form.append('addlink', 'Add');
            form.append('noautostart', options.paused ? '1' : '0');

            fetch(hostname + 'transfers/action', {
                method: 'POST',
                credentials: 'include',
                body: form
            })
            .then((response) => {
                if (response.ok)
                    return resolve();
                else if (response.status === 400)
                    throw new Error(chrome.i18n.getMessage('torrentAddError'));
                else if (response.status === 401)
                    throw new Error(chrome.i18n.getMessage('loginError'));
                else
                    throw new Error(chrome.i18n.getMessage('apiError', response.status.toString() + ': ' + response.statusText));
            })
            .catch((error) => reject(error));
        });
    }

}
