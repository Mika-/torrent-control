import BaseClient from './baseclient.js';

export default class C411RuTorrentApi extends BaseClient {

    constructor(serverSettings) {
        super();

        this.settings = serverSettings;
    }

    logIn() {
        const {username, password, hostname, clientOptions} = this.settings;

        // No authentication provided
        if (!(username && password))
            return Promise.resolve();

        // HTTP Basic Auth
        if (!clientOptions.authType || clientOptions.authType === 'httpAuth') {
            this.addAuthRequiredListener(username, password);

            return Promise.resolve();
        }

        // Form Auth
        return new Promise((resolve, reject) => {
            fetch(hostname, {
                method: 'GET',
                credentials: 'include',
            })
            .then((response) => {
                response.text().then((html) => {
                    const page = (new DOMParser()).parseFromString(html, 'text/html');

                    // Use HTML autocomplete attributes to complete many different login forms
                    // regardless of what they look like
                    const usernameInput = page.querySelector('[autocomplete="username"]');
                    const passwordInput = page.querySelector('[autocomplete="current-password"]');

                    // Failed to detect Form Auth
                    // a. This endpoint does not use Form Auth
                    // b. Form Auth used but already logged in
                    // In both cases, do nothing
                    if (usernameInput === null || passwordInput === null) {
                        resolve();
                        return;
                    }

                    // Populate the username and password fields
                    usernameInput.value = username;
                    passwordInput.value = password;

                    // DOMParser scopes relative to the extension
                    // Inject a base tag saying the scope should be relative to the
                    // login page we fetched
                    const base = page.createElement('base');
                    base.href = response.url;
                    page.head.appendChild(base);

                    // Submit the login form
                    let loginForm = new FormData(passwordInput.form);
                    fetch(passwordInput.form.action, {
                        method: passwordInput.form.method.toUpperCase(),
                        credentials: 'include',
                        body: loginForm,
                    })
                    .then((response) => {
                        // Indicate failure from a bad response code
                        if (response.status >= 400)
                            throw new Error(chrome.i18n.getMessage('loginError'));

                        response.text().then((html) => {
                            const after_login = (new DOMParser()).parseFromString(html, 'text/html');
                            if (after_login.querySelector('[autocomplete="current-password"]')) {
                                // If the next page after logging in is still asking for the password
                                // It's quite likely we failed to login
                                throw new Error(chrome.i18n.getMessage('loginError'));
                            } else{
                                // No more input asking for a password autocomplete
                                // (hopefully) means we logged in successfully
                                resolve();
                            }
                        })
                    })
                    .catch((error) => reject(error));
                })
                .catch((error) => reject(error));
            })
            .catch((error) => reject(error));
        });
    }

    logOut() {
        this.removeEventListeners();

        return Promise.resolve();
    }

    /**
     * Add torrent from C411 URL by downloading the .torrent file and uploading to ruTorrent
     * @param c411Url {string} - C411.org torrent page URL (e.g., https://c411.org/torrents/xxxxx)
     * @param options {object} - Torrent options (paused, path, label, etc.)
     * @returns {Promise<void>}
     */
    addTorrentFromC411(c411Url, options = {}) {
        const {hostname, c411ApiKey, c411SessionCookie} = this.settings;

        return new Promise(async (resolve, reject) => {
            try {
                // Extract torrent infohash from C411 URL
                const match = c411Url.match(/https?:\/\/(?:www\.)?c411\.org\/torrents\/([a-z0-9]+)/i);
                if (!match) {
                    throw new Error('Invalid C411 URL format');
                }
                const infohash = match[1];

                // C411 API download endpoint: /api/torrents/{infohash}/download
                const downloadUrl = `https://c411.org/api/torrents/${infohash}/download`;

                console.log('Downloading torrent from C411 API:', downloadUrl);

                // Build headers with API key and optional session cookie
                const fetchHeaders = {
                    'Accept': 'application/x-bittorrent,application/octet-stream',
                    'X-API-Key': c411ApiKey,
                };
                
                // Add session cookie if provided (for authenticated downloads)
                if (c411SessionCookie) {
                    fetchHeaders['Cookie'] = c411SessionCookie;
                }

                // Fetch the .torrent file from C411 API
                const torrentResponse = await fetch(downloadUrl, {
                    method: 'GET',
                    headers: fetchHeaders,
                });

                // Check if the response is HTML (error page) instead of torrent file
                const contentType = torrentResponse.headers.get('content-type');
                
                if (!torrentResponse.ok) {
                    // Try to get error details from response
                    const errorText = await torrentResponse.text();
                    console.error('C411 error response:', errorText);
                    throw new Error(`Failed to download torrent from C411: ${torrentResponse.status} ${torrentResponse.statusText}. Vérifie que ta clé API est correcte.`);
                }

                if (contentType && !contentType.match(/(application\/x-bittorrent|application\/octet-stream)/gi)) {
                    console.warn('Unexpected content type:', contentType);
                    // If we got HTML instead of a torrent, it's likely an auth error
                    if (contentType.includes('text/html')) {
                        throw new Error('C411 returned HTML instead of torrent file. Vérifie ta clé API et l\'URL du torrent.');
                    }
                }

                const torrentBlob = await torrentResponse.blob();

                // Upload the .torrent file to ruTorrent watch folder
                const {username, password} = this.settings;
                const baseUrl = hostname.replace(/\/$/, '');
                
                // Utiliser le dossier watch par défaut
                const watchFolder = '/home/gmeinga_4612/downloads/watch';
                const fileName = `addon_${Date.now()}.torrent`;
                const fullPath = `${watchFolder}/${fileName}`;

                console.log('[C411+ruTorrent] Écriture dans le dossier watch:', fullPath);

                // Convertir le Blob en ArrayBuffer puis en Base64
                const arrayBuffer = await torrentBlob.arrayBuffer();
                const base64Data = this._arrayBufferToBase64(arrayBuffer);

                // Préparer les données pour l'API filemanager de ruTorrent
                const formData = new FormData();
                formData.append('mode', 'write');
                formData.append('path', fullPath);
                formData.append('content', base64Data);

                // URL de l'API filemanager
                const apiUrl = `${baseUrl}/plugins/filemanager/action.php`;

                console.log('[C411+ruTorrent] Appel API filemanager vers:', apiUrl);

                const uploadResponse = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Basic ' + btoa(`${username}:${password}`)
                    },
                    credentials: 'include',
                    body: formData
                });

                if (!uploadResponse.ok) {
                    const errorText = await uploadResponse.text();
                    console.error('[C411+ruTorrent] Échec de l\'écriture (Status', uploadResponse.status, '):', errorText);
                    throw new Error(`Échec de l'upload vers le dossier watch: ${uploadResponse.status}`);
                }

                console.log('[C411+ruTorrent] Torrent écrit avec succès dans le dossier watch.');
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    addTorrent(torrent, options = {}) {
        // Standard addTorrent method for compatibility - utilise aussi le dossier watch
        return this._writeTorrentToWatch(torrent, options);
    }

    addTorrentToRuTorrent(torrent, options = {}) {
        // Méthode dépréciée - utilise maintenant le dossier watch
        return this._writeTorrentToWatch(torrent, options);
    }

    /**
     * Écrit un fichier .torrent dans le dossier watch de ruTorrent
     * @param {Blob|File} torrent - Le fichier .torrent
     * @param {Object} options - Options supplémentaires
     * @returns {Promise<void>}
     */
    _writeTorrentToWatch(torrent, options = {}) {
        const {hostname, username, password} = this.settings;
        const baseUrl = hostname.replace(/\/$/, '');
        
        // Utiliser le dossier watch par défaut
        const watchFolder = '/home/gmeinga_4612/downloads/watch';
        const fileName = `addon_${Date.now()}.torrent`;
        const fullPath = `${watchFolder}/${fileName}`;

        console.log('[C411+ruTorrent] Écriture dans le dossier watch:', fullPath);

        return new Promise((resolve, reject) => {
            // Convertir le Blob/File en ArrayBuffer puis en Base64
            torrent.arrayBuffer()
                .then(arrayBuffer => {
                    const base64Data = this._arrayBufferToBase64(arrayBuffer);

                    // Préparer les données pour l'API filemanager de ruTorrent
                    const formData = new FormData();
                    formData.append('mode', 'write');
                    formData.append('path', fullPath);
                    formData.append('content', base64Data);

                    // URL de l'API filemanager
                    const apiUrl = `${baseUrl}/plugins/filemanager/action.php`;

                    console.log('[C411+ruTorrent] Appel API filemanager vers:', apiUrl);

                    return fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Basic ' + btoa(`${username}:${password}`)
                        },
                        credentials: 'include',
                        body: formData
                    });
                })
                .then(response => {
                    if (!response.ok) {
                        return response.text().then(errorText => {
                            console.error('[C411+ruTorrent] Échec de l\'écriture (Status', response.status, '):', errorText);
                            throw new Error(`Échec de l'upload vers le dossier watch: ${response.status}`);
                        });
                    }
                    console.log('[C411+ruTorrent] Torrent écrit avec succès dans le dossier watch.');
                    resolve();
                })
                .catch(error => reject(error));
        });
    }

    /**
     * Convertit un ArrayBuffer en chaîne Base64
     * @param {ArrayBuffer} buffer 
     * @returns {string}
     */
    _arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    addTorrentUrl(url, options = {}) {
        const {hostname, username, password} = this.settings;

        let params = new URLSearchParams();
        params.append('json', '1');
        params.append('url', url);

        if (options.paused)
            params.append('torrents_start_stopped', options.paused.toString());

        if (options.path)
            params.append('dir_edit', options.path);

        if (options.label)
            params.append('label', options.label);

        if (options.fast_resume)
            params.append('fast_resume', '1');

        // Construire l'URL avec authentification intégrée
        const baseUrl = hostname.replace(/\/$/, '');
        const urlObj = new URL(baseUrl);
        urlObj.username = encodeURIComponent(username);
        urlObj.password = encodeURIComponent(password);
        const uploadUrl = `${urlObj.toString()}/php/addtorrent.php?` + params.toString();

        console.log('[C411+ruTorrent] Add URL vers:', uploadUrl.replace(/:[^:@]*@/, ':***@'));

        return new Promise((resolve, reject) => {
            fetch(uploadUrl, {
                method: 'GET',
                credentials: 'include'
            })
            .then(this.parseJsonResponse)
            .then((json) => {
                if (json.result && json.result === 'Success')
                    resolve();
                else
                    throw new Error(chrome.i18n.getMessage('torrentAddError', json.result || ''));
            })
            .catch((error) => reject(error));
        });
    }

    addRssFeed(url) {
        const {hostname, username, password} = this.settings;

        return new Promise((resolve, reject) => {
            let form = new FormData();
            form.append('mode', 'add');
            form.append('url', url);
            form.append('label', '');

            // Construire l'URL avec authentification intégrée
            const baseUrl = hostname.replace(/\/$/, '');
            const urlObj = new URL(baseUrl);
            urlObj.username = encodeURIComponent(username);
            urlObj.password = encodeURIComponent(password);
            const uploadUrl = `${urlObj.toString()}/plugins/rss/action.php`;

            console.log('[C411+ruTorrent] RSS Feed vers:', uploadUrl.replace(/:[^:@]*@/, ':***@'));

            fetch(uploadUrl, {
                method: 'POST',
                credentials: 'include',
                body: form
            })
            .then(this.parseJsonResponse)
            .then((json) => {
                if (json.errors.length === 0)
                    resolve();
                else
                    throw new Error(chrome.i18n.getMessage('rssFeedAddError', json.result || ''));
            })
            .catch((error) => reject(error));
        });
    }
}
