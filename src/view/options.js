function persistOptions(e) {
    e.preventDefault();

    var servers = [];

    servers.push({
        name: 'Default',
        application: document.querySelector('#application').value,
        hostname: document.querySelector('#hostname').value,
        username: document.querySelector('#username').value,
        password: document.querySelector('#password').value
    });

    saveOptions({
        servers: servers
    });
}

function restoreOptions() {

    document.querySelectorAll('[data-i18n]').forEach((element) => {
        element.textContent = browser.i18n.getMessage(element.getAttribute('data-i18n'));
    });

    clientList.forEach((client) => {
        let element = document.createElement('option');
        element.setAttribute('value', client.id);
        element.textContent = client.name;
        document.querySelector('#application').appendChild(element);
    });

    loadOptions().then((options) => {
        const server = options.servers[0];

        document.querySelector('#application').value = server.application;
        document.querySelector('#hostname').value = server.hostname;
        document.querySelector('#username').value = server.username;
        document.querySelector('#password').value = server.password;
    });

}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector('#save-options').addEventListener('click', persistOptions);
