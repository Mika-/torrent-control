const clientList = [
    {
        id: 'biglybt',
        name: 'BiglyBT',
        addressPlaceholder: 'http://127.0.0.1:9091/',
        torrentOptions: ['paused', 'path']
    },
    {
        id: 'cloudtorrent',
        name: 'Cloud Torrent',
        addressPlaceholder: 'http://127.0.0.1:3000/'
    },
    {
        id: 'deluge',
        name: 'Deluge Web UI',
        addressPlaceholder: 'http://127.0.0.1:8112/',
        torrentOptions: ['paused', 'path']
    },
    {
        id: 'flood',
        name: 'Flood',
        addressPlaceholder: 'http://127.0.0.1:3000/',
        torrentOptions: ['paused', 'label', 'path']
    },
    {
        id: 'rutorrent',
        name: 'ruTorrent',
        addressPlaceholder: 'http://127.0.0.1:80/',
        torrentOptions: ['paused', 'label', 'path'],
        clientOptions: [
            {
                name: 'fast_resume',
                description: browser.i18n.getMessage('skipHashCheckOption')
            }
        ]
    },
    {
        id: 'tixati',
        name: 'Tixati',
        addressPlaceholder: 'http://127.0.0.1:8888/',
        torrentOptions: ['paused']
    },
    {
        id: 'transmission',
        name: 'Transmission',
        addressPlaceholder: 'http://127.0.0.1:9091/',
        torrentOptions: ['paused', 'path']
    },
    {
        id: 'utorrent',
        name: 'µTorrent',
        addressPlaceholder: 'http://127.0.0.1:8112/gui/'
    },
    {
        id: 'qbittorrent',
        name: 'qBittorrent',
        addressPlaceholder: 'http://127.0.0.1:8080/',
        torrentOptions: ['paused', 'label', 'path'],
        clientOptions: [
            {
                name: 'sequentialDownload',
                description: browser.i18n.getMessage('sequentialDownloadOption')
            },
            {
                name: 'firstLastPiecePrio',
                description: browser.i18n.getMessage('firstLastPiecePriorityOption')
            }
        ]
    },
    {
        id: 'qbittorrent_404',
        name: 'qBittorrent (<=4.0.4)',
        addressPlaceholder: 'http://127.0.0.1:8080/'
    }
];

const getClient = (serverSettings) => {
    switch(serverSettings.application) {
        case 'biglybt':
            return new TransmissionApi(serverSettings);
        case 'cloudtorrent':
            return new CloudTorrentApi(serverSettings);
        case 'deluge':
            return new DelugeApi(serverSettings);
        case 'flood':
            return new floodApi(serverSettings);
        case 'rutorrent':
            return new ruTorrentApi(serverSettings);
        case 'tixati':
            return new TixatiApi(serverSettings);
        case 'transmission':
            return new TransmissionApi(serverSettings);
        case 'utorrent':
            return new uTorrentApi(serverSettings);
        case 'qbittorrent':
            return new qBittorrentApi(serverSettings);
        case 'qbittorrent_404':
            return new qBittorrentApi({
                apiVersion: 1,
                ...serverSettings
            });
    }

    return new Error('No client found');
}

const loadOptions = () => {
    const defaults = {
        globals: {
            currentServer: 0,
            addPaused: false,
            contextMenu: 1,
            catchUrls: true,
            labels: []
        },
        servers: [
            {
                name: 'Default',
                application: clientList[0].id,
                hostname: '',
                username: '',
                password: '',
                directories: [],
                clientOptions: {}
            }
        ]
    };

    return new Promise((resolve, reject) => {
        browser.storage.local.get(defaults).then((options) => {
            mergeObjects(defaults, options);
            resolve(defaults);
        });
    });
}

const saveOptions = (options) => {
    return browser.storage.local.set(options);
}

const isMagnetUrl = (url) => {
    return !!url.match(/^magnet:/);
}

const whitelist = [
    // Generic
    /\.torrent$/,
    /\.torrent\?/,

    // Software specific
    /\/torrents\.php\?action=download&id=\d+/, // Gazelle

    // Site specific
    /^https:\/\/anidex\.info\/dl\/\d+$/,
    /^https:\/\/animebytes\.tv\/torrent\/\d+\/download\/$/,
];

const isTorrentUrl = (url) => {
    return whitelist.some((regexp) => !!url.match(regexp));
}

const getMagnetUrlName = (url) => {
    const params = new URLSearchParams(url.match(/^magnet:(.+)$/)[1]);

    return (params.has('dn') ? params.get('dn') : false);
}

const getTorrentName = (data) => {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onerror = (error) => resolve(false);
        reader.onload = () => {
            const offset = reader.result.match(/name(\d+):/) || false;
            let text = false;

            if (offset) {
                const index = offset.index + offset[0].length;
                let bytes = 0;
                text = '';

                while (bytes < offset[1]) {
                    let char = reader.result.charAt(index + text.length);

                    text += char;
                    bytes += unescape(encodeURI(char)).length;
                }
            }

            resolve(text);
        };
        reader.readAsText(data);
    });
}

const base64Encode = (data) => {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onerror = (error) => reject(error);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(data);
    });
}

const mergeObjects = (target, source) => {
    Object.keys(source).forEach((key) =>
        target.hasOwnProperty(key) && typeof target[key] === 'object' ?
            mergeObjects(target[key], source[key]) : target[key] = source[key]
    );
}
