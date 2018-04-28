const clientList = [
    {
        id: 'biglybt',
        name: 'BiglyBT',
        addressPlaceholder: 'http://127.0.0.1:9091/'
    },
    {
        id: 'cloudtorrent',
        name: 'Cloud Torrent',
        addressPlaceholder: 'http://127.0.0.1:3000/'
    },
    {
        id: 'deluge',
        name: 'Deluge',
        addressPlaceholder: 'http://127.0.0.1:8112/'
    },
    {
        id: 'flood',
        name: 'Flood',
        addressPlaceholder: 'http://127.0.0.1:3000/'
    },
    {
        id: 'rutorrent',
        name: 'ruTorrent',
        addressPlaceholder: 'http://127.0.0.1:80/'
    },
    {
        id: 'tixati',
        name: 'Tixati',
        addressPlaceholder: 'http://127.0.0.1:8888/'
    },
    {
        id: 'transmission',
        name: 'Transmission',
        addressPlaceholder: 'http://127.0.0.1:9091/'
    },
    {
        id: 'utorrent',
        name: 'µTorrent',
        addressPlaceholder: 'http://127.0.0.1:8112/gui/'
    },
    {
        id: 'qbittorrent',
        name: 'qBittorrent',
        addressPlaceholder: 'http://127.0.0.1:8080/'
    }
];

const getClient = (serverOptions) => {
    switch(serverOptions.application) {
        case 'biglybt':
            return new TransmissionApi(serverOptions);
        case 'cloudtorrent':
            return new CloudTorrentApi(serverOptions);
        case 'deluge':
            return new DelugeApi(serverOptions);
        case 'flood':
            return new floodApi(serverOptions);
        case 'rutorrent':
            return new ruTorrentApi(serverOptions);
        case 'tixati':
            return new TixatiApi(serverOptions);
        case 'transmission':
            return new TransmissionApi(serverOptions);
        case 'utorrent':
            return new uTorrentApi(serverOptions);
        case 'qbittorrent':
            return new qBittorrentApi(serverOptions);
    }

    return new Error('No client found');
}

const loadOptions = () => {
    const defaults = {
        globals: {
            currentServer: 0,
            showcontextmenu: true
        },
        servers: [
            {
                name: 'Default',
                application: clientList[0].id,
                hostname: '',
                username: '',
                password: ''
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
