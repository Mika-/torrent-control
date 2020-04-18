import BaseClient from './baseclient'
import {ServerOptions} from "../util";

export default class VuzeWebUIApi extends BaseClient {
    settings: ServerOptions & {
        apiVersion: number;
    };
    cookie?: string;

    constructor(serverSettings) {
        super();

        this.settings = {
            apiVersion: 2,
            ...serverSettings
        };
        this.cookie = null;
    }

    logIn() {
        const {username, password} = this.settings;

        if (username && password)
            this.addAuthRequiredListener(username, password);

        return Promise.resolve();
    }

    logOut() {
        this.removeEventListeners();

        return Promise.resolve();
    }

    addTorrent(torrent, options): Promise<void> {
        const {hostname} = this.settings;

        return new Promise((resolve, reject) => {
            
            var empty_file = new File([''], '');
            
            let form = new FormData();
            form.append('upfile_1', empty_file, '');
            form.append('upfile_0', torrent, 'temp.torrent');

            fetch(hostname + 'index.tmpl?d=u&local=1', {
                method: 'POST',
                credentials: 'include',
                body: form
            })
            .then((response) => {
                if (response.ok)
                    return resolve();
                else if (response.status === 400)
                    throw new Error(chrome.i18n.getMessage('torrentAddError'));
                else if (response.status === 401)
                    throw new Error(chrome.i18n.getMessage('loginError'));
                else
                    throw new Error(chrome.i18n.getMessage('apiError', response.status.toString() + ': ' + response.statusText));
            })
            .catch((error) => reject(error));
        });
    }

    addTorrentUrl(url, options): Promise<void> {
        const {hostname, apiVersion} = this.settings;
        const addTorrentURLPath = (apiVersion === 2) ? 'index.ajax' : 'index.tmpl';

        return new Promise((resolve, reject) => {
            fetch(hostname + addTorrentURLPath + '?d=u&upurl=' + encodeURIComponent(url), {
                method: 'GET',
                credentials: 'include'
            })
            .then((response) => {
                if (response.ok)
                    return resolve();
                else if (response.status === 400)
                    throw new Error(chrome.i18n.getMessage('torrentAddError'));
                else if (response.status === 401)
                    throw new Error(chrome.i18n.getMessage('loginError'));
                else
                    throw new Error(chrome.i18n.getMessage('apiError', response.status.toString() + ': ' + response.statusText));
            })
            .catch((error) => reject(error));
        });
    }

}
