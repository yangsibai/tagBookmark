chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
    var tab = tabs[0];
    if (typeof tab !== 'undefined') {
        $(".title").val(tab.title);
        $(".url").val(tab.url);
    }

    $(".cancel").click(function () {
        window.close();
    });

    $('.add').click(function () {
        var title = $('.title').val();
        var url = $('.url').val();
        var tags = $('.tags').val();

        if (!url) {
            alert('you must have a url');
            return false;
        }

        if (!title) {
            alert('you must have a title');
            return false;
        }

        if (!tags) {
            alert('you must have tags');
            return false;
        }
        addBookmark(JSON.parse(localStorage.data), {
            "title": title,
            "url": url,
            "tags": tags
        }, true, function (err) {
            if (err) {
                alert(err);
            }
            else {
                chrome.pageAction.setIcon({
                    tabId: tab.id,
                    path: 'icons/heart_b_24.png'
                }, function () {
                    window.close();
                });
            }
        });
    })
});