const PLATFORM = "Sample";
var config = {};
//Source Methods
source.enable = function (conf, settings, savedState) {
	config = conf ?? {};
	throw new ScriptException("This is a sample");
}
source.getHome = function () {
	log("test")
	const response = http.GET("https://talktv.cz/videa", {}, true);
	const doc = domParser.parseFromString(response.body);
	// Select all list items
	const listItems = doc.getElementById('videoListContainer');
	throw new ScriptException(listItems.outerHTML);
	const videoList = Array.from(listItems).map(item => {
		return {
			title: title,
			duration: duration,
			link: link.href,
			imageUrl: imageUrl
		};
	});
	// Output the video list
	console.log(videoList);
	throw new ScriptException(videoList);
	const videos = []; // The results (PlatformVideo)
	const hasMore = false; // Are there more pages?
	const context = { continuationToken: continuationToken }; // Relevant data for the next page
	return new SomeHomeVideoPager(videos, hasMore, context);
};
source.searchSuggestions = function (query) {
	throw new ScriptException("This is a sample");
};
source.getSearchCapabilities = () => {
	return {
		types: [Type.Feed.Mixed],
		sorts: [Type.Order.Chronological],
		filters: []
	};
};
source.search = function (query, type, order, filters) {
	return new ContentPager([].false);
};
source.getSearchChannelContentsCapabilities = function () {
	return {
		types: [Type.Feed.Mixed],
		sorts: [Type.Order.Chronological],
		filters: []
	};
};
source.searchChannelContents = function (channelUrl, query, type, order, filters) {
	throw new ScriptException("This is a sample");
};
source.searchChannels = function (query) {
	throw new ScriptException("This is a sample");
};
//Channel
source.isChannelUrl = function (url) {
	throw new ScriptException("This is a sample");
};
source.getChannel = function (url) {
	throw new ScriptException("This is a sample");
};
source.getChannelContents = function (url) {
	throw new ScriptException("This is a sample");
};
//Video
source.isContentDetailsUrl = function (url) {
	throw new ScriptException("This is a sample");
};
source.getContentDetails = function (url) {
	throw new ScriptException("This is a sample");
};
//Comments
source.getComments = function (url) {
	throw new ScriptException("This is a sample");
}
source.getSubComments = function (comment) {
	throw new ScriptException("This is a sample");
}
log("LOADED");