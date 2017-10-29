const clientApis = {
    qbittorrent: 'qBittorrentApi'
};

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