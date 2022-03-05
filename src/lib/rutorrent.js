import BaseClient from './baseclient.js';

export default class ruTorrentApi extends BaseClient {

    constructor(serverSettings) {
        super();

        this.settings = serverSettings;
    }

    logIn() {
        const {username, password, hostname, clientOptions} = this.settings;

        // No authentication provided
        if (!(username && password))
            return Promise.resolve();

        // HTTP Basic Auth
        if (!clientOptions.authType || clientOptions.authType === 'httpAuth') {
            this.addAuthRequiredListener(username, password);

            return Promise.resolve();
        }

        // Form Auth
        return new Promise((resolve, reject) => {
            fetch(hostname, {
                method: 'GET',
                credentials: 'include',
            })
            .then((response) => {
                response.text().then((html) => {
                    const page = (new DOMParser()).parseFromString(html, 'text/html');

                    // Use HTML autocomplete attributes to complete many different login forms
                    // regardless of what they look like
                    const usernameInput = page.querySelector('[autocomplete="username"]');
                    const passwordInput = page.querySelector('[autocomplete="current-password"]');

                    // Failed to detect Form Auth
                    // a. This endpoint does not use Form Auth
                    // b. Form Auth used but already logged in
                    // In both cases, do nothing
                    if (usernameInput === null || passwordInput === null) {
                        resolve();
                        return;
                    }

                    // Populate the username and password fields
                    usernameInput.value = username;
                    passwordInput.value = password;

                    // DOMParser scopes relative to the extension
                    // Inject a base tag saying the scope should be relative to the
                    // login page we fetched
                    const base = page.createElement('base');
                    base.href = response.url;
                    page.head.appendChild(base);

                    // Submit the login form
                    let loginForm = new FormData(passwordInput.form);
                    fetch(passwordInput.form.action, {
                        method: passwordInput.form.method.toUpperCase(),
                        credentials: 'include',
                        body: loginForm,
                    })
                    .then((response) => {
                        // Indicate failure from a bad response code
                        if (response.status >= 400)
                            throw new Error(chrome.i18n.getMessage('loginError'));

                        response.text().then((html) => {
                            const after_login = (new DOMParser()).parseFromString(html, 'text/html');
                            if (after_login.querySelector('[autocomplete="current-password"]')) {
                                // If the next page after logging in is still asking for the password
                                // It's quite likely we failed to login
                                throw new Error(chrome.i18n.getMessage('loginError'));
                            } else{
                                // No more input asking for a password autocomplete
                                // (hopefully) means we logged in successfully
                                resolve();
                            }
                        })
                    })
                    .catch((error) => reject(error));
                })
                .catch((error) => reject(error));
            })
            .catch((error) => reject(error));
        });
    }

    logOut() {
        this.removeEventListeners();

        return Promise.resolve();
    }

    addTorrent(torrent, options = {}) {
        const {hostname} = this.settings;

        return new Promise((resolve, reject) => {
            let form = new FormData();
            form.append('torrent_file[]', torrent, 'temp.torrent');

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
