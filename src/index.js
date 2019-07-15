var options;

chrome.storage.onChanged.addListener((changes) => {
    Object.keys(changes).forEach((key) => options[key] = changes[key].newValue);

    removeContextMenu();

    if (options.globals.contextMenu && options.servers[options.globals.currentServer].hostname !== '')
        createContextMenu();

    if (options.servers.length > 1)
        createServerSelectionContextMenu();

    createDefaultMenu();
});

loadOptions().then((newOptions) => {
    options = newOptions;

    if (options.globals.contextMenu && options.servers[options.globals.currentServer].hostname !== '')
        createContextMenu();

    if (options.servers.length > 1)
        createServerSelectionContextMenu();

    createDefaultMenu();
    registerHandler();
});

const addTorrent = (url, referer = null, torrentOptions = {}) => {
    const serverSettings = options.servers[options.globals.currentServer];
    const connection = getClient(serverSettings);
    const networkErrors = [
        'NetworkError when attempting to fetch resource.',
    ];

    torrentOptions = {
        paused: false,
        path: null,
        label: null,
        ...torrentOptions
    };

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
                }),
                credentials: 'include'
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
        const listener = (details) => {
            let requestHeaders = details.requestHeaders;

            requestHeaders = requestHeaders.filter((header) => {
                return ![
                    'origin',
                    'referer',
                ].includes(header.name.toLowerCase());
            });

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

const createServerSelectionContextMenu = () => {
    let context = ['browser_action'];

    if (options.globals.contextMenu)
        context.push('page');

    options.servers.forEach((server, id) => {
        chrome.contextMenus.create({
            id: 'current-server-' + id.toString(),
            type: 'radio',
            checked: id === options.globals.currentServer,
            title: server.name,
            contexts: context
        });
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

    if (options.globals.contextMenu === 1 && client.torrentOptions) {
        if (client.torrentOptions.includes('paused')) {
            chrome.contextMenus.create({
              id: 'add-torrent-paused',
              title: chrome.i18n.getMessage('addTorrentPausedAction'),
              contexts: ['link']
            });
        }

        if (client.torrentOptions.includes('label') && options.globals.labels.length) {
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

        if (client.torrentOptions.includes('path') && serverOptions.directories.length) {
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
    }
    else {
        if (client.torrentOptions.includes('label') && options.globals.labels.length) {
            options.globals.labels.forEach((label, i) => {
                chrome.contextMenus.create({
                    id: 'add-torrent-label-' + i,
                    parentId: 'add-torrent',
                    title: label,
                    contexts: ['link']
                });
            });
        }
    }
}

const removeContextMenu = () => {
    chrome.contextMenus.removeAll();
}

const registerHandler = () => {
    chrome.contextMenus.onClicked.addListener((info, tab) => {
        const currentServer = info.menuItemId.match(/^current\-server\-(\d+)$/);
        const labelId = info.menuItemId.match(/^add\-torrent\-label\-(\d+)$/);
        const pathId = info.menuItemId.match(/^add\-torrent\-path\-(\d+)$/);

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
        else if (currentServer)
            setCurrentServer(~~currentServer[1]);
    });

    chrome.browserAction.onClicked.addListener(() => {
        if (options.servers[options.globals.currentServer].hostname !== '') {
            chrome.tabs.create({
                url: options.servers[options.globals.currentServer].hostname
            });
        } else {
            chrome.runtime.openOptionsPage();
        }
    });

    chrome.webRequest.onBeforeRequest.addListener(
        (details) => {
            let parser = document.createElement('a');
            parser.href = details.url;
            let magnetUri = decodeURIComponent(parser.pathname).substr(1);
            addTorrent(magnetUri, null, {
                paused: options.globals.addPaused
            });
            return {cancel: true}
        },
        {urls: ['https://torrent-control.invalid/*']},
        ['blocking']
    );

    chrome.webRequest.onBeforeRequest.addListener(
        (details) => {
            if (options.globals.catchUrls && details.type === 'main_frame' && isTorrentUrl(details.url)) {
                addTorrent(details.url, details.originUrl, {
                    paused: options.globals.addPaused
                });
                return {cancel: true};
            }

            return {cancel: false};
        },
        {urls: ['<all_urls>']},
        ['blocking']
    );
}

const notification = (message) => {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.extension.getURL('icon/default-48.png'),
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
