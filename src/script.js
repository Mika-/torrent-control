{
    let hrefs = document.getElementsByTagName('a');
    for (var i = 0; i < hrefs.length; i++) {
        if (!hrefs[i].href.match(/.*\.torrent\?|.*\.torrent$/i)) {
            continue;
        }
        hrefs[i].addEventListener("click", (event) => {
            // fetch in content because CORS won't allow it in background
            fetchTorrent(event.target.href, window.location.href)
                .then(({torrent, torrentName}) => {
                    browser.runtime.sendMessage({
                        "torrent": torrent,
                        "torrentName": torrentName
                    });
                });
            event.preventDefault();
        });
    }
}
