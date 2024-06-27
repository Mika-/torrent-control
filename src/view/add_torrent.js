import {
    clientList,
    loadOptions,
} from '../util.js';

var options;

const restoreOptions = () => {
    const params = new URLSearchParams(window.location.search);
    document.querySelector('#url').value = params.get('url');

    document.querySelectorAll('[data-i18n]').forEach((element) => {
        element.textContent = chrome.i18n.getMessage(element.getAttribute('data-i18n'));
    });

    loadOptions().then((loadedOptions) => {
        options = loadedOptions;

        document.querySelector('#addpaused').checked = options.globals.addPaused;

        options.servers.forEach((server, i) => {
            let element = document.createElement('option');
            element.setAttribute('value', i.toString());
            element.textContent = server.name;
            document.querySelector('#server').appendChild(element);
        })

        options.globals.labels.forEach((label) => {
            let element = document.createElement('option');
            element.setAttribute('value', label);
            element.textContent = label;
            document.querySelector('#labels').appendChild(element);
        });

        selectServer(options.globals.currentServer);
    });
}

const selectServer = (serverId) => {
    document.querySelector('#server').value = serverId;

    const serverOptions = options.servers[serverId];
    const client = clientList.find((client) => client.id === serverOptions.application);

    const downloadLocationSelect = document.querySelector('#downloadLocation');

    document.querySelectorAll('#downloadLocation > option').forEach((element, i) => {
        if (i > 0)
            element.remove();
    });

    if (client.clientCapabilities && client.clientCapabilities.includes('path')) {
        serverOptions.directories.forEach((directory) => {
            let element = document.createElement('option');
            element.setAttribute('value', directory);
            element.textContent = directory;
            downloadLocationSelect.appendChild(element);
        });

        downloadLocationSelect.disabled = false;
    } else {
        downloadLocationSelect.value = '';
        downloadLocationSelect.disabled = true;
    }

    const labelSelect = document.querySelector('#labels');

    if (client.clientCapabilities && client.clientCapabilities.includes('label')) {
        labelSelect.disabled = false;
    } else {
        labelSelect.value = '';
        labelSelect.disabled = true;
    }

    if (!client.clientCapabilities || !client.clientCapabilities.includes('paused'))
        document.querySelector('#addpaused').disabled = true;
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector('#server').addEventListener('change', (e) => selectServer(~~e.currentTarget.value));
document.querySelector('#add-torrent').addEventListener('click', (e) => {
    e.preventDefault();

    const params = new URLSearchParams(window.location.search);
    const label = document.querySelector('#labels').value;
    const path = document.querySelector('#downloadLocation').value;
    const addPaused = document.querySelector('#addpaused').checked;
    const server = document.querySelector('#server').value;

    let options = {
        server: parseInt(server, 10),
        paused: addPaused,
        label: null,
        path: null,
    };

    if (label.length)
        options.label = label;

    if (path.length)
        options.path = path;

    chrome.runtime.sendMessage({
        type: 'addTorrent',
        url: params.get('url'),
        tabId: params.has('tabId') ? parseInt(params.get('tabId'), 10) : null,
        options: options
    });

    window.close();
});
