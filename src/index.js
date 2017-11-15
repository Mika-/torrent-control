var options;

browser.storage.onChanged.addListener((changes) => {
    Object.keys(changes).forEach((key) => options[key] = changes[key].newValue);
});

loadOptions().then((newOptions) => {
    options = newOptions;

    if (options.globals.showcontextmenu) {
        createContextMenu();
    }
    registerHandler();
});

const addTorrent = (url) => {
    const serverOptions = options.servers[0];
    const connection = getClient(serverOptions);

    if (isMagnetUrl(url)) {
        connection.logIn()
            .then(() => connection.addTorrentUrl(url)
                .then(() => {
                    notification(browser.i18n.getMessage('torrentAddedNotification'));
                    connection.logOut();
                })
            ).catch((error) => notification(error.message));
    } else {
        fetchTorrent(url)
            .then((torrent) => connection.logIn()
                .then(() => connection.addTorrent(torrent)
                    .then(() => {
                        notification(browser.i18n.getMessage('torrentAddedNotification'));
                        connection.logOut();
                    })
                )
            ).catch((error) => notification(error.message));
    }
}

const fetchTorrent = (url) => {
    return new Promise((resolve, reject) => {
        fetch(url, {
            headers: new Headers({
                'Content-Type': 'application/x-bittorrent'
            })
        }).then((response) => {
            if (response.ok)
                return response.blob();
            else
                reject(new Error(browser.i18n.getMessage('torrentFetchError')));
        }).then((buffer) => {
            if (buffer.type === 'application/x-bittorrent')
                resolve(buffer);
            else
                reject(new Error(browser.i18n.getMessage('torrentParseError')));
        }).catch((error) => reject(error));
    });
}

const createContextMenu = () => {
    browser.menus.create({
      id: 'add-torrent',
      title: browser.i18n.getMessage('addTorrentAction'),
      contexts: ['link']
    });

    browser.menus.onClicked.addListener((info, tab) => {
        if (info.menuItemId === 'add-torrent')
            addTorrent(info.linkUrl);
    });
}

const removeContextMenu = () => {
    browser.menus.removeAll();
}

const registerHandler = () => {
    browser.webRequest.onBeforeRequest.addListener(
        (details) => {
            var parser = document.createElement('a');
            parser.href = details.url;
            var magnetUri = decodeURIComponent(parser.pathname).substr(1);
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
