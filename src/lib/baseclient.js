import {getHostFilter} from '../util.js';

export default class BaseClient {

    constructor() {
        this.listeners = {};
        this.pendingRequests = {};
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
        const { hostname } = this.settings;

        this.listeners.onHeadersReceived = listener;

        chrome.webRequest.onHeadersReceived.addListener(
            this.listeners.onHeadersReceived,
            { urls: [getHostFilter(hostname)] },
            ['blocking', 'responseHeaders']
        );
    }

    addBeforeSendHeadersEventListener(listener) {
        const { hostname } = this.settings;

        this.listeners.onBeforeSendHeaders = listener;

        chrome.webRequest.onBeforeSendHeaders.addListener(
            this.listeners.onBeforeSendHeaders,
            { urls: [getHostFilter(hostname)] },
            ['blocking', 'requestHeaders']
        );
    }

    addAuthRequiredListener(username, password) {
        const { hostname } = this.settings;

        // Some clients (eg. ruTorrent v4) redirect to a different URL after a
        // POST that requires authentication. Browsers re-use the same requestId
        // across redirects, so we must allow more than one credential prompt
        // per requestId — but cap the number of attempts to avoid an infinite
        // retry loop when the credentials are actually wrong.
        const maxAuthAttempts = 2;

        this.listeners.onAuthRequired = (details) => {
            const attempts = (this.pendingRequests[details.requestId] || 0) + 1;

            if (attempts > maxAuthAttempts)
                return;

            this.pendingRequests[details.requestId] = attempts;

            return {
                authCredentials: {
                    username: username,
                    password: password
                }
            };
        };

        this.listeners.onAuthCompleted = (details) => {
            delete this.pendingRequests[details.requestId];
        };

        chrome.webRequest.onAuthRequired.addListener(
            this.listeners.onAuthRequired,
            { urls: [getHostFilter(hostname)] },
            ['blocking']
        );

        chrome.webRequest.onCompleted.addListener(
            this.listeners.onAuthCompleted,
            { urls: [getHostFilter(hostname)] },
        );

        chrome.webRequest.onErrorOccurred.addListener(
            this.listeners.onAuthCompleted,
            { urls: [getHostFilter(hostname)] },
        );
    }

    removeEventListeners() {
        if (this.listeners.onHeadersReceived)
            chrome.webRequest.onHeadersReceived.removeListener(this.listeners.onHeadersReceived);

        if (this.listeners.onBeforeSendHeaders)
            chrome.webRequest.onBeforeSendHeaders.removeListener(this.listeners.onBeforeSendHeaders);

        if (this.listeners.onAuthRequired) {
            chrome.webRequest.onAuthRequired.removeListener(this.listeners.onAuthRequired);
            chrome.webRequest.onCompleted.removeListener(this.listeners.onAuthCompleted);
            chrome.webRequest.onErrorOccurred.removeListener(this.listeners.onAuthCompleted);
        }
    }

    parseJsonResponse(response) {
        const contentType = response.headers.get('content-type');
        const isJson = !!contentType.match(/application\/json/)

        if (response.ok && isJson)
            return response.json();
        else if (response.ok && !isJson)
            return response.text().then((text) => {
                throw new Error(chrome.i18n.getMessage('apiError', text.trim().slice(0, 256)));
            });
        else if (response.status === 400)
            throw new Error(chrome.i18n.getMessage('torrentAddError'));
        else if (response.status === 401)
            throw new Error(chrome.i18n.getMessage('loginError'));
        else
            throw new Error(chrome.i18n.getMessage('apiError', response.status.toString() + ': ' + response.statusText));
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

        if (cookie) {
            const regex = new RegExp(`(${key}=[^;]+)`);

            return cookie.value.match(regex)?.[1] || null;
        }

        return null;
    }
}
