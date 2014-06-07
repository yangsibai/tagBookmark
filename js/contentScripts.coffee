$(document).ready ->
	isShowMarkbar = false
	isShowPop = false
	popChooseIndex = -1; # 从 -1 开始
	maxChooseCount = 0;

	###
		绑定鼠标事件，当鼠标点击外部区域时，隐藏 popup
	###
	$(document).bind "mouseup", (event) ->
		popContainer = $("#webMark_bar .pop")
		removePop() if not popContainer.is(event.target) and popContainer.has(event.target).length is 0 and $(event.target).attr("class") isnt "search"

	$(document).bind "keyup", (event) ->
		if event.altKey
			switch event.keyCode
				when 38 # `up arrow`
					slideUp() # `Alt+Up arrow` to slide up tags
				when 40 # `down arrow`
					slideDown() # `Alt+Down arrow` to slide down tags
				when 79 # `o`
					if isShowMarkbar
						removeMarkbar() # `Alt+o` to remove mark bar if mark bar is show
					else # `o`
						showMarkbar() # `Alt+o` to show mark bar if mark bar is hide
				when 88 # `x`
					removeMarkbar()
		else
			switch event.keyCode
				when 27 # `esc`
					removeMarkbar() # `Esc` to remove mark bar
				when 40 # `down arrow`
					chooseNext()
				when 38 # `up arrow`
					choosePrevious()
				when 13 # `enter`
					openChoose()


	###
	  显示
	  ###
	showMarkbar = ->
		isShowMarkbar = true
		chrome.runtime.sendMessage
			cmd: "getTags"
		, (tags) ->
			bookMarkBar = []
			bookMarkBar.push "<div id=\"webMark_bar\" class=\"markBar\">"
			bookMarkBar.push "<input type=\"text\" class=\"search\" value=\"\" placeholder=\"name or tag\"/>"
			bookMarkBar.push "<ul class=\"tag_list\">"
			i = 0

			while i < tags.length
				tag = tags[i]
				span = [
					"<li class=\"tag\">"
					"<span class=\"name\">#{tag.name}</span>"
					"<span class=\"count\">#{tag.count}</span>"
					"</li>"
				].join("")
				bookMarkBar.push span
				i++
			bookMarkBar.push "</ul>"
			operateBtn = [
				"<div class=\"operate\">"
				"<button id=\"webMark_down_btn\"></button>"
				"<button id=\"webMark_up_btn\"></button>"
				"<button id=\"webMark_close_btn\"></button>"
				"</div>"
			]
			bookMarkBar = bookMarkBar.concat(operateBtn)
			bookMarkBar.push "</div>"
			$("body").prepend bookMarkBar.join("")

			$("#webMark_bar .search").focus()

			$("#webMark_bar .search").focus(->
				keyword = $(this).val()
				element = $(this)
				position = element.position()
				search keyword, position.top, position.left
			).bind "input propertychange", ->
				keyword = $(this).val()
				element = $(this)
				position = element.position()
				search keyword, position.top, position.left

			$("#webMark_close_btn").click removeMarkbar
			$("#webMark_down_btn").click slideDown
			$("#webMark_up_btn").click slideUp
			$("#webMark_bar .tag").click ->
				$(".pop").remove()
				ele = $(this)
				position = ele.position()
				tag = $(this).children(".name").text()
				chrome.runtime.sendMessage
					cmd: "getLinksByTag"
					tag: tag
				, (links) ->
					pop links, position.top, position.left

	###
	  移除
	  ###
	removeMarkbar = ->
		isShowMarkbar = false
		$(".markBar").remove()

	###
	  展开
	  ###
	slideDown = ->
		if isShowMarkbar
			$("#webMark_down_btn").hide()
			$("#webMark_bar").css "height", "auto"
			$("#webMark_up_btn").show()

	###
	  收起
	  ###
	slideUp = ->
		if isShowMarkbar
			$("#webMark_up_btn").hide()
			$("#webMark_bar").css "height", "30px"
			$("#webMark_down_btn").show()

	###
	  搜索
	  @param keyword
	  @param top
	  @param left
	  ###
	search = (keyword, top, left) ->
		chrome.runtime.sendMessage
			cmd: "search"
			keyword: keyword
		, (result) ->
			pop result, top, left

	###
	  显示弹出窗口
	  @param links
	  @param top
	  @param left
	  ###
	pop = (links, top, left) ->
		isShowPop = true
		maxChooseCount = links.length;

		bookmarks = []
		if links instanceof Array and links.length > 0
			i = 0

			while i < links.length
				link = links[i]
				bookmarks.push "<li class='bookmark' title='#{link.url}'>"
				bookmarks.push "<p><a target='_blank' href='#{link.url}'>#{link.title}</a></p>"
				bookmarks.push "<p><a target='_blank' href='#{link.url}'>#{link.url}</a></p>"

				j = 0
				while j < link.tags.length
					bookmarks.push "<span class=\"b_tag\">#{link.tags[j]}</span>"
					j++
				bookmarks.push "</li>"
				i++
		if $(".pop").length
			$(".pop .bookmark_list").empty().append bookmarks.join("")
		else
			popDiv = []
			popDiv.push "<div class=\"pop\"><div class=\"arrow\"></div>"
			popDiv.push "<ol class=\"bookmark_list\">"
			popDiv = popDiv.concat(bookmarks)
			popDiv.push "</ol>"
			popDiv.push "</div>"
			$("#webMark_bar").append popDiv.join("")
			barPostion = $("#webMark_bar").position()
			top = top + barPostion.top
			left = left + barPostion.left
			y = top + 14
			x = left
			if x < 100
				$("#webMark_bar .arrow").css "margin-left", x + 15
				x = 110
			$("#webMark_bar .pop").css("top", y).css "left", x
			backgroundImageUrl = chrome.extension.getURL("img/crossword.png")
			$("#webMark_bar .bookmark_list").css "background-image", "url(#{backgroundImageUrl})"

	###
		移除pop窗口
	###
	removePop = ->
		isShowPop = false
		popChooseIndex = -1
		$("#webMark_bar .pop").remove()

	choosePrevious = ->
		if popChooseIndex > 0
			chooseIndex(--popChooseIndex)


	chooseNext = ->
		if popChooseIndex + 1 < maxChooseCount
			chooseIndex(++popChooseIndex)

	chooseIndex = (index) ->
		$('.pop li').removeClass 'choose'
		$('.pop li:eq(' + index + ')').addClass 'choose'

	openChoose = ->
		if popChooseIndex > -1
			window.open $('.pop .choose a').attr "href"
