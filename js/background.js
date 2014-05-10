var client = new Dropbox.Client({
    key: "2l9256omgxuptj7"
});

client.authDriver(new Dropbox.AuthDriver.ChromeExtension({
    receiverPath: 'dropbox/chrome_oauth_receiver.html'
}));

var isCommunicateDropbox = false;

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        var cmd = request.cmd;
        if (cmd === 'getTags') {
            var data = JSON.parse(localStorage.data);
            data.tags.sort(function (a, b) {
                return b.links.length - a.links.length;
            });
            sendResponse(data.tags);
        } else if (cmd === 'getLinksByTag') {
            var data = JSON.parse(localStorage.data);
            var tags = data.tags;
            for (var i = 0; i < tags.length; i++) {
                var tag = tags[i];
                if (tag.name === request.tag) {
                    sendResponse(tag.links);
                    break;
                }
            }
        }
    }
);

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    chrome.pageAction.show(tabId);
    if (getBookmark(tab.url)) { //如果包含了该地址
        chrome.pageAction.setIcon({
            tabId: tabId,
            path: "icons/heart_b_24.png"
        });
    }
});


/**
 * get bookmark by url,if not exist,return null
 * @param url
 */
var getBookmark = function (url) {
    if (typeof url === 'undefined') {
        return null;
    }

    var data = JSON.parse(localStorage.data);
    var bookmarks = data.bookmarks;
    for (var i = 0; i < bookmarks.length; i++) {
        var bookmark = bookmarks[i];
        if (bookmark.url === url) {
            return bookmark;
        }
    }
    return null;
};

var fetchBookmarks = function (node, folderName, list) {
    if (typeof node.children !== 'undefined') {
        for (var i = 0; i < node.children.length; i++) {
            fetchBookmarks(node.children[i], node.title, list);
        }
    } else {
        list.push({
            "id": node.id,
            "tags": folderName || 'unknown',
            "title": node.title,
            "url": node.url,
            "addTime": node.dateAdded
        });
    }
};

chrome.runtime.onInstalled.addListener(function () {
    /**
     * 读取dropbox的文件数据
     * @param cb
     */
    isCommunicateDropbox = true;
    client.authenticate(function (err, client) {
        if (err) {
            mergeExistBookmarks();
        } else {
            client.readFile('data.json', function (err, content, stat, rangeInfo) {
                isCommunicateDropbox = false;
                if (!err) {
                    localStorage.data = content || '{}';
                    chrome.notifications.create('notify', {
                        type: 'basic',
                        title: 'Load data success',
                        message: 'Load data of dropbox successfully',
                        iconUrl: '/icons/success_64.png'
                    }, function (notifyId) {
                        setTimeout(function () {
                            chrome.notifications.clear(notifyId, function () {
                                mergeExistBookmarks(JSON.parse(content));
                            });
                        }, 2000);
                    });
                }
                else {
                    mergeExistBookmarks(JSON.parse(content));
                }
            });
        }
    });
});

function mergeExistBookmarks(existData) {
    var data = existData || {
        "tags": [],
        "bookmarks": []
    };

    chrome.notifications.create('notify', {
        type: 'progress',
        title: '初始化数据',
        message: '正在转移书签数据',
        iconUrl: "/icons/heart_r_64.png",
        progress: 0
    }, function (notificationId) {
        /**
         * 初始化书签
         */
        chrome.bookmarks.getTree(function (results) {
            try {
                var list = [];
                fetchBookmarks(results[0], '', list);
                for (var i = 0; i < list.length; i++) {
                    var bookmark = list[i];
                    addBookmark(data, bookmark);
                    var progress = parseInt((i + 1) * 100 / list.length);
                    chrome.notifications.update(notificationId, {
                        progress: progress
                    }, function () {
                        if (progress === 100) {
                            setTimeout(function () {
                                chrome.notifications.clear(notificationId, function () {
                                });
                            }, 3 * 1000); //3秒钟之后清除
                        }
                    });
                }
                localStorage.data = JSON.stringify(data);
                updateFile(function (err) {
                    if (err) {
                        chrome.notifications.create('notify', {
                            type: 'basic',
                            title: 'Error',
                            message: 'Can not save data in dropbox,error:' + err.message,
                            iconUrl: '/icons/error_64.png'
                        }, function () {

                        });
                    } else {
                        chrome.notifications.create('notify', {
                            type: 'basic',
                            title: 'Success',
                            message: 'Save data in dropbox successfully',
                            iconUrl: '/icons/success_64.png'
                        }, function () {

                        });
                    }
                });
            } catch (e) {
                console.dir(e);
            }
        });
    });
};

/**
 * 添加书签
 * @param tags
 * @param title
 * @param url
 */

function addBookmark(data, obj, save, cb) {
    try {
        var title = obj.title;
        var url = obj.url;
        var addTime = obj.addTime || new Date().getTime();

        var tagArray = trimRepeat(obj.tags.split(','));
        for (var i = 0; i < tagArray.length; i++) {
            var tmpTag = tagArray[i];

            var hasPush = false;
            for (var j = 0; j < data.tags.length; j++) {
                var tag = data.tags[j];
                if (tag.name === tmpTag) {
                    tag.links.push({
                        "id": obj.id,
                        "title": title,
                        "url": url
                    });
                    tag.lastModifyTime = new Date().getTime();
                    hasPush = true;
                    break;
                }
            }
            if (!hasPush) {
                data.tags.push({
                    "name": tmpTag,
                    "lastModifyTime": new Date().getTime(),
                    links: [
                        {
                            "title": title,
                            "url": url
                        }
                    ]
                });
            }
        }

        var hasExist = false;
        for (var i = 0; i < data.bookmarks.length; i++) {
            var bookmark = data.bookmarks[i];
            if (bookmark.url === url) { //已经存在此url的书签了
                hasExist = true;
                bookmark.id = obj.id;
                bookmark.title = title;
                bookmark.lastAccessTime = new Date().getTime();
                bookmark.tags = trimRepeat(bookmark.tags.concat(tagArray));
            }
        }
        if (!hasExist) {
            data.bookmarks.push({
                "title": title,
                "url": url,
                "tags": tagArray,
                "addTime": addTime,
                "lastAccessTime": new Date().getTime(),
                "accessCount": 1
            });
        }

        if (save) {
            localStorage.data = JSON.stringify(data);
            updateFile(cb);
        }
    } catch (e) {
        console.dir(e);
    }
}

/**
 * update data file in dropbox
 */

var updateFile = function (cb) {
    if (isCommunicateDropbox) {
        setTimeout(function () {
            updateFile(cb);
        }, 5 * 1000);
    } else {
        isCommunicateDropbox = true;
        client.authenticate(function (err, client) {
            if (err) {
                if (typeof cb === 'function') {
                    cb(err);
                }
            } else {
                client.writeFile('data.json', localStorage.data || {}, function (err, stat) {
                    isCommunicateDropbox = false;
                    if (typeof cb === 'function') {
                        cb(err, stat);
                    }
                });
            }
        });
    }
}

/**
 * 去掉数据组重复的项
 * @param array
 * @return {Array}
 */

function trimRepeat(array) {
    var result = [];
    for (var i = 0; i < array.length; i++) {
        var tmp = array[i];
        if (result.indexOf(tmp) === -1) {
            result.push(tmp);
        }
    }
    return result;
}
