var options;


const persistOptions = () => {
    options.globals.showcontextmenu = document.querySelector('#contextmenu').checked;

    let hostname = document.querySelector('#hostname').value.replace(/\s+/, '');

    if (hostname !== '')
        hostname = hostname.replace(/\/?$/, '/');

    options.servers[0] = {
        name: document.querySelector('#name').value,
        application: document.querySelector('#application').value,
        hostname: hostname,
        username: document.querySelector('#username').value,
        password: document.querySelector('#password').value
    };

    saveOptions(options);

    document.querySelector('#save-options').classList.add('disabled');
}

const restoreOptions = () => {

    const saveButton = document.querySelector('#save-options');

    document.querySelectorAll('input, select').forEach((element) => {
        element.addEventListener('input', () => {
            saveButton.classList.remove('disabled');
        }, { passive: true });
    });

    document.querySelectorAll('[data-i18n]').forEach((element) => {
        element.textContent = browser.i18n.getMessage(element.getAttribute('data-i18n'));
    });

    clientList.forEach((client) => {
        let element = document.createElement('option');
        element.setAttribute('value', client.id);
        element.textContent = client.name;
        document.querySelector('#application').appendChild(element);
    });

        const globals = options.globals;
        const server = options.servers[globals.currentServer];
    loadOptions().then((newOptions) => {
        options = newOptions;

        document.querySelector('#contextmenu').checked = options.globals.showcontextmenu;

        document.querySelector('#contextmenu').checked = globals.showcontextmenu;

        document.querySelector('#name').value = server.name;
        document.querySelector('#application').value = server.application;
        document.querySelector('#hostname').value = server.hostname;
        document.querySelector('#username').value = server.username;
        document.querySelector('#password').value = server.password;

        document.querySelector('#application').dispatchEvent(new Event('change'));
    });

}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector('#save-options').addEventListener('click', (e) => {
    e.preventDefault();
    persistOptions();
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
