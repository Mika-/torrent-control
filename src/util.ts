import TransmissionApi from './lib/transmission';
import CloudTorrentApi from './lib/cloudtorrent';
import DelugeApi from './lib/deluge';
import FloodApi from './lib/flood';
import ruTorrentApi from './lib/rutorrent';
import TixatiApi from './lib/tixati';
import uTorrentApi from './lib/utorrent';
import VuzeWebUIApi from './lib/vuze_webui';
import qBittorrentApi from './lib/qbittorrent';

export enum ContextMenuVisibility {Hidden, Default, Simple}

export type Options = {
    globals: {
        currentServer: number;
        addPaused: boolean;
        addAdvanced: boolean;
        contextMenu: ContextMenuVisibility;
        catchUrls: boolean;
        enableNotifications: boolean;
        labels: string[];
    };
    servers: ServerOptions[];
};

export type TorrentOptions = {
    paused?: boolean;
    path?: string;
    label?: string;
};

export type ClientCapabilities = 'paused' | 'label' | 'path' | 'rss';

export type ClientOption = {
    readonly name: string;
    readonly description: string;
};

export type Client = {
    readonly id: string;
    readonly name: string;
    readonly addressPlaceholder: string;
    readonly torrentOptions?: ClientCapabilities[];
    readonly clientOptions?: ClientOption[];
};

export type ServerOptions = {
    name: string;
    application: string;
    hostname: string;
    username: string;
    password?: string;
    directories: string[];
    clientOptions?: object;
};

export const clientList: Client[] = [
    {
        id: 'biglybt',
        name: 'BiglyBT',
        addressPlaceholder: 'http://127.0.0.1:9091/',
        torrentOptions: ['paused', 'path']
    },
    {
        id: 'cloudtorrent',
        name: 'Cloud Torrent',
        addressPlaceholder: 'http://127.0.0.1:3000/'
    },
    {
        id: 'deluge',
        name: 'Deluge Web UI',
        addressPlaceholder: 'http://127.0.0.1:8112/',
        torrentOptions: ['paused', 'label', 'path']
    },
    {
        id: 'flood',
        name: 'Flood',
        addressPlaceholder: 'http://127.0.0.1:3000/',
        torrentOptions: ['paused', 'label', 'path']
    },
    {
        id: 'rutorrent',
        name: 'ruTorrent',
        addressPlaceholder: 'http://127.0.0.1:80/',
        torrentOptions: ['paused', 'label', 'path', 'rss'],
        clientOptions: [
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
        torrentOptions: ['paused']
    },
    {
        id: 'transmission',
        name: 'Transmission',
        addressPlaceholder: 'http://127.0.0.1:9091/',
        torrentOptions: ['paused', 'path']
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
        torrentOptions: ['paused', 'path']
    },
    {
        id: 'vuze_webui',
        name: 'Vuze HTML Web UI',
        addressPlaceholder: 'http://127.0.0.1:6886/'
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
        torrentOptions: ['paused', 'label', 'path', 'rss'],
        clientOptions: [
            {
                name: 'sequentialDownload',
                description: chrome.i18n.getMessage('sequentialDownloadOption')
            },
            {
                name: 'firstLastPiecePrio',
                description: chrome.i18n.getMessage('firstLastPiecePriorityOption')
            }
        ]
    },
    {
        id: 'qbittorrent_404',
        name: 'qBittorrent (<=4.0.4)',
        addressPlaceholder: 'http://127.0.0.1:8080/'
    }
];

export const getClient = (serverSettings: ServerOptions) => {
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

    throw new Error('No client found');
}

export const loadOptions = (): Promise<Options> => {
    const defaults: Options = {
        globals: {
            currentServer: 0,
            addPaused: false,
            addAdvanced: false,
            contextMenu: ContextMenuVisibility.Default,
            catchUrls: true,
            enableNotifications: true,
            labels: []
        },
        servers: [
            {
                name: 'Default',
                application: clientList[0].id,
                hostname: '',
                username: '',
                password: '',
                directories: [],
                clientOptions: {}
            }
        ]
    };

    return new Promise((resolve) => {
        chrome.storage.local.get(['globals', 'servers'], (options) => {
            mergeObjects(defaults, options);
            resolve(defaults);
        });
    });
}

export const saveOptions = (options: object) => {
    return chrome.storage.local.set(options);
}

export const isMagnetUrl = (url: string): boolean => {
    return !!url.match(/^magnet:/);
}

const whitelist: RegExp[] = [
    // Generic
    /\.torrent$/,
    /\.torrent\?/,

    // Software specific
    /\/torrents\.php\?action=download&id=\d+/, // Gazelle
    /\/dl\/.+?\/\?jackett_apikey=[a-z0-9]{32}&path=/, // Jackett
    /\/download\.php\?id=[a-z0-9]{40}&f=.+?&key=/, // Xbtit
    /\/torrents\/download\/\d+/, // UNIT3D

    // Site specific
    /^https:\/\/anidex\.info\/dl\/\d+$/,
    /^https:\/\/animebytes\.tv\/torrent\/\d+\/download\/$/,
];

export const isTorrentUrl = (url: string): boolean => {
    return whitelist.some((regexp) => !!url.match(regexp));
}

export const getMagnetUrlName = (url: string): string | boolean => {
    const match = url.match(/^magnet:(.+)$/);
    const params = new URLSearchParams(match ? match[1] : '');

    return (params.has('dn') ? params.get('dn') : false);
}

export const getTorrentName = (data: Blob): Promise<boolean | string> => {
    return new Promise((resolve) => {
        let reader = new FileReader();
        reader.onerror = () => resolve(false);
        reader.onload = () => {
            let text: boolean | string = false;

            if (typeof reader.result === 'string') {
                const offset = reader.result.match(/name(\d+):/) || false;

                if (offset) {
                    const index = offset.index + offset[0].length;
                    let bytes = 0;
                    text = '';

                    while (bytes < ~~offset[1]) {
                        let char = reader.result.charAt(index + text.length);

                        text += char;
                        bytes += unescape(encodeURI(char)).length;
                    }
                }
            }

            resolve(text);
        };
        reader.readAsText(data);
    });
}

export const base64Encode = (data: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onerror = (error) => reject(error);
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result.split(',')[1] : null);
        reader.readAsDataURL(data);
    });
}

const mergeObjects = (target: object, source: object) => {
    Object.keys(source).forEach((key: string) =>
        target.hasOwnProperty(key) && typeof target[key] === 'object' ?
            mergeObjects(target[key], source[key]) : target[key] = source[key]
    );
}
