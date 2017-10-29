class qBittorrentApi {

    constructor(serverOptions) {
        this.options = serverOptions;
        this.cookie = null;
    }

    logIn() {
        const {hostname, username, password} = this.options;

        return new Promise((resolve, reject) => {
            let form = new FormData();
            form.append('username', username);
            form.append('password', password);

            fetch(hostname + 'login', {
                method: 'POST',
                body: form
            })
            .then((response) => {
                if (response.ok)
                    resolve();
                else
                    reject('Failed to login (' + response.status + ' ' + response.statusText + ')');
            })
            .catch((error) => reject(error));
        });
    }

    logOut() {
        this.cookie = null;
    }

}
