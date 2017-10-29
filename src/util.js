const clientApis = {
    qbittorrent: 'qBittorrentApi'
};

const loadOptions = () => {
    return browser.storage.sync.get({
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
    return browser.storage.sync.set(options);
}