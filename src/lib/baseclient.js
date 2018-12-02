class BaseClient {

    constructor() {
        this.listeners = {};
        this.pendingRequests = [];
    }

    logIn() {
        return Promise.resolve();
    }

    logOut() {
        return Promise.resolve();
    }

    addTorrent(torrent) {
        return Promise.resolve();
    }

    addTorrentUrl(url) {
        return Promise.resolve();
    }

    addHeadersReceivedEventListener(listener) {
        const {hostname} = this.settings;

        this.listeners.onHeadersReceived = listener;

        browser.webRequest.onHeadersReceived.addListener(
            this.listeners.onHeadersReceived,
            {urls: [hostname.replace(/\:\d+/, '') + '*']},
            ['blocking', 'responseHeaders']
        );
    }

    addBeforeSendHeadersEventListener(listener) {
        const {hostname} = this.settings;

        this.listeners.onBeforeSendHeaders = listener;

        browser.webRequest.onBeforeSendHeaders.addListener(
            this.listeners.onBeforeSendHeaders,
            {urls: [hostname.replace(/\:\d+/, '') + '*']},
            ['blocking', 'requestHeaders']
        );
    }

    addAuthRequiredListener(username, password) {
        const {hostname} = this.settings;

        this.listeners.onAuthRequired = (details) => {
            if (this.pendingRequests.indexOf(details.requestId) !== -1)
                return;

            this.pendingRequests.push(details.requestId);

            return {
                authCredentials: {
                    username: username,
                    password: password
                }
            };
        };

        this.listeners.onAuthCompleted = (details) => {
            let index = this.pendingRequests.indexOf(details.requestId);

            if (index > -1)
                this.pendingRequests.splice(index, 1);
        };

        browser.webRequest.onAuthRequired.addListener(
            this.listeners.onAuthRequired,
            {urls: [hostname.replace(/\:\d+/, '') + '*']},
            ['blocking']
        );

        browser.webRequest.onCompleted.addListener(
            this.listeners.onAuthCompleted,
            {urls: [hostname.replace(/\:\d+/, '') + '*']},
        );

        browser.webRequest.onErrorOccurred.addListener(
            this.listeners.onAuthCompleted,
            {urls: [hostname.replace(/\:\d+/, '') + '*']},
        );
    }

    removeEventListeners() {
        if (this.listeners.onHeadersReceived)
            browser.webRequest.onHeadersReceived.removeListener(this.listeners.onHeadersReceived);

        if (this.listeners.onBeforeSendHeaders)
            browser.webRequest.onBeforeSendHeaders.removeListener(this.listeners.onBeforeSendHeaders);

        if (this.listeners.onAuthRequired) {
            browser.webRequest.onAuthRequired.removeListener(this.listeners.onAuthRequired);
            browser.webRequest.onCompleted.removeListener(this.listeners.onAuthCompleted);
            browser.webRequest.onErrorOccurred.removeListener(this.listeners.onAuthCompleted);
        }
    }

    parseJsonResponse(response) {
        const contentType = response.headers.get('content-type');
        const isJson = !!contentType.match(/application\/json/)

        if (response.ok && isJson)
            return response.json();
        else if (response.ok && !isJson)
            return response.text().then((text) => {
                throw new Error(browser.i18n.getMessage('apiError', text.trim().slice(0, 256)));
            });
        else if (response.status === 400)
            throw new Error(browser.i18n.getMessage('torrentAddError'));
        else if (response.status === 401)
            throw new Error(browser.i18n.getMessage('loginError'));
        else
            throw new Error(browser.i18n.getMessage('apiError', response.status.toString() + ': ' + response.statusText));
    }

    filterHeaders(headers, filters) {
        return headers.filter((header) => {
            return !filters.includes(header.name.toLowerCase());
        });
    }

    getCookie(headers, key) {
        const cookie = headers.find((header) => {
            return header.name.toLowerCase() === 'set-cookie';
        });

        const regex = new RegExp(key + '=(.+?);');

        if (cookie)
            return cookie.value.match(regex)[0] || false;

        return false;
    }
}
