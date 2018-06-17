// common code for content and background scripts

const getTorrentName = (data) => {
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
};

const fetchTorrent = (url, referer) => {
    console.log("===== torrent-control: fetchTorrent: fetch: ", url, referer);
    return new Promise((resolve, reject) => {
        fetch(url, {
            headers: new Headers({
                'Accept': 'application/x-bittorrent,*/*;q=0.9',
                'Referer': referer
            }),
            credentials: 'include'
        }).then((response) => {
            if (!response.ok) {
                throw new Error(browser.i18n.getMessage(
                    'torrentFetchError',
                    response.status.toString() + ': ' + response.statusText
                ));
            }
            /* ignore for now because many torrents don't have contentType set correctly
            const contentType = response.headers.get('content-type');
            if (!contentType.match(/(application\/x-bittorrent|application\/octet-stream)/gi))
                throw new Error(browser.i18n.getMessage('torrentParseError', 'Unkown type: ' + contentType));
            */
            return response.blob();
        }).then((torrent) => {
            getTorrentName(torrent).then((torrentName) => {
                console.log("===== torrent-control: fetchTorrent: fetched: ", torrentName, torrent);
                resolve({
                    "torrent": torrent,
                    "torrentName": torrentName
                });
            });
        }).catch((error) => {
            console.log("===== torrent-control: fetchTorrent: error: ", error);
            reject(error);
        });
    });
};
