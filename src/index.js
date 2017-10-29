var options;

loadOptions().then((options) => {
    options = options;

    createContextMenu();
});

const createContextMenu = () => {
    browser.menus.create({
      id: 'add-torrent',
      title: 'Add torrent',
      contexts: ['link']
    });

    browser.menus.onClicked.addListener((info, tab) => {
        switch (info.menuItemId) {
            case 'add-torrent':
                console.log(info.linkUrl);
                break;
        }
    });
}
