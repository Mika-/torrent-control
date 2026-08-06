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
        // Special handling for c411.org - extract info hash from URL and use API
        const c411Match = request.url.match(/^https?:\/\/(?:www\.)?c411\.org\/torrents\/(\d+)$/);
        if (c411Match) {
            const torrentId = c411Match[1];
            
            // Fetch the page to get the info hash
            const pageResponse = await fetch(request.url, {
                credentials: 'include',
                headers: new Headers({
                    'accept': 'text/html,application/xhtml+xml',
                }),
            });
            
            if (!pageResponse.ok) {
                return {
                    ok: false,
                    status: pageResponse.status,
                    statusText: pageResponse.statusText,
                    filename: null,
                    content: null,
                };
            }
            
            const html = await pageResponse.text();
            
            // Extract info hash from the page using multiple patterns
            // Look for data-info-hash attribute, JSON data, or API URLs
            const infoHashMatch = html.match(/data-info-hash="([a-fA-F0-9]{40})"/) ||
                                  html.match(/infoHash["']?\s*[:=]\s*["']([a-fA-F0-9]{40})["']/) ||
                                  html.match(/\/api\/torrents\/([a-fA-F0-9]{40})\/download/) ||
                                  html.match(/"infoHash":"([a-fA-F0-9]{40})"/);
            
            if (infoHashMatch && infoHashMatch[1]) {
                const infoHash = infoHashMatch[1];
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
                
                const contentDisposition = response.headers.get('content-disposition');
                let filename = parseFilenameFromContentDisposition(contentDisposition);
                
                // If no filename from header, try to get title from HTML
                if (!filename) {
                    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/);
                    if (titleMatch) {
                        filename = `${titleMatch[1].trim()}.torrent`;
                    } else {
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
            
            // If we couldn't find infoHash, return error
            return {
                ok: false,
                status: 500,
                statusText: 'Could not extract info hash from page',
                filename: null,
                content: null,
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
