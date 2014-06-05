$(document).ready(function () {

    var isShowSearchBar = false;

    $(document).bind('mouseup', function (event) {
        var container = $('#webMark_bar .pop');
        if (!container.is(event.target) && container.has(event.target).length == 0 && $(event.target).attr('class') !== 'search') {
            container.remove();
        }
    });

    $(document).bind('keyup', function (event) {
        if (event.keyCode === 27) {
            removeMarkbar();
            return;
        }

        if (event.altKey && event.keyCode === 79) {
            if (isShowSearchBar) {
                removeMarkbar();
            }
            else {
                isShowSearchBar = true;
                chrome.runtime.sendMessage({
                    cmd: 'getTags'
                }, function (tags) {
                    var bookMarkBar = [];
                    bookMarkBar.push('<div id="webMark_bar" class="markBar">');
                    bookMarkBar.push('<input type="text" class="search" value="" placeholder="name or tag"/>');
                    bookMarkBar.push('<ul class="tag_list">');
                    for (var i = 0; i < tags.length; i++) {
                        var tag = tags[i];
                        var span = [
                            '<li class="tag">',
                            '<span class="name">',
                            tag.name,
                            '</span>',
                            '<span class="count">',
                            tag.count,
                            '</span>',
                            '</li>'
                        ].join('');

                        bookMarkBar.push(span);
                    }
                    bookMarkBar.push('</ul>');
                    var operateBtn = [
                        '<div class="operate">',
                        '<button id="webMark_down_btn"></button>',
                        '<button id="webMark_up_btn"></button>',
                        '<button id="webMark_close_btn"></button>',
                        '</div>'
                    ];
                    bookMarkBar = bookMarkBar.concat(operateBtn);
                    bookMarkBar.push('</div>');

                    $('body').prepend(bookMarkBar.join(''));

                    $("#webMark_bar .search").focus(function () {
                        $(this).stop().animate({width: 400}, 'slow');
                        var keyword = $(this).val();
                        var element = $(this);
                        var position = element.position();
                        search(keyword, position.top, position.left);
                    }).blur(function () {
                        $(this).stop().animate({width: 150}, 'slow');
                    }).bind('input propertychange', function () {
                        var keyword = $(this).val();
                        var element = $(this);
                        var position = element.position();
                        search(keyword, position.top, position.left);
                    });

                    $("#webMark_close_btn").click(removeMarkbar);

                    $("#webMark_down_btn").click(function () {
                        $(this).hide();
                        $("#webMark_bar").css('height', 'auto');
                        $("#webMark_up_btn").show();
                    });

                    $("#webMark_up_btn").click(function () {
                        $(this).hide();
                        $("#webMark_bar").css('height', '30px');
                        $("#webMark_down_btn").show();
                    });

                    $("#webMark_bar .tag").click(function () {
                        $('.pop').remove();
                        var ele = $(this);
                        var position = ele.position();
                        var tag = $(this).children('.name').text();
                        chrome.runtime.sendMessage({
                            cmd: 'getLinksByTag',
                            tag: tag
                        }, function (links) {
                            pop(links, position.top, position.left);
                        });
                    });
                });
            }
        }
    });

    function removeMarkbar() {
        isShowSearchBar = false;
        $(".markBar").remove();
    }
});

/**
 * 搜索
 * @param keyword
 * @param top
 * @param left
 */
function search(keyword, top, left) {
//                    var time = new Date();
    chrome.runtime.sendMessage({
        cmd: 'search',
        keyword: keyword
    }, function (result) {
//                        var end = new Date();
//                        console.log('找到 ' + result.length + ' 个结果,耗时：' + (end - time));
        pop(result, top, left);
    });
}


function pop(links, top, left) {
    var bookmarks = [];

    if (links instanceof Array && links.length > 0) {
        for (var i = 0; i < links.length; i++) {
            var link = links[i];
            bookmarks.push('<li class="bookmark" title="');
            bookmarks.push(link.url);
            bookmarks.push('"><a target="_blank" href="');
            bookmarks.push(link.url);
            bookmarks.push('">');
            bookmarks.push(link.title);
            bookmarks.push('</a>');
            for (var j = 0; j < link.tags.length; j++) {
                bookmarks.push('<span class="b_tag">');
                bookmarks.push(link.tags[j]);
                bookmarks.push('</span>');
            }
            bookmarks.push('</li>');
        }
    }

    if ($('.pop').length) {
        $('.pop .bookmark_list').empty().append(bookmarks.join(''));
    }
    else {
        var popDiv = [];
        popDiv.push('<div class="pop"><div class="arrow"></div>');
        popDiv.push('<ol class="bookmark_list">');

        popDiv = popDiv.concat(bookmarks);

        popDiv.push('</ol>');
        popDiv.push('</div>');
        $('#webMark_bar').append(popDiv.join(''));

        var barPostion = $("#webMark_bar").position();
        top = top + barPostion.top;
        left = left + barPostion.left;
        var y = top + 14;
        var x = left;
        if (x < 100) {
            $("#webMark_bar .arrow").css('margin-left', x + 15);
            x = 110;
        }
        $("#webMark_bar .pop").css('top', y).css('left', x);
        var backgroundImageUrl = chrome.extension.getURL('img/crossword.png');
        $("#webMark_bar .bookmark_list").css('background-image', 'url(' + backgroundImageUrl + ')');
    }
}