chrome.tabs.query
	active: true
	lastFocusedWindow: true
, (tabs) ->
	tab = tabs[0]
	if typeof tab isnt "undefined"
		$(".title").val tab.title
		$(".url").val tab.url
	$(".cancel").click ->
		window.close()

	$(".add").click ->
		title = $(".title").val()
		url = $(".url").val()
		tags = $(".tags").val()
		unless url
			alert "you must have a url"
			return false
		unless title
			alert "you must have a title"
			return false
		unless tags
			alert "you must have tags"
			return false
		addBookmark JSON.parse(localStorage.data),
			title: title
			url: url
			tags: tags
		, true, (err) ->
			if err
				alert err
			else
				chrome.pageAction.setIcon
					tabId: tab.id
					path: "icons/heart_b_24.png"
				, ->
					window.close()