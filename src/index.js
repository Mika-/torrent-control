var options;

browser.storage.onChanged.addListener((changes) => {
    Object.keys(changes).forEach((key) => options[key] = changes[key].newValue);

    removeContextMenu();

    if (options.globals.showcontextmenu && options.servers[options.globals.currentServer].hostname !== '')
        createContextMenu();

    if (options.servers.length > 1)
        createServerSelectionContextMenu();

    createDefaultMenu();
});

loadOptions().then((newOptions) => {
    options = newOptions;

    if (options.globals.showcontextmenu && options.servers[options.globals.currentServer].hostname !== '')
        createContextMenu();

    if (options.servers.length > 1)
        createServerSelectionContextMenu();

    createDefaultMenu();
    registerHandler();
});

const addTorrent = (url, referer = null) => {
    const serverSettings = options.servers[options.globals.currentServer];
    const connection = getClient(serverSettings);
    const networkErrors = [
        'NetworkError when attempting to fetch resource.',
    ];

    if (isMagnetUrl(url)) {
        connection.logIn()
            .then(() => connection.addTorrentUrl(url)
                .then(() => {
                    const torrentName = getMagnetUrlName(url);
                    notification(browser.i18n.getMessage('torrentAddedNotification') + (torrentName ? ' ' + torrentName : ''));
                    connection.logOut();
                })
            ).catch((error) => {
                connection.removeEventListeners();

                if (networkErrors.includes(error.message))
                    notification(browser.i18n.getMessage('torrentAddError', 'Network error'));
                else
                    notification(error.message);
            });
    } else {
        fetchTorrent(url, referer)
            .then(({torrent, torrentName}) => connection.logIn()
                .then(() => connection.addTorrent(torrent)
                    .then(() => {
                        notification(browser.i18n.getMessage('torrentAddedNotification') + (torrentName ? ' ' + torrentName : ''));
                        connection.logOut();
                    })
                )
            ).catch((error) => {
                connection.removeEventListeners();

                if (networkErrors.includes(error.message))
                    notification(browser.i18n.getMessage('torrentAddError', 'Network error'));
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
                    throw new Error(browser.i18n.getMessage('torrentFetchError', response.status.toString() + ': ' + response.statusText));

                const contentType = response.headers.get('content-type');
                if (!contentType.match(/(application\/x-bittorrent|application\/octet-stream)/gi))
                    throw new Error(browser.i18n.getMessage('torrentParseError', 'Unkown type: ' + contentType));

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

            requestHeaders.push({
                name: 'Referer',
                value: referer
            });

            return {
                requestHeaders: requestHeaders
            };
        }

        browser.webRequest.onBeforeSendHeaders.addListener(
            listener,
            {urls: [url]},
            ['blocking', 'requestHeaders']
        );

        resolve(() => browser.webRequest.onBeforeSendHeaders.removeListener(listener));
    });
}

const createServerSelectionContextMenu = () => {
    let context = ['browser_action'];

    if (options.globals.showcontextmenu)
        context.push('page');

    options.servers.forEach((server, id) => {
        browser.menus.create({
            id: 'current-server-' + id.toString(),
            type: 'radio',
            checked: id === options.globals.currentServer,
            title: server.name,
            contexts: context
        });
    });
}

const createDefaultMenu = () => {
    browser.menus.create({
        id: 'settings',
        title: browser.i18n.getMessage('settingsAction'),
        contexts: ['browser_action']
    });
    browser.menus.create({
        id: 'catch-urls',
        type: 'checkbox',
        checked: options.globals.catchUrls,
        title: browser.i18n.getMessage('catchUrlsOption'),
        contexts: ['browser_action']
    });
}

const createContextMenu = () => {
    browser.menus.create({
      id: 'add-torrent',
      title: browser.i18n.getMessage('addTorrentAction'),
      contexts: ['link']
    });
}

const removeContextMenu = () => {
    browser.menus.removeAll();
}

const registerHandler = () => {
    browser.menus.onClicked.addListener((info, tab) => {
        const currentServer = info.menuItemId.match(/^current\-server\-(\d+)$/);

        if (info.menuItemId === 'settings')
            browser.runtime.openOptionsPage();
        else if (info.menuItemId === 'catch-urls')
            toggleURLCatching();
        else if (info.menuItemId === 'add-torrent')
            addTorrent(info.linkUrl, info.pageUrl);
        else if (currentServer)
            setCurrentServer(parseInt(currentServer[1]));
    });

    browser.browserAction.onClicked.addListener(() => {
        if (options.servers[options.globals.currentServer].hostname !== '') {
            browser.tabs.create({
                url: options.servers[options.globals.currentServer].hostname
            });
        } else {
            browser.runtime.openOptionsPage();
        }
    });

    browser.webRequest.onBeforeRequest.addListener(
        (details) => {
            let parser = document.createElement('a');
            parser.href = details.url;
            let magnetUri = decodeURIComponent(parser.pathname).substr(1);
            addTorrent(magnetUri);
            return {cancel: true}
        },
        {urls: ['https://torrent-control.invalid/*']},
        ['blocking']
    );

    browser.webRequest.onBeforeRequest.addListener(
        (details) => {
            if (options.globals.catchUrls && details.type === 'main_frame' && isTorrentUrl(details.url)) {
                addTorrent(details.url, details.originUrl);
                return {cancel: true};
            }

            return {cancel: false};
        },
        {urls: ['<all_urls>']},
        ['blocking']
    );
}

const notification = (message) => {
    browser.notifications.create({
        type: 'basic',
        iconUrl: browser.extension.getURL('icon/default-48.png'),
        title: 'Torrent Control',
        message: message
    }).then((id) => setTimeout(() => browser.notifications.clear(id), 3000));
}

const setCurrentServer = (id) => {
    options.globals.currentServer = id;
    saveOptions(options);
}

const toggleURLCatching = () => {
    options.globals.catchUrls = !options.globals.catchUrls;
    saveOptions(options);
}
