import {
    clientList,
    whitelist,
    loadOptions,
    saveOptions,
    regExpFromString,
} from '../util.js';

var options;

const serverSelect = document.querySelector('#server-list');
const saveButton = document.querySelector('#save-options');
/** @type {HTMLSelectElement} */
const defaultLabelSelect = document.querySelector('#defaultLabel');
/** @type {HTMLSelectElement} */
const defaultDirectorySelect = document.querySelector('#defaultDirectory');

/**
 * @param {string[]} labels
 */
function refreshDefaultLabelSelect(labels) {
    const startingValue = defaultLabelSelect.value;

    for (let i = defaultLabelSelect.options.length - 1; i >= 1; i--) {
        defaultLabelSelect.remove(i);
    }

    const cleanLabels = labels
        .map((label) => label.trim())
        .filter((label) => label.length > 0);

    for (const label of cleanLabels) {
        let element = document.createElement('option');
        element.setAttribute('value', label);
        element.textContent = label;
        defaultLabelSelect.appendChild(element);
    }

    if (cleanLabels.includes(startingValue)) {
        defaultLabelSelect.value = startingValue;
    }
}

/**
 * @param {string[]} directories
 */
function refreshDefaultDirectorySelect(directories) {
    const startingValue = defaultDirectorySelect.value;

    for (let i = defaultDirectorySelect.options.length - 1; i >= 1; i--) {
        defaultDirectorySelect.remove(i);
    }

    const cleanDirectories = directories
        .map((directory) => directory.trim())
        .filter((directory) => directory.length > 0);

    for (const directory of cleanDirectories) {
        let element = document.createElement('option');
        element.setAttribute('value', directory);
        element.textContent = directory;
        defaultDirectorySelect.appendChild(element);
    }

    if (cleanDirectories.includes(startingValue)) {
        defaultDirectorySelect.value = startingValue;
    }
}

const isLabelsSupported = (servers) => servers.some((server) => {
    const client = clientList.find((client) => client.id === server.application);

    if (client && client.clientCapabilities && client.clientCapabilities.includes('label')) {
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

    options.globals.matchRegExp = getRegExps().map((regExp) => regExp.toString());

    const labels = document.querySelector('#labels').value.split(/\n/g) || [];
    options.globals.labels = labels.map((label) => label.trim()).filter((label) => label.length);

    const directories = document.querySelector('#directories').value.split(/\n/g) || [];

    let clientOptions = {};
    Array.from(document.querySelectorAll('*[id^="clientOptions"]')).forEach((element) => {
        if (element.tagName.toLowerCase() === 'select') {
            clientOptions[element.id.match(/\[(.+?)]$/)[1]] = element.value;
        } else {
            clientOptions[element.id.match(/\[(.+?)]$/)[1]] = element.checked;
        }
    });

    const client = clientList.find((client) => client.id === document.querySelector('#application').value);

    let httpAuth = null;
    if (document.querySelector('#httpAuth').checked && client && client.clientCapabilities && !client.clientCapabilities.includes('httpAuth')) {
        httpAuth = {
            username: document.querySelector('#httpAuthUsername').value.trim(),
            password: document.querySelector('#httpAuthPassword').value.trim()
        };
    }

    options.servers[~~serverSelect.value] = {
        name: document.querySelector('#name').value,
        application: document.querySelector('#application').value,
        hostname: document.querySelector('#hostname').value.replace(/\s+/, '').replace(/\/?$/, '/'),
        username: document.querySelector('#username').value,
        password: document.querySelector('#password').value,
        directories: directories.map((directory) => directory.trim()).filter((directory) => directory.length),
        clientOptions: clientOptions,
        httpAuth: httpAuth,
        defaultLabel: document.querySelector('#defaultLabel').value || null,
        defaultDirectory: document.querySelector('#defaultDirectory').value || null,
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

    document.querySelector('#matchregexp').placeholder = '/^https:\\/\\/example\\.com\\/torrent\\/\\d+\\/download\\/$/'.replace(/\\n/g, '\n');
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

        document.querySelector('#matchregexp').value = options.globals.matchRegExp.join('\n');
        document.querySelector('#matchregexp').disabled = options.globals.catchUrls === false;
        document.querySelector('#labels').value = options.globals.labels.join('\n');

        refreshDefaultLabelSelect(options.globals.labels);

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

    refreshDefaultDirectorySelect(server.directories);

    document.querySelector('#name').value = server.name;
    document.querySelector('#application').value = server.application;
    document.querySelector('#hostname').value = server.hostname;
    document.querySelector('#username').value = server.username;
    document.querySelector('#password').value = server.password;
    document.querySelector('#directories').value = server.directories.join('\n');
    document.querySelector('#defaultLabel').value = server.defaultLabel || '';
    document.querySelector('#defaultDirectory').value = server.defaultDirectory || '';

    if (server.httpAuth) {
        document.querySelector('#httpAuth').checked = true;
        document.querySelector('#httpAuthUsername').disabled = false;
        document.querySelector('#httpAuthUsername').value = server.httpAuth.username;
        document.querySelector('#httpAuthPassword').disabled = false;
        document.querySelector('#httpAuthPassword').value = server.httpAuth.password;
    } else {
        document.querySelector('#httpAuth').checked = false;
        document.querySelector('#httpAuthUsername').disabled = true;
        document.querySelector('#httpAuthUsername').value = '';
        document.querySelector('#httpAuthPassword').disabled = true;
        document.querySelector('#httpAuthPassword').value = '';
    }

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

const getRegExps = () => {
    const matchRegExp = document.querySelector('#matchregexp').value.split(/\n/g) || [];
    return matchRegExp
        .map((regExpStr) => regExpStr.trim())
        .filter((regExpStr) => regExpStr.length)
        .map((regExpStr) => regExpFromString(regExpStr));
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
document.querySelector('#catchurls').addEventListener('change', (e) => {
    document.querySelector('#matchregexp').disabled = e.target.checked === false;
});
document.querySelector('#httpAuth').addEventListener('change', (e) => {
    document.querySelector('#httpAuthUsername').disabled = !e.currentTarget.checked;
    document.querySelector('#httpAuthPassword').disabled = !e.currentTarget.checked;
});
document.querySelector('#labels').addEventListener('change', (e) => {
    refreshDefaultLabelSelect(e.currentTarget.value.split('\n'));
});
document.querySelector('#directories').addEventListener('change', (e) => {
    refreshDefaultDirectorySelect(e.currentTarget.value.split('\n'));
});
document.querySelector('#test-regexp').addEventListener('click', (e) => {
    const testUrl = document.querySelector('#test-regexp-url').value.trim();

    if (testUrl.length === 0) {
        return;
    }

    const regExps = getRegExps().concat(whitelist);
    const matchingRegExp = regExps.find((regExp) => regExp.exec(testUrl) !== null) || null;

    document.querySelector('#test-regexp-result').textContent = matchingRegExp ?
        chrome.i18n.getMessage('testSuccessText', matchingRegExp.toString()) : chrome.i18n.getMessage('testFailText');
});
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

        const hasPathSupport = client.clientCapabilities && client.clientCapabilities.includes('path');
        document.querySelector('[data-panel="directories"]').style.display = hasPathSupport ? 'flex' : 'none';
        document.querySelector('[data-panel="defaultDirectory"]').style.display = hasPathSupport ? 'flex' : 'none';

        const hasLabelSupport = client.clientCapabilities && client.clientCapabilities.includes('label');
        document.querySelector('[data-panel="labels"]').style.display = isLabelsSupported(options.servers) || hasLabelSupport ? 'flex' : 'none';
        document.querySelector('[data-panel="defaultLabel"]').style.display = hasLabelSupport ? 'flex' : 'none';

        if (client.clientCapabilities && !client.clientCapabilities.includes('httpAuth')) {
            document.querySelector('[data-panel="httpAuth"]').style.display = 'flex';
        } else {
            document.querySelector('[data-panel="httpAuth"]').style.display = 'none';
        }

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

                let input;
                if (option.values) {
                    input = document.createElement('select');
                    input.className = 'browser-style';
                    input.id = 'clientOptions[' + option.name + ']';

                    for (const [value, description] of Object.entries(option.values)) {
                        let optionEl = document.createElement('option');
                        optionEl.value = value;
                        optionEl.textContent = description;
                        optionEl.selected = server.clientOptions[option.name] === value;
                        input.appendChild(optionEl);
                    }
                } else {
                    input = document.createElement('input');
                    input.type = 'checkbox';
                    input.id = 'clientOptions[' + option.name + ']';
                    input.checked = server.application === client.id ? !!server.clientOptions[option.name] : false;
                }

                input.addEventListener('input', () => {
                    saveButton.removeAttribute('disabled');
                }, { passive: true });

                if (!option.values) {
                    container.appendChild(input);
                }

                let label = document.createElement('label');
                label.htmlFor = 'clientOptions[' + option.name + ']';
                label.textContent = option.description;
                container.appendChild(label);

                if (option.values) {
                    container.appendChild(input);
                }

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
