const clientList = [
    {
        id: 'cloudtorrent',
        name: 'Cloud Torrent'
    },
    {
        id: 'qbittorrent',
        name: 'qBittorrent'
    }
];

const getClient = (serverOptions) => {
    switch(serverOptions.application) {
        case 'cloudtorrent':
            return new CloudTorrentApi(serverOptions);
        case 'qbittorrent':
            return new qBittorrentApi(serverOptions);
    }

    return new Error('No client found');
}

const loadOptions = () => {
    return browser.storage.local.get({
        servers: [
            {
                name: 'Default',
                application: 'qbittorrent',
                hostname: '',
                username: '',
                password: ''
            }
        ]
    });
}

const saveOptions = (options) => {
    return browser.storage.local.set(options);
}

const isMagnetUrl = (url) => {
    return !!url.match(/^magnet:/);
}
