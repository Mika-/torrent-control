class ruTorrentApi extends BaseClient {

    constructor(serverOptions) {
        super();

        this.options = serverOptions;
    }

    logIn() {
        const {username, password} = this.options;

        if (username && password)
            this.addAuthRequiredListener();

        return Promise.resolve();
    }

    logOut() {
        this.removeEventListeners();

        return Promise.resolve();
    }

    addTorrent(torrent) {
        const {hostname} = this.options;

        return new Promise((resolve, reject) => {
            let form = new FormData();
            form.append('torrent_file', torrent, 'temp.torrent');

            fetch(hostname + 'php/addtorrent.php?json=1', {
                method: 'POST',
                credentials: 'include',
                body: form
            })
            .then((response) => {
                if (response.ok)
                    return response.json();
                else if (response.status === 400)
                    throw new Error(browser.i18n.getMessage('torrentAddError'));
                else if (response.status === 401)
                    throw new Error(browser.i18n.getMessage('loginError'));
                else
                    throw new Error(browser.i18n.getMessage('apiError', response.status.toString() + ': ' + response.statusText));
            })
            .then((json) => {
                if (json.result === 'Success')
                    resolve();
                else
                    throw new Error(browser.i18n.getMessage('torrentAddError'));
            })
            .catch((error) => reject(error));
        });
    }

    addTorrentUrl(url) {
        const {hostname} = this.options;

        return new Promise((resolve, reject) => {
            fetch(hostname + 'php/addtorrent.php?url=' + encodeURIComponent(url) + '&json=1', {
                method: 'GET',
                credentials: 'include'
            })
            .then((response) => {
                if (response.ok)
                    return response.json();
                else if (response.status === 400)
                    throw new Error(browser.i18n.getMessage('torrentAddError'));
                else if (response.status === 401)
                    throw new Error(browser.i18n.getMessage('loginError'));
                else
                    throw new Error(browser.i18n.getMessage('apiError', response.status.toString() + ': ' + response.statusText));
            })
            .then((json) => {
                if (json.result === 'Success')
                    resolve();
                else
                    throw new Error(browser.i18n.getMessage('torrentAddError'));
            })
            .catch((error) => reject(error));
        });
    }

}
