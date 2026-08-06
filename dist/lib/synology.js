import BaseClient from './baseclient.js';

export default class SynologyApi extends BaseClient {
    constructor(serverSettings) {
        super();

        this.settings = serverSettings;
    }

    addTorrent(torrent, options = {}) {
        const {hostname, username, password} = this.settings;

        return new Promise((resolve, reject) => {
            let form = new FormData();
            form.append('api', 'SYNO.DownloadStation.Task');
            form.append('version', '1');
            form.append('method', 'create');
            form.append('file', torrent);
            form.append('username', username);
            form.append('password', password);

            if (options.path) {
                form.append('destination', options.path);
            }

            fetch(`${hostname}webapi/DownloadStation/task.cgi`, {
                method: 'POST',
                body: form,
            })
            .then((response) => {
                if (response.ok) {
                    resolve();
                } else {
                    throw new Error(chrome.i18n.getMessage('apiError', response.status.toString() + ': ' + response.statusText));
                }
            })
            .catch((error) => reject(error));
        });
    }

    addTorrentUrl(url, options = {}) {
        const {hostname, username, password} = this.settings;

        return new Promise((resolve, reject) => {
            let form = new FormData();
            form.append('api', 'SYNO.DownloadStation.Task');
            form.append('version', '1');
            form.append('method', 'create');
            form.append('uri', url);
            form.append('username', username);
            form.append('password', password);

            if (options.path) {
                form.append('destination', options.path);
            }

            fetch(`${hostname}webapi/DownloadStation/task.cgi`, {
                method: 'POST',
                body: form,
            })
            .then((response) => {
                if (response.ok) {
                    resolve();
                } else {
                    throw new Error(chrome.i18n.getMessage('apiError', response.status.toString() + ': ' + response.statusText));
                }
            })
            .catch((error) => reject(error));
        });
    }
}
