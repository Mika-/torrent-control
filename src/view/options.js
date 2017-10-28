function saveOptions(e) {
    e.preventDefault();

    var servers = [];

    servers.push({
        name: 'Default',
        application: document.querySelector('#application').value,
        hostname: document.querySelector('#hostname').value,
        username: document.querySelector('#username').value,
        password: document.querySelector('#password').value
    });

    browser.storage.sync.set({
        servers: servers
    }, () => window.close());
}

function restoreOptions() {

    browser.storage.sync.get({
        servers: [
            {
                name: 'Default',
                application: 'qbittorrent',
                server: '',
                username: '',
                password: ''
            }
        ]
    }, (items) => {
        var server = items.servers[0];
        document.querySelector('#application').value = server.application;
        document.querySelector('#hostname').value = server.hostname;
        document.querySelector('#username').value = server.username;
        document.querySelector('#password').value = server.password;
    });

}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector('#save-options').addEventListener('submit', saveOptions);
