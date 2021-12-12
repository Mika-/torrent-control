import {
    clientList,
    whitelist,
    loadOptions,
    saveOptions,
    getClient,
    isTorrentUrl,
    isMagnetUrl,
    getTorrentName,
    getMagnetUrlName,
    getURL,
    regExpFromString,
} from './util.js';

var options;

/**
 * @type {RegExp[]}
 */
let regExpCache = [];

chrome.storage.onChanged.addListener((changes) => {
    Object.keys(changes).forEach((key) => options[key] = changes[key].newValue);

    regExpCache = options.globals.matchRegExp.map((regExpStr) => regExpFromString(regExpStr)).concat(whitelist);

    removeContextMenu();

    if (options.globals.contextMenu && isConfigured())
        createContextMenu();

    if (options.servers.length > 1)
        createServerSelectionContextMenu();

    createDefaultMenu();
});

loadOptions().then((newOptions) => {
    options = newOptions;

    regExpCache = options.globals.matchRegExp.map((regExpStr) => regExpFromString(regExpStr)).concat(whitelist);

    if (options.globals.contextMenu && isConfigured())
        createContextMenu();

    if (options.servers.length > 1)
        createServerSelectionContextMenu();

    createDefaultMenu();
    registerHandler();
});

const isConfigured = () => options.servers[options.globals.currentServer].hostname !== '';

const addTorrent = (url, referer = null, torrentOptions = {}) => {

    torrentOptions = {
        paused: false,
        path: null,
        label: null,
        ...torrentOptions
    };

    const server = torrentOptions.server !== undefined ? torrentOptions.server : options.globals.currentServer;
    const serverSettings = options.servers[server];

    const connection = getClient(serverSettings);
    const networkErrors = [
        'NetworkError when attempting to fetch resource.',
    ];

    if (isMagnetUrl(url)) {
        connection.logIn()
            .then(() => connection.addTorrentUrl(url, torrentOptions)
                .then(() => {
                    const torrentName = getMagnetUrlName(url);
                    notification(chrome.i18n.getMessage('torrentAddedNotification') + (torrentName ? ' ' + torrentName : ''));
                    connection.logOut();
                })
            ).catch((error) => {
                connection.removeEventListeners();

                if (networkErrors.includes(error.message))
                    notification(chrome.i18n.getMessage('torrentAddError', 'Network error'));
                else
                    notification(error.message);
            });
    } else {
        fetchTorrent(url, referer)
            .then(({torrent, torrentName}) => connection.logIn()
                .then(() => connection.addTorrent(torrent, torrentOptions)
                    .then(() => {
                        notification(chrome.i18n.getMessage('torrentAddedNotification') + (torrentName ? ' ' + torrentName : ''));
                        connection.logOut();
                    })
                )
            ).catch((error) => {
                connection.removeEventListeners();

                if (networkErrors.includes(error.message))
                    notification(chrome.i18n.getMessage('torrentAddError', 'Network error'));
                else
                    notification(error.message);
            });
    }
}

const fetchTorrent = (url, referer) => {
    return new Promise((resolve, reject) => {
        createBrowserRequest(url, referer).then((removeEventListeners) => {
            fetch(url, {
                headers: new Headers({
                    'Accept': 'application/x-bittorrent,*/*;q=0.9'
                })
            }).then((response) => {
                if (!response.ok)
                    throw new Error(chrome.i18n.getMessage('torrentFetchError', response.status.toString() + ': ' + response.statusText));

                const contentType = response.headers.get('content-type');
                if (!contentType.match(/(application\/x-bittorrent|application\/octet-stream)/gi))
                    throw new Error(chrome.i18n.getMessage('torrentParseError', 'Unkown type: ' + contentType));

                return response.blob();
            }).then((buffer) => {
                getTorrentName(buffer).then((name) => resolve({
                    torrent: buffer,
                    torrentName: name,
                }));
            }).catch((error) => reject(error))
            .finally(() => removeEventListeners());
        });
    });
}

const createBrowserRequest = (url, referer) => {
    return new Promise((resolve, reject) => {
        const listener = async (details) => {
            let requestHeaders = details.requestHeaders;

            const currentTab = await getCurrentTab();

            // @crossplatform Tab includes cookieStoreId on Firefox
            const cookies = currentTab ? await getCookies(currentTab.cookieStoreId, url) : [];

            requestHeaders = requestHeaders.filter((header) => {
                return ![
                    'cookie',
                    'origin',
                    'referer',
                ].includes(header.name.toLowerCase());
            });

            if (cookies.length) {
                requestHeaders.push({
                    name: 'Cookie',
                    value: cookies.map((cookie) => [cookie.name, cookie.value].join('=')).join('; ')
                });
            }

            if (referer) {
                requestHeaders.push({
                    name: 'Referer',
                    value: referer
                });
            }

            return {
                requestHeaders: requestHeaders
            };
        }

        chrome.webRequest.onBeforeSendHeaders.addListener(
            listener,
            {urls: [url]},
            ['blocking', 'requestHeaders']
        );

        resolve(() => chrome.webRequest.onBeforeSendHeaders.removeListener(listener));
    });
}

const addRssFeed = (url) => {
    const serverSettings = options.servers[options.globals.currentServer];
    const connection = getClient(serverSettings);

    connection.logIn()
        .then(() => connection.addRssFeed(url))
        .then(() => {
            notification(chrome.i18n.getMessage('rssFeedAddedNotification'));
            connection.logOut();
        }).catch((error) => {
            connection.removeEventListeners();
            notification(error.message);
        });
}

const createServerSelectionContextMenu = () => {
    let context = ['browser_action'];

    if (options.globals.contextMenu)
        context.push('page');

    const hasManyServers = options.servers.length > 3;

    if (hasManyServers) {
        chrome.contextMenus.create({
            id: 'current-server',
            title: chrome.i18n.getMessage('serverSelect'),
            contexts: context
        });
    }

    options.servers.forEach((server, id) => {
        chrome.contextMenus.create({
            id: 'current-server-' + id.toString(),
            parentId: hasManyServers ? 'current-server' : null,
            type: 'radio',
            checked: id === options.globals.currentServer,
            title: server.name,
            contexts: context
        });
    });

    chrome.contextMenus.create({
        type: 'separator',
        contexts: ['browser_action'],
    });
}

const createDefaultMenu = () => {
    chrome.contextMenus.create({
        id: 'catch-urls',
        type: 'checkbox',
        checked: options.globals.catchUrls,
        title: chrome.i18n.getMessage('catchUrlsOption'),
        contexts: ['browser_action']
    });
    chrome.contextMenus.create({
        id: 'add-paused',
        type: 'checkbox',
        checked: options.globals.addPaused,
        title: chrome.i18n.getMessage('addPausedOption'),
        contexts: ['browser_action']
    });
}

const createContextMenu = () => {
    const serverOptions = options.servers[options.globals.currentServer];

    chrome.contextMenus.create({
      id: 'add-torrent',
      title: chrome.i18n.getMessage('addTorrentAction'),
      contexts: ['link']
    });

    const client = clientList.find((client) => client.id === serverOptions.application);

    if (options.globals.contextMenu === 1 && client.clientCapabilities) {
        if (client.clientCapabilities.length > 1) {
            chrome.contextMenus.create({
              id: 'add-torrent-advanced',
              title: chrome.i18n.getMessage('addTorrentAction') + ' (' + chrome.i18n.getMessage('advancedModifier') + ')',
              contexts: ['link']
            });
        }

        if (client.clientCapabilities.includes('paused')) {
            chrome.contextMenus.create({
              id: 'add-torrent-paused',
              title: chrome.i18n.getMessage('addTorrentPausedAction'),
              contexts: ['link']
            });
        }

        if (client.clientCapabilities.includes('label') && options.globals.labels.length) {
            chrome.contextMenus.create({
                id: 'add-torrent-label',
                title: chrome.i18n.getMessage('addTorrentLabelAction'),
                contexts: ['link']
            });

            options.globals.labels.forEach((label, i) => {
                chrome.contextMenus.create({
                    id: 'add-torrent-label-' + i,
                    parentId: 'add-torrent-label',
                    title: label,
                    contexts: ['link']
                });
            });
        }

        if (client.clientCapabilities.includes('path') && serverOptions.directories.length) {
            chrome.contextMenus.create({
                id: 'add-torrent-path',
                title: chrome.i18n.getMessage('addTorrentPathAction'),
                contexts: ['link']
            });

            serverOptions.directories.forEach((directory, i) => {
                chrome.contextMenus.create({
                    id: 'add-torrent-path-' + i,
                    parentId: 'add-torrent-path',
                    title: directory,
                    contexts: ['link']
                });
            });
        }
    } else if (client.clientCapabilities) {
        if (client.clientCapabilities.includes('label') && options.globals.labels.length) {
            chrome.contextMenus.create({
                contexts: ['link'],
                type: 'separator'
            });

            options.globals.labels.forEach((label, i) => {
                chrome.contextMenus.create({
                    id: 'add-torrent-label-' + i,
                    title: label,
                    contexts: ['link']
                });
            });
        }

        if (client.clientCapabilities.includes('path') && serverOptions.directories.length) {
            chrome.contextMenus.create({
                contexts: ['link'],
                type: 'separator'
            });

            serverOptions.directories.forEach((directory, i) => {
                chrome.contextMenus.create({
                    id: 'add-torrent-path-' + i,
                    title: directory,
                    contexts: ['link']
                });
            });
        }
    }

    if (client.clientCapabilities && client.clientCapabilities.includes('rss')) {
        if (options.globals.contextMenu === 1) {
            chrome.contextMenus.create({
                contexts: ['link'],
                type: 'separator'
            });
        }

        chrome.contextMenus.create({
          id: 'add-rss-feed',
          title: chrome.i18n.getMessage('addRssFeedAction'),
          contexts: options.globals.contextMenu === 1 ? ['selection', 'link'] : ['selection']
        });
    }
}

const removeContextMenu = () => {
    chrome.contextMenus.removeAll();
}

const registerHandler = () => {
    chrome.contextMenus.onClicked.addListener((info, tab) => {
        const currentServer = info.menuItemId.match(/^current-server-(\d+)$/);
        const labelId = info.menuItemId.match(/^add-torrent-label-(\d+)$/);
        const pathId = info.menuItemId.match(/^add-torrent-path-(\d+)$/);

        const clientOptions = options.servers[options.globals.currentServer].clientOptions || {};

        if (info.menuItemId === 'catch-urls')
            toggleURLCatching();
        if (info.menuItemId === 'add-paused')
            toggleAddPaused();
        else if (info.menuItemId === 'add-torrent')
            addTorrent(info.linkUrl, info.pageUrl, {
                paused: options.globals.addPaused,
                ...clientOptions
            });
        else if (info.menuItemId === 'add-torrent-paused')
            addTorrent(info.linkUrl, info.pageUrl, {
                paused: true,
                ...clientOptions
            });
        else if (labelId)
            addTorrent(info.linkUrl, info.pageUrl, {
                paused: options.globals.addPaused,
                label: options.globals.labels[~~labelId[1]],
                ...clientOptions
            });
        else if (pathId)
            addTorrent(info.linkUrl, info.pageUrl, {
                paused: options.globals.addPaused,
                path: options.servers[options.globals.currentServer].directories[~~pathId[1]],
                ...clientOptions
            });
        else if (info.menuItemId === 'add-torrent-advanced')
            addAdvancedDialog(info.linkUrl, !isMagnetUrl(info.linkUrl) ? info.pageUrl : null);
        else if (currentServer)
            setCurrentServer(~~currentServer[1]);
        else if (info.menuItemId === 'add-rss-feed')
            addRssFeed(info.linkUrl || info.selectionText.trim());
    });

    chrome.browserAction.onClicked.addListener(() => {
        if (isConfigured()) {
            const url = getURL(options.servers[options.globals.currentServer])
            chrome.tabs.create({ url });
        } else {
            chrome.runtime.openOptionsPage();
        }
    });

    chrome.webRequest.onBeforeRequest.addListener((details) => {
            let parser = document.createElement('a');
            parser.href = details.url;
            let magnetUri = decodeURIComponent(parser.pathname).substr(1);

            if (options.globals.addAdvanced) {
                addAdvancedDialog(magnetUri);
            } else {
                const clientOptions = options.servers[options.globals.currentServer].clientOptions || {};
                addTorrent(magnetUri, null, {
                    paused: options.globals.addPaused,
                    ...clientOptions
                });
            }
            return {cancel: true}
        },
        {urls: ['https://torrent-control.invalid/*']},
        ['blocking']
    );

    chrome.webRequest.onBeforeRequest.addListener((details) => {
            if (options.globals.catchUrls && details.type === 'main_frame' && isTorrentUrl(details.url, regExpCache) && isConfigured()) {
                if (options.globals.addAdvanced) {
                    // @crossplatform WebRequestBodyDetails includes origin URL on Firefox
                    addAdvancedDialog(details.url, details.originUrl);
                } else {
                    const clientOptions = options.servers[options.globals.currentServer].clientOptions || {};

                    addTorrent(details.url, details.originUrl, {
                        paused: options.globals.addPaused,
                        ...clientOptions
                    });
                }
                return {cancel: true};
            }

            return {cancel: false};
        },
        {urls: ['<all_urls>']},
        ['blocking']
    );

    chrome.runtime.onMessage.addListener(
        (request, sender, sendResponse) => {
            if (request.type === 'addTorrent') {
                const clientOptions = options.servers[options.globals.currentServer].clientOptions || {};

                addTorrent(request.url, request.referer, {
                    ...clientOptions,
                    ...request.options
                });
            }
        }
    );
}

const addAdvancedDialog = (url, referer = null) => {
    let params = new URLSearchParams();
    params.append('url', url);

    if (referer) {
        params.append('referer', referer);
    }

    const height = 350;
    const width = 500;
    const top = Math.round((screen.height / 2) - (height / 2));
    const left = Math.round((screen.width / 2) - (width / 2));

    chrome.windows.create({
        url: 'view/add_torrent.html?' + params.toString(),
        type: 'panel',
        top: top,
        left: left,
        height: height,
        width: width,

        // @crossplatform allowScriptsToClose, titlePreface are Firefox specific
        allowScriptsToClose: true,
        titlePreface: chrome.i18n.getMessage('addTorrentAction')
    });
}

export const notification = (message) => {
    if (options && !options.globals.enableNotifications) {
        return;
    }

    chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icon/default-48.png'),
        title: 'Torrent Control',
        message: message
    }, (id) => setTimeout(() => chrome.notifications.clear(id), 3000));
}

const setCurrentServer = (id) => {
    options.globals.currentServer = id;
    saveOptions(options);
}

const toggleURLCatching = () => {
    options.globals.catchUrls = !options.globals.catchUrls;
    saveOptions(options);
}

const toggleAddPaused = () => {
    options.globals.addPaused = !options.globals.addPaused;
    saveOptions(options);
}

const getCurrentTab = async () => {
    const activeTabs = await new Promise((resolve) => {
        chrome.tabs.query({
            active: true,
            windowId: chrome.windows.WINDOW_ID_CURRENT
        }, (activeTabs) => resolve(activeTabs))
    });

    if (activeTabs.length > 0)
      return activeTabs[0];

    return null;
}

const getCookies = async (cookieStoreId, torrentUrl) => {
    return await new Promise((resolve) => {
        chrome.cookies.getAll({
            url: torrentUrl,
            storeId: cookieStoreId
        }, (cookies) => resolve(cookies))
    });
}
