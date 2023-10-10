import CloudTorrentApi from './lib/cloudtorrent.js';
import DelugeApi from './lib/deluge.js';
import FloodApi from './lib/flood.js';
import qBittorrentApi from './lib/qbittorrent.js';
import ruTorrentApi from './lib/rutorrent.js';
import TixatiApi from './lib/tixati.js';
import TransmissionApi from './lib/transmission.js';
import tTorrentApi from './lib/ttorrent.js';
import uTorrentApi from './lib/utorrent.js';
import VuzeWebUIApi from './lib/vuze_webui.js';

export const clientList = [
    {
        id: 'biglybt',
        name: 'BiglyBT',
        addressPlaceholder: 'http://127.0.0.1:9091/',
        clientCapabilities: ['paused', 'path', 'httpAuth']
    },
    {
        id: 'cloudtorrent',
        name: 'Cloud Torrent',
        addressPlaceholder: 'http://127.0.0.1:3000/',
        clientCapabilities: ['httpAuth']
    },
    {
        id: 'deluge',
        name: 'Deluge Web UI',
        addressPlaceholder: 'http://127.0.0.1:8112/',
        clientCapabilities: ['paused', 'label', 'path']
    },
    {
        id: 'flood',
        name: 'Flood',
        addressPlaceholder: 'http://127.0.0.1:3000/',
        clientCapabilities: ['paused', 'label', 'path']
    },
    {
        id: 'rutorrent',
        name: 'ruTorrent',
        addressPlaceholder: 'http://127.0.0.1:80/',
        clientCapabilities: ['paused', 'label', 'path', 'rss', 'httpAuth'],
        clientOptions: [
            {
                name: 'authType',
                description: chrome.i18n.getMessage('authTypeOption'),
                values: {
                    'httpAuth': chrome.i18n.getMessage('authTypeHttpAuthOption'),
                    'loginForm': chrome.i18n.getMessage('authTypeLoginFormOption'),
                }
            },
            {
                name: 'fast_resume',
                description: chrome.i18n.getMessage('skipHashCheckOption')
            }
        ]
    },
    {
        id: 'tixati',
        name: 'Tixati',
        addressPlaceholder: 'http://127.0.0.1:8888/',
        clientCapabilities: ['paused', 'httpAuth']
    },
    {
        id: 'transmission',
        name: 'Transmission',
        addressPlaceholder: 'http://127.0.0.1:9091/',
        clientCapabilities: ['paused', 'label', 'path', 'httpAuth']
    },
    {
        id: 'ttorrent',
        name: 'tTorrent',
        addressPlaceholder: 'http://127.0.0.1:1080/',
        clientCapabilities: ['httpAuth']
    },
    {
        id: 'utorrent',
        name: 'µTorrent',
        addressPlaceholder: 'http://127.0.0.1:8112/gui/'
    },
    {
        id: 'vuze_remoteui',
        name: 'Vuze Web Remote',
        addressPlaceholder: 'http://127.0.0.1:9091/',
        clientCapabilities: ['paused', 'path', 'httpAuth']
    },
    {
        id: 'vuze_webui',
        name: 'Vuze HTML Web UI',
        addressPlaceholder: 'http://127.0.0.1:6886/',
        clientCapabilities: ['httpAuth']
    },
    {
        id: 'vuze_webui_100',
        name: 'Vuze HTML Web UI (<1.0.0)',
        addressPlaceholder: 'http://127.0.0.1:6886/'
    },
    {
        id: 'qbittorrent',
        name: 'qBittorrent',
        addressPlaceholder: 'http://127.0.0.1:8080/',
        clientCapabilities: ['paused', 'label', 'path', 'rss'],
        clientOptions: [
            {
                name: 'sequentialDownload',
                description: chrome.i18n.getMessage('sequentialDownloadOption')
            },
            {
                name: 'firstLastPiecePrio',
                description: chrome.i18n.getMessage('firstLastPiecePriorityOption')
            },
            {
                name: 'skip_checking',
                description: chrome.i18n.getMessage('skipHashCheckOption')
            },
            {
                name: 'contentLayout',
                description: chrome.i18n.getMessage('contentLayoutOption'),
                values: {
                    '': chrome.i18n.getMessage('contentLayoutOriginalOption'),
                    'Subfolder': chrome.i18n.getMessage('contentLayoutSubfolderOption'),
                    'NoSubfolder': chrome.i18n.getMessage('contentLayoutNoSubfolderOption'),
                },
            },
        ]
    },
    {
        id: 'qbittorrent_404',
        name: 'qBittorrent (<=4.0.4)',
        addressPlaceholder: 'http://127.0.0.1:8080/'
    }
];

export const getClient = (serverSettings) => {
    switch(serverSettings.application) {
        case 'biglybt':
            return new TransmissionApi(serverSettings);
        case 'cloudtorrent':
            return new CloudTorrentApi(serverSettings);
        case 'deluge':
            return new DelugeApi(serverSettings);
        case 'flood':
            return new FloodApi(serverSettings);
        case 'rutorrent':
            return new ruTorrentApi(serverSettings);
        case 'tixati':
            return new TixatiApi(serverSettings);
        case 'transmission':
            return new TransmissionApi(serverSettings);
        case 'ttorrent':
            return new tTorrentApi(serverSettings);
        case 'utorrent':
            return new uTorrentApi(serverSettings);
        case 'vuze_remoteui':
            return new TransmissionApi(serverSettings);
        case 'vuze_webui':
            return new VuzeWebUIApi(serverSettings);
        case 'vuze_webui_100':
            return new VuzeWebUIApi({
                apiVersion: 1,
                ...serverSettings
            });
        case 'qbittorrent':
            return new qBittorrentApi(serverSettings);
        case 'qbittorrent_404':
            return new qBittorrentApi({
                apiVersion: 1,
                ...serverSettings
            });
    }

    return new Error('No client found');
}

export const loadOptions = () => {
    const defaults = {
        globals: {
            currentServer: 0,
            addPaused: false,
            addAdvanced: false,
            contextMenu: 1,
            catchUrls: true,
            enableNotifications: true,
            labels: [],
            matchRegExp: []
        },
        servers: [
            {
                name: 'Default',
                application: clientList[0].id,
                hostname: '',
                username: '',
                password: '',
                directories: [],
                clientOptions: {},
                httpAuth: null
            }
        ]
    };

    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['globals', 'servers'], (options) => {
            mergeObjects(defaults, options);
            resolve(defaults);
        });
    });
}

export const saveOptions = (options) => {
    return chrome.storage.local.set(options);
}

export const isMagnetUrl = (url) => {
    return !!url.match(/^magnet:/);
}

/**
 * @type {RegExp[]}
 */
export const whitelist = [
    // Generic
    /\.torrent$/,
    /\.torrent\?/,

    // Software specific
    /\/torrents\.php\?action=download&id=\d+/, // Gazelle
    /\/dl\/.+?\/\?jackett_apikey=[a-z0-9]{32}&path=/, // Jackett
    /\/download\.php\?id=[a-z0-9]{40}&f=.+?&key=/, // Xbtit
    /\/torrents\/download\/\d+/, // UNIT3D
];

/**
 * @param url {string}
 * @param whitelist {RegExp[]}
 * @returns {boolean}
 */
export const isTorrentUrl = (url, whitelist) => {
    return whitelist.some((regExp) => !!url.match(regExp));
}

export const getMagnetUrlName = (url) => {
    const match = url.match(/^magnet:(.+)$/);
    const params = new URLSearchParams(match ? match[1] : '');

    return (params.has('dn') ? params.get('dn') : false);
}

export const getTorrentName = (data) => {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onerror = (error) => resolve(false);
        reader.onload = () => {
            const offset = reader.result.match(/name(\d+):/) || false;
            let text = false;

            if (offset) {
                const index = offset.index + offset[0].length;
                let bytes = 0;
                text = '';

                while (bytes < offset[1]) {
                    let char = reader.result.charAt(index + text.length);

                    text += char;
                    bytes += unescape(encodeURI(char)).length;
                }
            }

            resolve(text);
        };
        reader.readAsText(data);
    });
}

const mergeObjects = (target, source) => {
    const isObject = obj => obj && typeof obj === 'object';

    Object.keys(source).forEach((key) =>
        isObject(target) && target.hasOwnProperty(key) && isObject(target[key]) ?
            mergeObjects(target[key], source[key]) : target[key] = source[key]
    );
}

/**
 * @param regExpStr {string}
 * @returns {RegExp}
 */
export const regExpFromString = (regExpStr) => {
    const parts = /\/(.*)\/(.*)/.exec(regExpStr);

    if (parts === null) {
        return new RegExp(regExpStr);
    }

    return new RegExp(parts[1], parts[2]);
}

/**
 * @param hostname {string}
 * @returns {string}
 */
export const getHostFilter = (hostname) => {
    const url = new URL(hostname);

    return `${url.protocol}//${url.hostname}/*`;
}
