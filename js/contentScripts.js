$(document).ready(function () {

    var isShowMarkbar = false;
    var isShowPop = false;

    $(document).bind('mouseup', function (event) {
        var popContainer = $('#webMark_bar .pop');
        if (!popContainer.is(event.target) && popContainer.has(event.target).length == 0 && $(event.target).attr('class') !== 'search') {
            removePop();
        }
    });

    $(document).bind('keyup', function (event) {
        if (event.altKey) {
            switch (event.keyCode) {
                case 79:
                    if (isShowMarkbar) {
                        removeMarkbar(); // `Alt+o` to remove mark bar if mark bar is show
                    }
                    else {
                        showMarkbar(); // `Alt+o` to show mark bar if mark bar is hide
                    }
                    break;
                case 38:
                    slideUp(); // `Alt+Up arrow` to slide up tags
                    break;
                case 40:
                    slideDown(); // `Alt+Down arrow` to slide down tags
                    break;
            }
            return;
        }
        else {
            switch (event.keyCode) {
                case 27:
                    removeMarkbar(); //`Esc` to remove mark bar
                    break;
            }
        }
    });

    /**
     * 显示
     */
    function showMarkbar() {
        isShowMarkbar = true;
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
            $("#webMark_bar .search").focus();


            $("#webMark_bar .search").focus(function () {
                var keyword = $(this).val();
                var element = $(this);
                var position = element.position();
                search(keyword, position.top, position.left);
            }).bind('input propertychange', function () {
                var keyword = $(this).val();
                var element = $(this);
                var position = element.position();
                search(keyword, position.top, position.left);
            });

            $("#webMark_close_btn").click(removeMarkbar);
            $("#webMark_down_btn").click(slideDown);
            $("#webMark_up_btn").click(slideUp);

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

    /**
     * 移除
     */
    function removeMarkbar() {
        isShowMarkbar = false;
        $(".markBar").remove();
    }

    /**
     * 展开
     */
    function slideDown() {
        if (isShowMarkbar) {
            $("#webMark_down_btn").hide();
            $("#webMark_bar").css('height', 'auto');
            $("#webMark_up_btn").show();
        }
    }

    /**
     * 收起
     */
    function slideUp() {
        if (isShowMarkbar) {
            $("#webMark_up_btn").hide();
            $("#webMark_bar").css('height', '30px');
            $("#webMark_down_btn").show();
        }
    }


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

    /**
     * 显示弹出窗口
     * @param links
     * @param top
     * @param left
     */
    function pop(links, top, left) {
        isShowPop = true;

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

    /**
     * 移除pop窗口
     */
    function removePop() {
        isShowPop = false;
        $("#webMark_bar .pop").remove();
    }
});