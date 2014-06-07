cacheData = undefined

chrome.runtime.onMessage.addListener (request, sender, sendResponse) ->
	cmd = request.cmd
	switch cmd
		when "getTags"
			getData (data) ->
				data.tags.sort (a, b) ->
					b.count - a.count
				sendResponse data.tags
		when "getLinksByTag"
			tag = request.tag.trim()
			getData (data) ->
				links = []
				i = 0

				while i < data.bookmarks.length
					bookmark = data.bookmarks[i]
					tags = bookmark.tags
					j = 0

					while j < tags.length
						if tags[j] is tag
							links.push bookmark
							break
						j++
					i++
				console.dir links
				sendResponse links
		when "search"
			keyword = request.keyword
			getData (data) ->
				result = []
				if keyword and keyword.trim() isnt ""
					i = 0

					while i < cacheData.bookmarks.length
						break  if result.length >= 10
						bookmark = cacheData.bookmarks[i]
						if bookmark.title.indexOf(keyword) isnt -1
							result.push bookmark
						else if bookmark.url.indexOf(keyword) isnt -1
							result.push bookmark
						else
							j = 0

							while j < bookmark.tags.length
								tag = bookmark.tags[j]
								if tag.indexOf(keyword) isnt -1
									result.push bookmark
									break
								j++
						i++
				else
					result = data.bookmarks[..9]
				sendResponse result

###
get bookmark data
@param cb
###
getData = (cb) ->
	if typeof cacheData is "undefined"
		cacheData = JSON.parse(localStorage.data)
		cb cacheData
	else
		cb cacheData
		cacheData = JSON.parse(localStorage.data)
#如果包含了该地址

###
get bookmark by url,if not exist,return null
@param url
###

###
读取dropbox的文件数据
@param cb
###
mergeExistBookmarks = (existData) ->
	data = existData
	data = JSON.parse(existData)  if typeof existData is "string"
	if typeof existData is "undefined"
		data =
			tags: []
			bookmarks: []
	chrome.notifications.create "notify",
		type: "progress"
		title: "初始化数据"
		message: "正在转移书签数据"
		iconUrl: "/icons/heart_r_64.png"
		progress: 0
	, (notificationId) ->

		###
		初始化书签
		###
		chrome.bookmarks.getTree (results) ->
			try
				list = []
				fetchBookmarks results[0], "", list
				i = 0

				while i < list.length
					bookmark = list[i]
					addBookmark data, bookmark
					progress = parseInt((i + 1) * 100 / list.length)
					chrome.notifications.update notificationId,
						progress: progress
					, ->
						if progress is 100
							setTimeout (->
								chrome.notifications.clear notificationId, ->

								return
							), 3 * 1000 #3秒钟之后清除
						return

					i++
				localStorage.data = JSON.stringify(data)
				updateFile (err) ->
					if err
						chrome.notifications.create "notify",
							type: "basic"
							title: "Error"
							message: "Can not save data in dropbox,error:" + err.message
							iconUrl: "/icons/error_64.png"
						, ->

					else
						chrome.notifications.create "notify",
							type: "basic"
							title: "Success"
							message: "Save data in dropbox successfully"
							iconUrl: "/icons/success_64.png"
						, ->

					return

			catch e
				console.dir e
			return

		return

	return

###
添加书签
@param tags
@param title
@param url
###
addBookmark = (data, obj, save, cb) ->
	try
		title = obj.title
		url = obj.url
		addTime = obj.addTime or new Date().getTime()
		tagArray = trimRepeat(obj.tags.split(","))
		hasExist = false
		i = 0

		while i < data.bookmarks.length
			bookmark = data.bookmarks[i]
			if bookmark.url is url #已经存在此url的书签了
				hasExist = true
				bookmark.id = obj.id
				bookmark.title = title
				bookmark.lastAccessTime = new Date().getTime()
				bookmark.tags = trimRepeat(bookmark.tags.concat(tagArray))
			i++
		unless hasExist
			data.bookmarks.push
				title: title
				url: url
				tags: tagArray
				addTime: addTime
				lastAccessTime: new Date().getTime()
				accessCount: 1

			i = 0

			while i < tagArray.length
				tmpTag = tagArray[i]
				hasPush = false
				j = 0

				while j < data.tags.length
					tag = data.tags[j]
					if tag.name is tmpTag
						tag.count += 1
						hasPush = true
						break
					j++
				unless hasPush
					data.tags.push
						name: tmpTag
						lastModifyTime: new Date().getTime()
						count: 1

				i++
		if save
			localStorage.data = JSON.stringify(data)
			updateFile cb
	catch e
		console.dir e
	return

###
update data file in dropbox
###

###
去掉数据组重复的项
@param array
@return {Array}
###
trimRepeat = (array) ->
	result = []
	i = 0

	while i < array.length
		tmp = array[i]
		result.push tmp  if result.indexOf(tmp) is -1
		i++
	result
if typeof localStorage.data is "undefined"
	localStorage.data = JSON.stringify(
		tags: []
		bookmarks: []
	)
client = new Dropbox.Client(key: "2l9256omgxuptj7")
client.authDriver new Dropbox.AuthDriver.ChromeExtension(receiverPath: "dropbox/chrome_oauth_receiver.html")
isCommunicateDropbox = false

chrome.tabs.onUpdated.addListener (tabId, changeInfo, tab) ->
	chrome.pageAction.show tabId
	if getBookmark(tab.url)
		chrome.pageAction.setIcon
			tabId: tabId
			path: "icons/heart_b_24.png"

getBookmark = (url) ->
	return null  if typeof url is "undefined"
	data = JSON.parse(localStorage.data)
	if typeof data isnt "undefined" and data.bookmarks instanceof Array
		bookmarks = data.bookmarks
		i = 0

		while i < bookmarks.length
			bookmark = bookmarks[i]
			return bookmark  if bookmark.url is url
			i++
	null

fetchBookmarks = (node, folderName, list) ->
	if typeof node.children isnt "undefined"
		i = 0

		while i < node.children.length
			fetchBookmarks node.children[i], node.title, list
			i++
	else
		list.push
			id: node.id
			tags: folderName or "unknown"
			title: node.title
			url: node.url
			addTime: node.dateAdded

	return

chrome.runtime.onInstalled.addListener ->
	isCommunicateDropbox = true
	client.authenticate (err, client) ->
		if err
			mergeExistBookmarks()
		else
			client.readFile "data.json", (err, content, stat, rangeInfo) ->
				isCommunicateDropbox = false
				unless err
					chrome.notifications.create "notify",
						type: "basic"
						title: "Load data success"
						message: "Load data of dropbox successfully"
						iconUrl: "/icons/success_64.png"
					, (notifyId) ->
						setTimeout (->
							chrome.notifications.clear notifyId, ->
								mergeExistBookmarks content
								return

							return
						), 1000
						return

				else
					mergeExistBookmarks content
				return

		return

	return

updateFile = (cb) ->
	if isCommunicateDropbox
		setTimeout (->
			updateFile cb
			return
		), 5 * 1000
	else
		isCommunicateDropbox = true
		client.authenticate (err, client) ->
			if err
				cb err  if typeof cb is "function"
			else
				client.writeFile "data.json", localStorage.data or {}, (err, stat) ->
					isCommunicateDropbox = false
					cb err, stat  if typeof cb is "function"
					return

			return

	return