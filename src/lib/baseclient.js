class BaseClient {

    constructor() {
        this.listeners = {};
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
        const {hostname} = this.options;

        this.listeners.onHeadersReceived = listener;

        browser.webRequest.onHeadersReceived.addListener(
            this.listeners.onHeadersReceived,
            {urls: [hostname.replace(/\:\d+/, '') + '*']},
            ['responseHeaders']
        );
    }

    addBeforeSendHeadersEventListener(listener) {
        const {hostname} = this.options;

        this.listeners.onBeforeSendHeaders = listener;

        browser.webRequest.onBeforeSendHeaders.addListener(
            this.listeners.onBeforeSendHeaders,
            {urls: [hostname.replace(/\:\d+/, '') + '*']},
            ['blocking', 'requestHeaders']
        );
    }

    removeEventListeners() {
        if (this.listeners.onHeadersReceived)
            browser.webRequest.onHeadersReceived.removeListener(this.listeners.onHeadersReceived);

        if (this.listeners.onBeforeSendHeaders)
            browser.webRequest.onBeforeSendHeaders.removeListener(this.listeners.onBeforeSendHeaders);
    }

}
