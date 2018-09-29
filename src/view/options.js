var options;

const serverSelect = document.querySelector('#server-list');

const persistOptions = () => {
    options.globals.showcontextmenu = document.querySelector('#contextmenu').checked;
    options.globals.catchUrls = document.querySelector('#catchurls').checked;

    const labels = document.querySelector('#labels').value.split(/\n/g) || [];
    options.globals.labels = labels.map((label) => label.trim());

    options.servers[~~serverSelect.value] = {
        name: document.querySelector('#name').value,
        application: document.querySelector('#application').value,
        hostname: document.querySelector('#hostname').value.replace(/\s+/, '').replace(/\/?$/, '/'),
        username: document.querySelector('#username').value,
        password: document.querySelector('#password').value
    };

    saveOptions(options);

    document.querySelector('#save-options').classList.add('disabled');
}

const restoreOptions = () => {

    const saveButton = document.querySelector('#save-options');

    document.querySelectorAll('textarea, input, select:not(#server-list)').forEach((element) => {
        element.addEventListener('input', () => {
            saveButton.classList.remove('disabled');
        }, { passive: true });
    });

    document.querySelector('#labels').placeholder = 'Label\nAnother label'.replace(/\\n/g, '\n');

    document.querySelectorAll('[data-i18n]').forEach((element) => {
        element.textContent = browser.i18n.getMessage(element.getAttribute('data-i18n'));
    });

    clientList.forEach((client) => {
        let element = document.createElement('option');
        element.setAttribute('value', client.id);
        element.textContent = client.name;
        document.querySelector('#application').appendChild(element);
    });

    loadOptions().then((newOptions) => {
        options = newOptions;

        document.querySelector('#contextmenu').checked = options.globals.showcontextmenu;
        document.querySelector('#catchurls').checked = options.globals.catchUrls;

        document.querySelector('#labels').value = options.globals.labels.join('\n');

        restoreServerList();
        restoreServer(serverSelect.value);
    });

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
    element.textContent = browser.i18n.getMessage('addServerAction');
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

    document.querySelector('#application').dispatchEvent(new Event('change'));

    if (options.servers.length > 1)
        document.querySelector('#remove-server').classList.remove('disabled');
    else
        document.querySelector('#remove-server').classList.add('disabled');
}

const addServer = () => {
    options.servers.push({
        name: 'New server',
        application: clientList[0].id,
        hostname: '',
        username: '',
        password: ''
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

        if (client.id === 'deluge')
            document.querySelector('#username').setAttribute('disabled', 'true');
        else
            document.querySelector('#username').removeAttribute('disabled');
    }
});
document.querySelector('#hostname').addEventListener('input', (e) => {
    const hostname = e.target.value.replace(/\s+/, '').replace(/\/?$/, '/');

    if (validateUrl(hostname))
        document.querySelector('#hostname').setAttribute('style', '');
    else
        document.querySelector('#hostname').setAttribute('style', 'border-color:red;');
});
