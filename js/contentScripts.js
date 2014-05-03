$(document).ready(function () {
    var showHeart = function () {
        var heart = '<div id="webMark_heart"></div>';
        $('body').append(heart);

        $("#webMark_heart").click(function () {
            $(this).remove();
            chrome.runtime.sendMessage({
                cmd: 'getTags'
            }, function (tags) {
                var bookMarkBar = '<div id="webMark_bar" class="markBar"><ul class="tag_list">';
                for (var i = 0; i < tags.length; i++) {
                    var tag = tags[i];
                    var span = [
                        '<li class="tag">',
                        '<span class="name">',
                        tag.name,
                        '</span>',
                        '<span class="count">',
                        tag.links.length,
                        '</span>',
                        '</li>'
                    ].join('');
                    bookMarkBar += span;
                }
                var closeBtn = '<button id="webMark_close_btn">close</button>';
                bookMarkBar += '</ul>' + closeBtn + '</div>';
                $('body').prepend(bookMarkBar).prepend('<p id="webMark_placeHolder" class="markBar"></p>').hide().slideDown();

                $("#webMark_close_btn").click(function () {
                    $(".markBar").remove();
                    showHeart();
                });

                $("#webMark_bar .tag").click(function (e) {
                    $('.pop').remove();
                    var ele = $(this);
                    var position = ele.position();
                    var tag = $(this).children('.name').text();
                    chrome.runtime.sendMessage({
                        cmd: 'getLinksByTag',
                        tag: tag
                    }, function (links) {
                        if (links instanceof Array && links.length > 0) {
                            var popDiv = '<div class="pop"><div class="arrow"></div>';
                            var ol = '<ol class="bookmark_list">';
                            for (var i = 0; i < links.length; i++) {
                                var link = links[i];
                                var li = [
                                    '<li class="bookmark" title="',
                                    link.url,
                                    '">',
                                    '<a target="_blank" href="',
                                    link.url,
                                    '">',
                                    link.title,
                                    '</a></li>'
                                ].join('');
                                ol += li;
                            }
                            ol += '</ol>';
                        }
                        popDiv += ol;
                        popDiv += '</div>';
                        $('#webMark_bar').append(popDiv);
                        var y = position.top + 14;
                        var x = position.left;
                        if (x < 100) {
                            $("#webMark_bar .arrow").css('margin-left', x + 15);
                            x = 110;
                        }
                        $("#webMark_bar .pop").css('top', y).css('left', x);
                    });
                });
            });
        });
    };

    showHeart();

    $(document).bind('mouseup', function (event) {
        var container = $('#webMark_bar .pop');
        if (!container.is(event.target) && container.has(event.target).length == 0) {
            container.remove();
        }
    });
});