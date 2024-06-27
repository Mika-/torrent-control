import {
    clientList,
    whitelist,
    loadOptions,
    saveOptions,
    getClient,
    isTorrentUrl,
    isMagnetUrl,
    getHostFilter,
    getTorrentName,
    getMagnetUrlName,
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

const addTorrent = (url, tabId, torrentOptions = {}) => {
    const server = torrentOptions.server !== undefined ? torrentOptions.server : options.globals.currentServer;
    const serverSettings = options.servers[server];

    const addTorrentOptions = {
        paused: false,
        path: serverSettings.defaultDirectory || null,
        label: serverSettings.defaultLabel || null,
        ...torrentOptions,
    };

    const connection = getClient(serverSettings);
    const networkErrors = [
        'NetworkError when attempting to fetch resource.',
    ];

    if (isMagnetUrl(url)) {
        connection.logIn()
            .then(() => connection.addTorrentUrl(url, addTorrentOptions)
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
        fetchTorrent(url, tabId)
            .then(({torrent, torrentName}) => connection.logIn()
                .then(() => connection.addTorrent(torrent, addTorrentOptions)
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

export const fetchTorrent = (url, tabId) => {
    return new Promise(async (resolve, reject) => {
        if (tabId === null || await tabExists(tabId) === false) {
            return reject(new Error(chrome.i18n.getMessage('sourceTabDestroyedError')));
        }

        chrome.tabs.sendMessage(tabId, {
            type: 'fetchTorrent',
            url: url,
        }, (response) => {
            if (response instanceof Error)
                return reject(response);

            if (!response.ok)
                return reject(new Error(chrome.i18n.getMessage('torrentFetchError', response.status.toString() + ': ' + response.statusText)));

            if (response.content.type !== '' && !response.content.type.match(/(application\/x-bittorrent|application\/octet-stream)/gi))
                return reject(new Error(chrome.i18n.getMessage('torrentParseError', 'Unknown type: ' + response.content.type)));

            getTorrentName(response.content).then((name) => resolve({
                torrent: response.content,
                torrentName: name,
            }));
        })
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
            addTorrent(info.linkUrl, tab.id, {
                paused: options.globals.addPaused,
                ...clientOptions
            });
        else if (info.menuItemId === 'add-torrent-paused')
            addTorrent(info.linkUrl, tab.id, {
                paused: true,
                ...clientOptions
            });
        else if (labelId)
            addTorrent(info.linkUrl, tab.id, {
                paused: options.globals.addPaused,
                label: options.globals.labels[~~labelId[1]],
                ...clientOptions
            });
        else if (pathId)
            addTorrent(info.linkUrl, tab.id, {
                paused: options.globals.addPaused,
                path: options.servers[options.globals.currentServer].directories[~~pathId[1]],
                ...clientOptions
            });
        else if (info.menuItemId === 'add-torrent-advanced')
            addAdvancedDialog(info.linkUrl, !isMagnetUrl(info.linkUrl) ? tab.id : null);
        else if (currentServer)
            setCurrentServer(~~currentServer[1]);
        else if (info.menuItemId === 'add-rss-feed')
            addRssFeed(info.linkUrl || info.selectionText.trim());
    });

    chrome.browserAction.onClicked.addListener(async () => {
        if (!isConfigured()) {
            chrome.runtime.openOptionsPage();

            return;
        }

        const {hostname, application, username, password} = options.servers[options.globals.currentServer];

        const tab = await new Promise((resolve) => {
            chrome.tabs.create({
                url: hostname,
            }, (tab) => resolve(tab));
        });

        const client = clientList.find((client) => client.id === application);

        if (client.clientCapabilities && client.clientCapabilities.includes('httpAuth') && username && password) {
            let pendingRequests = [];

            const onAuthRequiredListener = (details) => {
                if (pendingRequests.includes(details.requestId)) {
                    return;
                }

                pendingRequests.push(details.requestId);

                return {
                    authCredentials: {
                        username: username,
                        password: password,
                    },
                };
            };

            const onAuthCompletedListener = (details) => {
                let index = pendingRequests.indexOf(details.requestId);

                if (index > -1) {
                    pendingRequests.splice(index, 1);
                }
            };

            chrome.webRequest.onAuthRequired.addListener(
                onAuthRequiredListener,
                {
                    urls: [getHostFilter(hostname)],
                    tabId: tab.id,
                },
                ['blocking'],
            );

            chrome.webRequest.onCompleted.addListener(
                onAuthCompletedListener,
                {
                    urls: [getHostFilter(hostname)],
                    tabId: tab.id,
                },
            );

            chrome.webRequest.onErrorOccurred.addListener(
                onAuthCompletedListener,
                {
                    urls: [getHostFilter(hostname)],
                    tabId: tab.id,
                },
            );

            const onTabRemovedListener = (tabId) => {
                if (tabId !== tab.id) {
                    return;
                }

                chrome.webRequest.onAuthRequired.removeListener(onAuthRequiredListener);
                chrome.webRequest.onCompleted.removeListener(onAuthCompletedListener);
                chrome.webRequest.onErrorOccurred.removeListener(onAuthCompletedListener);

                chrome.tabs.onRemoved.removeListener(onTabRemovedListener);
            }

            chrome.tabs.onRemoved.addListener(onTabRemovedListener)
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

    chrome.webRequest.onBeforeRequest.addListener(async (details) => {
            if (options.globals.catchUrls && details.type === 'main_frame' && isTorrentUrl(details.url, regExpCache) && isConfigured()) {
                const originTab = await getOriginTab(details.cookieStoreId, details.originUrl);
                let tabId = details.tabId;

                if (originTab !== undefined) {
                    tabId = originTab.id;
                }

                if (options.globals.addAdvanced) {
                    addAdvancedDialog(details.url, tabId);
                } else {
                    const clientOptions = options.servers[options.globals.currentServer].clientOptions || {};

                    addTorrent(details.url, tabId, {
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

                addTorrent(request.url, request.tabId, {
                    ...clientOptions,
                    ...request.options
                });
            }
        }
    );
}

const addAdvancedDialog = (url, tabId = null) => {
    let params = new URLSearchParams();
    params.append('url', url);

    if (tabId) {
        params.append('tabId', tabId);
    }

    const height = 365;
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

/**
 * @param tabId {number}
 * @returns {Promise<boolean>}
 */
const tabExists = (tabId) => {
    return new Promise((resolve) => {
        chrome.tabs.get(tabId, (tab) => resolve(tab !== undefined));
    });
}
/**
 * @param cookieStoreId {string}
 * @param url {string}
 * @returns {Promise<Tab>}
 */
const getOriginTab = (cookieStoreId, url) => {
    return new Promise((resolve) => {
        chrome.tabs.query({
            url: url,
            cookieStoreId: cookieStoreId
        }, (tab) => resolve(tab[0] || undefined));
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
    }, (id) => setTimeout(() => chrome.notifications.clear(id), 5000));
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
