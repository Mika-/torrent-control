var options;

loadOptions().then((newOptions) => {
    options = newOptions;

    createContextMenu();
});

const addTorrent = (url) => {
    const serverOptions = options.servers[0];
    const connection = getClient(serverOptions);

    fetchTorrent(url).then((torrent) => {
        connection.logIn().then(() => {
            connection.addTorrent(torrent);
        });
    }).catch((error) => console.error(error));
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
                reject('Failed to fetch torrent');
        }).then((buffer) => {
            if (buffer.type === 'application/x-bittorrent')
                resolve(buffer);
            else
                reject('Failed to read torrent');
        });
    });
}

const createContextMenu = () => {
    browser.menus.create({
      id: 'add-torrent',
      title: 'Add torrent',
      contexts: ['link']
    });

    browser.menus.onClicked.addListener((info, tab) => {
        if (info.menuItemId === 'add-torrent')
            addTorrent(info.linkUrl);
    });
}
