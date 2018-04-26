var options;

browser.storage.onChanged.addListener((changes) => {
    Object.keys(changes).forEach((key) => options[key] = changes[key].newValue);

    removeContextMenu();

    if (options.globals.showcontextmenu)
        createContextMenu();

    if (options.servers.length > 1)
        createBrowserActionContextMenu();
});

loadOptions().then((newOptions) => {
    options = newOptions;

    if (options.globals.showcontextmenu)
        createContextMenu();

    if (options.servers.length > 1)
        createBrowserActionContextMenu();

    registerHandler();
});

const addTorrent = (url, referer = null) => {
    const serverOptions = options.servers[0];
    const connection = getClient(serverOptions);

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

                return response.blob();
            }).then((buffer) => {
                if (buffer.type.match(/(application\/x-bittorrent|application\/octet-stream|text\/html)/)) {
                    getTorrentName(buffer).then((name) => resolve({
                        torrent: buffer,
                        torrentName: name,
                    }));
                }
                else {
                    throw new Error(browser.i18n.getMessage('torrentParseError'));
                }
            }).catch((error) => reject(error))
            .then(() => removeEventListeners());
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

const createBrowserActionContextMenu = () => {
    options.servers.forEach((server, id) => {
        browser.menus.create({
            id: 'current-server-' + id.toString(),
            type: 'radio',
            checked: id === options.globals.currentServer,
            title: server.name,
            contexts: [
                'browser_action',
            ]
        });
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
        if (info.menuItemId === 'add-torrent')
            addTorrent(info.linkUrl, info.pageUrl);
    });

    browser.browserAction.onClicked.addListener(() => {
        if (options.servers[0].hostname !== '') {
            browser.tabs.create({
                url: options.servers[0].hostname
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
}

const notification = (message) => {
    browser.notifications.create({
        type: 'basic',
        iconUrl: browser.extension.getURL('icon/default-48.png'),
        title: 'Torrent Control',
        message: message
    }).then((id) => setTimeout(() => browser.notifications.clear(id), 3000));
}
