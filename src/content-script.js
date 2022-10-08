const listener = async (request) => {
    if (request.type !== 'fetchTorrent') {
        return;
    }

    try {
        const response = await fetch(request.url, {
            headers: new Headers({
                'accept': 'application/x-bittorrent,application/octet-stream,*/*',
            }),
        });

        return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            content: await response.blob(),
        };
    } catch (e) {
        return e;
    }
};

chrome.runtime.onMessage.addListener(listener);
