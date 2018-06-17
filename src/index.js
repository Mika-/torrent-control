var options;

browser.storage.onChanged.addListener((changes) => {
    Object.keys(changes).forEach((key) => options[key] = changes[key].newValue);

    removeContextMenu();

    if (options.globals.showcontextmenu)
        createContextMenu();

    if (options.servers.length > 1)
        createServerSelectionContextMenu();
});

loadOptions().then((newOptions) => {
    options = newOptions;

    if (options.globals.showcontextmenu)
        createContextMenu();

    if (options.servers.length > 1)
        createServerSelectionContextMenu();

    registerHandler();
});

const submitTorrent = (url, torrent, torrentName) => {
    const serverOptions = options.servers[options.globals.currentServer];
    const connection = getClient(serverOptions);
    connection.logIn()
        .then(() => {
            (url ? connection.addTorrentUrl(url) : connection.addTorrent(torrent))
            .then(() => {
                notification(browser.i18n.getMessage('torrentAddedNotification') + (torrentName ? ' ' + torrentName : ''));
                connection.logOut();
            });
        }).catch((error) => {
            connection.removeEventListeners();
            notification(error.message);
        });
};

const addTorrent = (url, referer = null) => {
    if (isMagnetUrl(url)) {
        submitTorrent(url, null, getMagnetUrlName(url));
    } else {
        fetchTorrent(url, referer)
            .then(({torrent, torrentName}) => submitTorrent(null, torrent, torrentName));
    }
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

    browser.runtime.onMessage.addListener((message) => {
        console.log("===== torrent-control: add torrent: via link click");
        submitTorrent(null, message.torrent, message.torrentName);
    });

    browser.menus.onClicked.addListener((info, tab) => {
        const currentServer = info.menuItemId.match(/^current\-server\-(\d+)$/);

        if (info.menuItemId === 'add-torrent') {
            console.log("===== torrent-control: add torrent: via link context menu");
            addTorrent(info.linkUrl, info.pageUrl);
        } else if (currentServer) {
            setCurrentServer(parseInt(currentServer[1]));
        }
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
            console.log("===== torrent-control: add torrent: via magnet protocol handler");
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

const setCurrentServer = (id) => {
    options.globals.currentServer = id;
    saveOptions(options);
}
