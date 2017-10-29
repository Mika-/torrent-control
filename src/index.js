var options;

loadOptions().then((options) => {
    options = options;

    createContextMenu();
});

const addTorrent = (url) => {
    fetchTorrent(url).then((torrent) => {
        console.log(torrent);
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
