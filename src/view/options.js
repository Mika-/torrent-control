import {
    clientList,
    loadOptions,
    saveOptions,
} from '../util';

var options;

const serverSelect = document.querySelector('#server-list');
const saveButton = document.querySelector('#save-options');

const isLabelsSupported = (servers) => servers.some((server) => {
    const client = clientList.find((client) => client.id === server.application);

    if (client && client.torrentOptions && client.torrentOptions.includes('label')) {
        return true;
    }
    return false;
});

const persistOptions = () => {
    options.globals.contextMenu = ~~document.querySelector('[name="contextmenu"]:checked').value;
    options.globals.catchUrls = document.querySelector('#catchurls').checked;
    options.globals.addPaused = document.querySelector('#addpaused').checked;
    options.globals.addAdvanced = document.querySelector('#addadvanced').checked;
    options.globals.enableNotifications = document.querySelector('#enablenotifications').checked;

    const labels = document.querySelector('#labels').value.split(/\n/g) || [];
    options.globals.labels = labels.map((label) => label.trim()).filter((label) => label.length);

    const directories = document.querySelector('#directories').value.split(/\n/g) || [];

    let clientOptions = {};
    Array.from(document.querySelectorAll('*[id^="clientOptions"]')).forEach((element) => {
        clientOptions[element.id.match(/\[(.+?)]$/)[1]] = element.checked;
    });

    options.servers[~~serverSelect.value] = {
        name: document.querySelector('#name').value,
        application: document.querySelector('#application').value,
        hostname: document.querySelector('#hostname').value.replace(/\s+/, '').replace(/\/?$/, '/'),
        username: document.querySelector('#username').value,
        password: document.querySelector('#password').value,
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

    document.querySelector('#labels').placeholder = 'Label\nAnother label'.replace(/\\n/g, '\n');
    document.querySelector('#directories').placeholder = '/home/user/downloads\n/data/incomplete'.replace(/\\n/g, '\n');

    document.querySelectorAll('[data-i18n]').forEach((element) => {
        element.textContent = chrome.i18n.getMessage(element.getAttribute('data-i18n'));
    });

    clientList.forEach((client) => {
        let element = document.createElement('option');
        element.setAttribute('value', client.id);
        element.textContent = client.name;
        document.querySelector('#application').appendChild(element);
    });

    loadOptions().then((newOptions) => {
        options = newOptions;

        document.querySelector('[name="contextmenu"][value="' + options.globals.contextMenu + '"]').checked = true;
        document.querySelector('#catchurls').checked = options.globals.catchUrls;
        document.querySelector('#addpaused').checked = options.globals.addPaused;
        document.querySelector('#addadvanced').checked = options.globals.addAdvanced;
        document.querySelector('#enablenotifications').checked = options.globals.enableNotifications;

        document.querySelector('#labels').value = options.globals.labels.join('\n');

        restoreServerList();
        restoreServer(serverSelect.value);
    });

    saveButton.setAttribute('disabled', 'true');
}

const restoreServerList = () => {
    const selectedServer = serverSelect.value || 0;
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

    document.querySelector('#name').value = server.name;
    document.querySelector('#application').value = server.application;
    document.querySelector('#hostname').value = server.hostname;
    document.querySelector('#username').value = server.username;
    document.querySelector('#password').value = server.password;
    document.querySelector('#directories').value = server.directories.join('\n');

    document.querySelector('#application').dispatchEvent(new Event('change'));

    if (options.servers.length > 1)
        document.querySelector('#remove-server').removeAttribute('disabled');
    else
        document.querySelector('#remove-server').setAttribute('disabled', 'true');
}

const addServer = () => {
    options.servers.push({
        name: 'New server',
        application: clientList[0].id,
        hostname: '',
        username: '',
        password: '',
        directories: []
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
        const url = new URL(str);
    } catch (e) {
        return false;
    }
    return true;
}

serverSelect.addEventListener('change', (e) => e.target.value === 'add' ? addServer() : restoreServer(e.target.value));
document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector('#remove-server').addEventListener('click', (e) => {
    e.preventDefault();
    removeServer(serverSelect.value);
    restoreServerList();
});
document.querySelector('#save-options').addEventListener('click', (e) => {
    e.preventDefault();

    const hostname = document.querySelector('#hostname').value.replace(/\s+/, '').replace(/\/?$/, '/');

    if (validateUrl(hostname)) {
        persistOptions();
        restoreServerList();
    } else {
        alert('Server address is invalid');
    }
});
document.querySelector('#application').addEventListener('change', (e) => {
    const client = clientList.find((client) => client.id === e.target.value);

    if (client) {
        document.querySelector('#hostname').setAttribute('placeholder', client.addressPlaceholder);

        const currentAddress = document.querySelector('#hostname').value;

        if (currentAddress === '' || clientList.find((client) => client.addressPlaceholder === currentAddress))
            document.querySelector('#hostname').value = client.addressPlaceholder;

        document.querySelector('[data-panel="directories"]').style.display =
            client.torrentOptions && client.torrentOptions.includes('path') ? 'flex' : 'none';

        document.querySelector('[data-panel="labels"]').style.display =
            isLabelsSupported(options.servers) || (client.torrentOptions && client.torrentOptions.includes('label')) ? 'flex' : 'none';

        if (client.id === 'deluge')
            document.querySelector('#username').setAttribute('disabled', 'true');
        else
            document.querySelector('#username').removeAttribute('disabled');

        let clientOptionsPanel = document.querySelector('[data-panel="clientOptions"]');
        Array.from(clientOptionsPanel.childNodes).forEach((element) =>
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
document.querySelector('#hostname').addEventListener('input', (e) => {
    const hostname = e.target.value.replace(/\s+/, '').replace(/\/?$/, '/');

    if (validateUrl(hostname))
        document.querySelector('#hostname').setAttribute('style', '');
    else
        document.querySelector('#hostname').setAttribute('style', 'border-color:red;');
});
