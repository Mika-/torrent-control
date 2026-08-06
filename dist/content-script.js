function parseFilenameFromContentDisposition(header) {
    if (!header) {
        return null;
    }

    // Try filename*= (RFC 5987) first
    const filenameStarMatch = header.match(/filename\*\s*=\s*(?:UTF-8|utf-8)'[^']*'([^;]+)/i);
    if (filenameStarMatch) {
        try {
            return decodeURIComponent(filenameStarMatch[1].trim());
        } catch (e) {}
    }

    // Try filename= (quoted)
    const filenameQuotedMatch = header.match(/filename\s*=\s*"([^"]+)"/i);
    if (filenameQuotedMatch) {
        return filenameQuotedMatch[1];
    }

    // Try filename= (unquoted)
    const filenameUnquotedMatch = header.match(/filename\s*=\s*([^;]+)/i);
    if (filenameUnquotedMatch) {
        return filenameUnquotedMatch[1].trim();
    }

    return null;
}

function parseFilenameFromUrl(url) {
    try {
        const pathname = new URL(url).pathname;
        const segment = decodeURIComponent(pathname.split('/').pop());
        return segment.endsWith('.torrent') ? segment : null;
    } catch (e) {
        return null;
    }
}

async function listener(request) {
    if (request.type !== 'fetchTorrent') {
        return;
    }

    try {
        // Special handling for c411.org - use API to get torrent file
        const c411Match = request.url.match(/^https?:\/\/(?:www\.)?c411\.org\/torrents\/([a-fA-F0-9]{40}|\d+)$/);
        if (c411Match) {
            const torrentIdentifier = c411Match[1];
            
            // Check if identifier is already an infohash (40 hex chars) or numeric ID
            const isInfoHash = /^[a-fA-F0-9]{40}$/.test(torrentIdentifier);
            
            let infoHash = torrentIdentifier;
            
            // If it's a numeric ID, fetch the API to get the infoHash
            if (!isInfoHash) {
                const apiResponse = await fetch(`https://c411.org/api/torrents/${torrentIdentifier}`, {
                    credentials: 'include',
                    headers: new Headers({
                        'accept': 'application/json',
                    }),
                });
                
                if (!apiResponse.ok) {
                    return {
                        ok: false,
                        status: apiResponse.status,
                        statusText: apiResponse.statusText,
                        filename: null,
                        content: null,
                    };
                }
                
                const data = await apiResponse.json();
                infoHash = data.infoHash;
                
                if (!infoHash) {
                    return {
                        ok: false,
                        status: 500,
                        statusText: 'Could not get infoHash from API',
                        filename: data.name ? `${data.name}.torrent` : null,
                        content: null,
                    };
                }
            }
            
            // Download the torrent file using the API
            const downloadUrl = `https://c411.org/api/torrents/${infoHash}/download`;
            const response = await fetch(downloadUrl, {
                credentials: 'include',
                headers: new Headers({
                    'accept': 'application/x-bittorrent,application/octet-stream,*/*',
                }),
            });
            
            if (!response.ok) {
                return {
                    ok: false,
                    status: response.status,
                    statusText: response.statusText,
                    filename: null,
                    content: null,
                };
            }
            
            // Get filename from Content-Disposition header or generate from infoHash
            const contentDisposition = response.headers.get('content-disposition');
            let filename = parseFilenameFromContentDisposition(contentDisposition);
            
            if (!filename) {
                // Try to get the name from the API
                try {
                    const metaResponse = await fetch(`https://c411.org/api/torrents/${infoHash}`, {
                        credentials: 'include',
                        headers: new Headers({
                            'accept': 'application/json',
                        }),
                    });
                    if (metaResponse.ok) {
                        const metaData = await metaResponse.json();
                        if (metaData.name) {
                            filename = `${metaData.name}.torrent`;
                        }
                    }
                } catch (e) {
                    // Ignore errors when trying to get metadata
                }
                
                if (!filename) {
                    filename = `torrent-${infoHash.substring(0, 8)}.torrent`;
                }
            }
            
            return {
                ok: response.ok,
                status: response.status,
                statusText: response.statusText,
                filename: filename,
                content: await response.blob(),
            };
        }

        const response = await fetch(request.url, {
            credentials: 'include',
            headers: new Headers({
                'accept': 'application/x-bittorrent,application/octet-stream,*/*',
            }),
        });

        const contentDisposition = response.headers.get('content-disposition');
        const filename = parseFilenameFromContentDisposition(contentDisposition)
            || parseFilenameFromUrl(request.url);

        return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            filename: filename,
            content: await response.blob(),
        };
    } catch (e) {
        return e;
    }
}

chrome.runtime.onMessage.addListener(listener);
