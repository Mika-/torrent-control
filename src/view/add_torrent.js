const restoreOptions = () => {
    const params = new URLSearchParams(window.location.search);
    document.querySelector('#url').value = params.get('url');

    document.querySelectorAll('[data-i18n]').forEach((element) => {
        element.textContent = chrome.i18n.getMessage(element.getAttribute('data-i18n'));
    });

    loadOptions().then((options) => {
        const serverOptions = options.servers[options.globals.currentServer];
        const client = clientList.find((client) => client.id === serverOptions.application);

        document.querySelector('#addpaused').checked = options.globals.addPaused;

        if (client.torrentOptions && client.torrentOptions.includes('path')) {
            serverOptions.directories.forEach((directory) => {
                let element = document.createElement('option');
                element.setAttribute('value', directory);
                element.textContent = directory;
                document.querySelector('#downloadLocation').appendChild(element);
            });
        } else {
            document.querySelector('#downloadLocation').disabled = true;
        }

        if (client.torrentOptions && client.torrentOptions.includes('label')) {
            options.globals.labels.forEach((label) => {
                let element = document.createElement('option');
                element.setAttribute('value', label);
                element.textContent = label;
                document.querySelector('#labels').appendChild(element);
            });
        } else {
            document.querySelector('#labels').disabled = true;
        }

        if (!client.torrentOptions || !client.torrentOptions.includes('paused'))
            document.querySelector('#addpaused').disabled = true;
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector('#add-torrent').addEventListener('click', (e) => {
    e.preventDefault();

    const params = new URLSearchParams(window.location.search);
    const label = document.querySelector('#labels').value;
    const path = document.querySelector('#downloadLocation').value;
    const addPaused = document.querySelector('#addpaused').checked;

    let options = {
        paused: addPaused
    };

    if (label.length)
        options.label = label;

    if (path.length)
        options.path = path;

    chrome.runtime.sendMessage({
        type: 'addTorrent',
        url: params.get('url'),
        referer: params.get('referer'),
        options: options
    });

    window.close();
});
