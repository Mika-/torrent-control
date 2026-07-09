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
        const response = await fetch(request.url, {
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
