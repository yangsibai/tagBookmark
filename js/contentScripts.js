// Generated by CoffeeScript 1.7.1
(function() {
  $(document).ready(function() {
    var chooseIndex, chooseNext, choosePrevious, isShowMarkbar, isShowPop, maxChooseCount, openChoose, pop, popChooseIndex, removeMarkbar, removePop, search, showMarkbar, slideDown, slideUp;
    isShowMarkbar = false;
    isShowPop = false;
    popChooseIndex = -1;
    maxChooseCount = 0;

    /*
    		绑定鼠标事件，当鼠标点击外部区域时，隐藏 popup
     */
    $(document).bind("mouseup", function(event) {
      var popContainer;
      popContainer = $("#webMark_bar .pop");
      if (!popContainer.is(event.target) && popContainer.has(event.target).length === 0 && $(event.target).attr("class") !== "search") {
        return removePop();
      }
    });
    $(document).bind("keyup", function(event) {
      if (event.altKey) {
        switch (event.keyCode) {
          case 38:
            return slideUp();
          case 40:
            return slideDown();
          case 79:
            if (isShowMarkbar) {
              return removeMarkbar();
            } else {
              return showMarkbar();
            }
            break;
          case 88:
            return removeMarkbar();
        }
      } else {
        switch (event.keyCode) {
          case 27:
            return removeMarkbar();
          case 40:
            return chooseNext();
          case 38:
            return choosePrevious();
          case 13:
            return openChoose();
        }
      }
    });

    /*
    	  显示
     */
    showMarkbar = function() {
      isShowMarkbar = true;
      return chrome.runtime.sendMessage({
        cmd: "getTags"
      }, function(tags) {
        var bookMarkBar, i, operateBtn, span, tag;
        bookMarkBar = [];
        bookMarkBar.push("<div id=\"webMark_bar\" class=\"markBar\">");
        bookMarkBar.push("<input type=\"text\" class=\"search\" value=\"\" placeholder=\"name or tag\"/>");
        bookMarkBar.push("<ul class=\"tag_list\">");
        i = 0;
        while (i < tags.length) {
          tag = tags[i];
          span = ["<li class=\"tag\">", "<span class=\"name\">" + tag.name + "</span>", "<span class=\"count\">" + tag.count + "</span>", "</li>"].join("");
          bookMarkBar.push(span);
          i++;
        }
        bookMarkBar.push("</ul>");
        operateBtn = ["<div class=\"operate\">", "<button id=\"webMark_down_btn\"></button>", "<button id=\"webMark_up_btn\"></button>", "<button id=\"webMark_close_btn\"></button>", "</div>"];
        bookMarkBar = bookMarkBar.concat(operateBtn);
        bookMarkBar.push("</div>");
        $("body").prepend(bookMarkBar.join(""));
        $("#webMark_bar .search").focus();
        $("#webMark_bar .search").focus(function() {
          var element, keyword, position;
          keyword = $(this).val();
          element = $(this);
          position = element.position();
          return search(keyword, position.top, position.left);
        }).bind("input propertychange", function() {
          var element, keyword, position;
          keyword = $(this).val();
          element = $(this);
          position = element.position();
          return search(keyword, position.top, position.left);
        });
        $("#webMark_close_btn").click(removeMarkbar);
        $("#webMark_down_btn").click(slideDown);
        $("#webMark_up_btn").click(slideUp);
        return $("#webMark_bar .tag").click(function() {
          var ele, position;
          $(".pop").remove();
          ele = $(this);
          position = ele.position();
          tag = $(this).children(".name").text();
          return chrome.runtime.sendMessage({
            cmd: "getLinksByTag",
            tag: tag
          }, function(links) {
            return pop(links, position.top, position.left);
          });
        });
      });
    };

    /*
    	  移除
     */
    removeMarkbar = function() {
      isShowMarkbar = false;
      return $(".markBar").remove();
    };

    /*
    	  展开
     */
    slideDown = function() {
      if (isShowMarkbar) {
        $("#webMark_down_btn").hide();
        $("#webMark_bar").css("height", "auto");
        return $("#webMark_up_btn").show();
      }
    };

    /*
    	  收起
     */
    slideUp = function() {
      if (isShowMarkbar) {
        $("#webMark_up_btn").hide();
        $("#webMark_bar").css("height", "30px");
        return $("#webMark_down_btn").show();
      }
    };

    /*
    	  搜索
    	  @param keyword
    	  @param top
    	  @param left
     */
    search = function(keyword, top, left) {
      return chrome.runtime.sendMessage({
        cmd: "search",
        keyword: keyword
      }, function(result) {
        return pop(result, top, left);
      });
    };

    /*
    	  显示弹出窗口
    	  @param links
    	  @param top
    	  @param left
     */
    pop = function(links, top, left) {
      var backgroundImageUrl, barPostion, bookmarks, i, j, link, popDiv, x, y;
      isShowPop = true;
      maxChooseCount = links.length;
      bookmarks = [];
      if (links instanceof Array && links.length > 0) {
        i = 0;
        while (i < links.length) {
          link = links[i];
          bookmarks.push("<li class='bookmark' title='" + link.url + "'>");
          bookmarks.push("<p><a target='_blank' href='" + link.url + "'>" + link.title + "</a></p>");
          bookmarks.push("<p><a target='_blank' href='" + link.url + "'>" + link.url + "</a></p>");
          j = 0;
          while (j < link.tags.length) {
            bookmarks.push("<span class=\"b_tag\">" + link.tags[j] + "</span>");
            j++;
          }
          bookmarks.push("</li>");
          i++;
        }
      }
      if ($(".pop").length) {
        return $(".pop .bookmark_list").empty().append(bookmarks.join(""));
      } else {
        popDiv = [];
        popDiv.push("<div class=\"pop\"><div class=\"arrow\"></div>");
        popDiv.push("<ol class=\"bookmark_list\">");
        popDiv = popDiv.concat(bookmarks);
        popDiv.push("</ol>");
        popDiv.push("</div>");
        $("#webMark_bar").append(popDiv.join(""));
        barPostion = $("#webMark_bar").position();
        top = top + barPostion.top;
        left = left + barPostion.left;
        y = top + 14;
        x = left;
        if (x < 100) {
          $("#webMark_bar .arrow").css("margin-left", x + 15);
          x = 110;
        }
        $("#webMark_bar .pop").css("top", y).css("left", x);
        backgroundImageUrl = chrome.extension.getURL("img/crossword.png");
        return $("#webMark_bar .bookmark_list").css("background-image", "url(" + backgroundImageUrl + ")");
      }
    };

    /*
    		移除pop窗口
     */
    removePop = function() {
      isShowPop = false;
      popChooseIndex = -1;
      return $("#webMark_bar .pop").remove();
    };
    choosePrevious = function() {
      if (popChooseIndex > 0) {
        return chooseIndex(--popChooseIndex);
      }
    };
    chooseNext = function() {
      if (popChooseIndex + 1 < maxChooseCount) {
        return chooseIndex(++popChooseIndex);
      }
    };
    chooseIndex = function(index) {
      $('.pop li').removeClass('choose');
      return $('.pop li:eq(' + index + ')').addClass('choose');
    };
    return openChoose = function() {
      if (popChooseIndex > -1) {
        return window.open($('.pop .choose a').attr("href"));
      }
    };
  });

}).call(this);

//# sourceMappingURL=contentScripts.map
