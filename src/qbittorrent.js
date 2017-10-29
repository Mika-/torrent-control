class qBittorrentApi {

    constructor(serverOptions) {
        this.options = serverOptions;
        this.cookie = null;
    }

    logIn() {
        const {hostname, username, password} = this.options

        return new Promise((resolve, reject) => {
            let form = new FormData();
            form.append('username', username);
            form.append('password', password);

            fetch(hostname + 'login', {
                method: 'POST',
                body: form,
                headers: new Headers({
                    'Content-Type': 'application/x-www-form-urlencoded'
                })
            }).then(() => resolve()).catch(() => reject());
        });
    }

    logOut() {
        this.cookie = null;
    }

}
