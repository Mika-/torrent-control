import BaseClient from './baseclient';

export default class ruTorrentApi extends BaseClient {

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

    addTorrent(torrent, options = {}) {
        const {hostname} = this.settings;

        return new Promise((resolve, reject) => {
            let form = new FormData();
            form.append('torrent_file', torrent, 'temp.torrent');

            if (options.paused)
                form.append('torrents_start_stopped', options.paused.toString());

            if (options.path)
                form.append('dir_edit', options.path);

            if (options.label)
                form.append('label', options.label);

            if (options.fast_resume)
                form.append('fast_resume', '1');

            fetch(hostname + 'php/addtorrent.php?json=1', {
                method: 'POST',
                credentials: 'include',
                body: form
            })
            .then(this.parseJsonResponse)
            .then((json) => {
                if (json.result && json.result === 'Success')
                    resolve();
                else
                    throw new Error(chrome.i18n.getMessage('torrentAddError', json.result || ''));
            })
            .catch((error) => reject(error));
        });
    }

    addTorrentUrl(url, options = {}) {
        const {hostname} = this.settings;

        let params = new URLSearchParams();
        params.append('json', '1');
        params.append('url', url);

        if (options.paused)
            params.append('torrents_start_stopped', options.paused.toString());

        if (options.path)
            params.append('dir_edit', options.path);

        if (options.label)
            params.append('label', options.label);

        if (options.fast_resume)
            params.append('fast_resume', '1');

        return new Promise((resolve, reject) => {
            fetch(hostname + 'php/addtorrent.php?' + params.toString(), {
                method: 'GET',
                credentials: 'include'
            })
            .then(this.parseJsonResponse)
            .then((json) => {
                if (json.result && json.result === 'Success')
                    resolve();
                else
                    throw new Error(chrome.i18n.getMessage('torrentAddError', json.result || ''));
            })
            .catch((error) => reject(error));
        });
    }

    addRssFeed(url) {
        const {hostname} = this.settings;

        return new Promise((resolve, reject) => {
            let form = new FormData();
            form.append('mode', 'add');
            form.append('url', url);
            form.append('label', '');

            fetch(hostname + 'plugins/rss/action.php', {
                method: 'POST',
                credentials: 'include',
                body: form
            })
            .then(this.parseJsonResponse)
            .then((json) => {
                if (json.errors.length === 0)
                    resolve();
                else
                    throw new Error(chrome.i18n.getMessage('rssFeedAddError', json.result || ''));
            })
            .catch((error) => reject(error));
        });
    }
}
