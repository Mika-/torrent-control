import {
    clientList,
    Options,
    TorrentOptions,
    loadOptions,
} from '../util';

const getInputElement = (selector: string) => (<HTMLInputElement>document.querySelector(selector));
const getInputElements = (selector: string) => (<HTMLInputElement[]><unknown>document.querySelectorAll(selector));

const restoreOptions = () => {
    const params = new URLSearchParams(window.location.search);
    getInputElement('#url').value = params.get('url');

    getInputElements('[data-i18n]').forEach((element) => {
        element.textContent = chrome.i18n.getMessage(element.getAttribute('data-i18n'));
    });

    loadOptions().then((options: Options) => {
        const serverOptions = options.servers[options.globals.currentServer];
        const client = clientList.find((client) => client.id === serverOptions.application);

        getInputElement('#addpaused').checked = options.globals.addPaused;

        if (client.torrentOptions && client.torrentOptions.includes('path')) {
            serverOptions.directories.forEach((directory) => {
                let element = document.createElement('option');
                element.setAttribute('value', directory);
                element.textContent = directory;
                getInputElement('#downloadLocation').appendChild(element);
            });
        } else {
            getInputElement('#downloadLocation').disabled = true;
        }

        if (client.torrentOptions && client.torrentOptions.includes('label')) {
            options.globals.labels.forEach((label) => {
                let element = document.createElement('option');
                element.setAttribute('value', label);
                element.textContent = label;
                getInputElement('#labels').appendChild(element);
            });
        } else {
            getInputElement('#labels').disabled = true;
        }

        if (!client.torrentOptions || !client.torrentOptions.includes('paused'))
            getInputElement('#addpaused').disabled = true;
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);

getInputElement('#add-torrent').addEventListener('click', (e) => {
    e.preventDefault();

    const params = new URLSearchParams(window.location.search);
    const label = getInputElement('#labels').value;
    const path = getInputElement('#downloadLocation').value;
    const addPaused = getInputElement('#addpaused').checked;

    let options: TorrentOptions = {
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
