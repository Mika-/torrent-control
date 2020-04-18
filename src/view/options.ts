import {
    clientList,
    Options,
    loadOptions,
    saveOptions,
} from '../util';

let options: Options;

const getInputElement = (selector: string) => (<HTMLInputElement>document.querySelector(selector));
const getInputElements = (selector: string) => (<HTMLInputElement[]><unknown>document.querySelectorAll(selector));

const serverSelect = getInputElement('#server-list');
const saveButton = getInputElement('#save-options');

const isLabelsSupported = (servers) => servers.some((server) => {
    const client = clientList.find((client) => client.id === server.application);

    return !!(client && client.torrentOptions && client.torrentOptions.includes('label'));
});

const persistOptions = () => {
    options.globals.contextMenu = ~~getInputElement('[name="contextmenu"]:checked').value;
    options.globals.catchUrls = getInputElement('#catchurls').checked;
    options.globals.addPaused = getInputElement('#addpaused').checked;
    options.globals.addAdvanced = getInputElement('#addadvanced').checked;
    options.globals.enableNotifications = getInputElement('#enablenotifications').checked;

    const labels = getInputElement('#labels').value.split(/\n/g) || [];
    options.globals.labels = labels.map((label) => label.trim()).filter((label) => label.length);

    const directories = getInputElement('#directories').value.split(/\n/g) || [];

    let clientOptions = {};
    Array.from(getInputElements('*[id^="clientOptions"]')).forEach((element) => {
        clientOptions[element.id.match(/\[(.+?)]$/)[1]] = element.checked;
    });

    options.servers[~~serverSelect.value] = {
        name: getInputElement('#name').value,
        application: getInputElement('#application').value,
        hostname: getInputElement('#hostname').value.replace(/\s+/, '').replace(/\/?$/, '/'),
        username: getInputElement('#username').value,
        password: getInputElement('#password').value,
        directories: directories.map((directory) => directory.trim()).filter((directory) => directory.length),
        clientOptions: clientOptions
    };

    saveOptions(options);

    saveButton.setAttribute('disabled', 'true');
}

const restoreOptions = () => {
    document.querySelectorAll('textarea, input, select:not(#server-list)').forEach((element) => {
        element.addEventListener('input', () => {
            saveButton.removeAttribute('disabled');
        }, { passive: true });
    });

    (<HTMLInputElement> getInputElement('#labels')).placeholder = 'Label\nAnother label'.replace(/\\n/g, '\n');
    (<HTMLInputElement> getInputElement('#directories')).placeholder = '/home/user/downloads\n/data/incomplete'.replace(/\\n/g, '\n');

    document.querySelectorAll('[data-i18n]').forEach((element) => {
        element.textContent = chrome.i18n.getMessage(element.getAttribute('data-i18n'));
    });

    clientList.forEach((client) => {
        let element = document.createElement('option');
        element.setAttribute('value', client.id);
        element.textContent = client.name;
        getInputElement('#application').appendChild(element);
    });

    loadOptions().then((newOptions: Options) => {
        options = newOptions;

        getInputElement('[name="contextmenu"][value="' + options.globals.contextMenu + '"]').checked = true;
        getInputElement('#catchurls').checked = options.globals.catchUrls;
        getInputElement('#addpaused').checked = options.globals.addPaused;
        getInputElement('#addadvanced').checked = options.globals.addAdvanced;
        getInputElement('#enablenotifications').checked = options.globals.enableNotifications;

        getInputElement('#labels').value = options.globals.labels.join('\n');

        restoreServerList();
        restoreServer(serverSelect.value);
    });

    saveButton.setAttribute('disabled', 'true');
}

const restoreServerList = () => {
    const selectedServer = serverSelect.value || '0';
    serverSelect.innerHTML = '';

    options.servers.forEach((server, id) => {
        let element = document.createElement('option');
        element.setAttribute('value', id.toString());
        element.textContent = server.name;
        serverSelect.appendChild(element);
    });

    let element = document.createElement('option');
    element.setAttribute('value', 'add');
    element.textContent = chrome.i18n.getMessage('addServerAction');
    serverSelect.appendChild(element);

    serverSelect.value = selectedServer;
}

const restoreServer = (id) => {
    const server = options.servers[~~id];
    serverSelect.value = id;
    options.globals.currentServer = ~~id;
    saveOptions(options);

    getInputElement('#name').value = server.name;
    getInputElement('#application').value = server.application;
    getInputElement('#hostname').value = server.hostname;
    getInputElement('#username').value = server.username;
    getInputElement('#password').value = server.password;
    getInputElement('#directories').value = server.directories.join('\n');

    getInputElement('#application').dispatchEvent(new Event('change'));

    if (options.servers.length > 1)
        getInputElement('#remove-server').removeAttribute('disabled');
    else
        getInputElement('#remove-server').setAttribute('disabled', 'true');
}

const addServer = () => {
    options.servers.push({
        name: 'New server',
        application: clientList[0].id,
        hostname: '',
        username: '',
        password: '',
        directories: <string[]>[]
    });

    restoreServerList();
    restoreServer(options.servers.length - 1);
    persistOptions();
}

const removeServer = (id) => {
    if (options.servers.length > 1)
        options.servers.splice(~~id, 1);

    if (options.globals.currentServer === ~~id)
        options.globals.currentServer = 0;

    restoreServerList();
    restoreServer(0);
    persistOptions();
}

const validateUrl = (str) => {
    try {
        new URL(str);
    } catch (e) {
        return false;
    }
    return true;
}

serverSelect.addEventListener('change', (e) => (<HTMLInputElement>e.target).value === 'add' ? addServer() : restoreServer((<HTMLInputElement>e.target).value));
document.addEventListener('DOMContentLoaded', restoreOptions);
getInputElement('#remove-server').addEventListener('click', (e) => {
    e.preventDefault();
    removeServer(serverSelect.value);
    restoreServerList();
});
getInputElement('#save-options').addEventListener('click', (e) => {
    e.preventDefault();

    const hostname = getInputElement('#hostname').value.replace(/\s+/, '').replace(/\/?$/, '/');

    if (validateUrl(hostname)) {
        persistOptions();
        restoreServerList();
    } else {
        alert('Server address is invalid');
    }
});
getInputElement('#application').addEventListener('change', (e) => {
    const client = clientList.find((client) => client.id === (<HTMLInputElement>e.target).value);

    if (client) {
        getInputElement('#hostname').setAttribute('placeholder', client.addressPlaceholder);

        const currentAddress = getInputElement('#hostname').value;

        if (currentAddress === '' || clientList.find((client) => client.addressPlaceholder === currentAddress))
            getInputElement('#hostname').value = client.addressPlaceholder;

        getInputElement('[data-panel="directories"]').style.display =
            client.torrentOptions && client.torrentOptions.includes('path') ? 'flex' : 'none';

        getInputElement('[data-panel="labels"]').style.display =
            isLabelsSupported(options.servers) || (client.torrentOptions && client.torrentOptions.includes('label')) ? 'flex' : 'none';

        if (client.id === 'deluge')
            getInputElement('#username').setAttribute('disabled', 'true');
        else
            getInputElement('#username').removeAttribute('disabled');

        let clientOptionsPanel = getInputElement('[data-panel="clientOptions"]');
        Array.from(clientOptionsPanel.childNodes).forEach((element: HTMLOptionElement) =>
            element.parentNode.removeChild(element));

        if (client.clientOptions) {
            const server = options.servers[options.globals.currentServer];

            client.clientOptions.forEach((option) => {
                let container = document.createElement('div');
                container.className = 'panel-formElements-item browser-style';

                let input = document.createElement('input');
                input.type = 'checkbox';
                input.id = 'clientOptions[' + option.name + ']';
                input.checked = server.application === client.id ? !!server.clientOptions[option.name] : false;
                input.addEventListener('input', () => {
                    saveButton.removeAttribute('disabled');
                }, { passive: true });
                container.appendChild(input);

                let label = document.createElement('label');
                label.htmlFor = 'clientOptions[' + option.name + ']';
                label.textContent = option.description;
                container.appendChild(label);

                clientOptionsPanel.appendChild(container);
            });
        }
    }
});
getInputElement('#hostname').addEventListener('input', (e) => {
    const hostname = (<HTMLInputElement>e.target).value.replace(/\s+/, '').replace(/\/?$/, '/');

    if (validateUrl(hostname))
        getInputElement('#hostname').setAttribute('style', '');
    else
        getInputElement('#hostname').setAttribute('style', 'border-color:red;');
});
