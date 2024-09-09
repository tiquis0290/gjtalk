const PLATFORM = "Talk";
const LINK = "https://talk.cz";

const VIDEO_REGEX = /^https:\/\/talk\.cz\/video\/([a-zA-Z0-9-_]+)\/?$/
const CHANNEL_REGEX = /^https:\/\/talk\.cz\/([a-zA-Z0-9-_]+)\/?$/
const ARCHIVE_REGEX = /^https:\/\/talk\.cz\/seznam-videi\/([a-zA-Z0-9-_]+)\/?$/

var config = {};

//Source Methods
source.enable = function (conf, settings, savedState) {
}
source.getHome = function () {
	return new TalkVideoPager({ page: 1, last: null, url: LINK + "/videa" });
};



function findChannel(colorid, channels) {
	var i = 0;
	var n = 0;
	channels.forEach(function (chan) {
		//throw new ScriptException("|"+chan.colorid + "|" + colorid+ "|");
		if (chan.colorid == colorid) {
			//throw new ScriptException("same");
			n = i;
		}
		i++;
	});
	return channels[n];
}

function convertDurationToSeconds(timeString) {
	let hours = 0;
	let minutes = 0;

	const hIndex = timeString.indexOf('h');
	const mIndex = timeString.indexOf('m');

	if (hIndex !== -1) {
		hours = parseInt(timeString.substring(0, hIndex), 10);
	}
	if (mIndex !== -1) {
		minutes = parseInt(timeString.substring(hIndex + 1, mIndex), 10);
	}

	return (hours * 3600) + (minutes * 60);
}

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
	return new TalkVideoPager({ page: 1, last: null, url: LINK + "/hledani?q=" + query });
};
source.getSearchChannelContentsCapabilities = function () {
	return {
		types: [Type.Feed.Mixed],
		sorts: [Type.Order.Chronological],
		filters: []
	};
};
source.searchChannelContents = function (channelUrl, query, type, order, filters) {
	return new TalkVideoPager({ page: 1, last: null, url: LINK + "/hledani?q=" + channelUrl.split(".cz/")[1] + " " + query });
};

source.searchChannels = function (query) {
	var channels = [];
	var items = domParser.parseFromString(http.GET(LINK + "/tvurci", {}, true).body).getElementsByClassName('list__item');
	items.forEach(function (item) {
		if (item.textContent.toLowerCase().includes(query.toLowerCase())) {
			channels.push(
				new PlatformAuthorLink(
					new PlatformID(PLATFORM, item.querySelector('a').getAttribute('href'), plugin.config.id),
					item.textContent,
					LINK + item.querySelector('a').getAttribute('href'),
					item.firstChild.firstChild.firstChild.getAttribute('data-bg'),
				)
			);
		}
	});
	return new ChannelPager(channels, false)
};

//Channel
source.isChannelUrl = function (url) {
	return CHANNEL_REGEX.test(url) || ARCHIVE_REGEX.test(url);
};
source.getChannel = function (url) {
	const body = http.GET(url, {}, true).body;
	var dom = domParser.parseFromString(body);
	var text = dom.getElementsByClassName('show-hero__article')[0]
	if (text == undefined) {
		text = dom.getElementsByClassName('video-list-hero__article')[0].textContent;
		return new PlatformChannel({
			id: new PlatformID(PLATFORM, url.split(".cz")[1], plugin.config.id),
			name: dom.getElementsByClassName('video-list-hero__article')[0].firstChild.textContent,
			thumbnail: dom.getElementsByClassName('video-list-hero__img')[0].getAttribute('data-bg'),
			banner: dom.getElementsByClassName('video-list-hero__img')[0].getAttribute('data-bg'),
			subscribers: 0,
			description: dom.getElementsByClassName('video-list-hero__more')[0].textContent,
			url: url,
		})
	}
	else{
		text = text.textContent;
		return new PlatformChannel({
			id: new PlatformID(PLATFORM, url.split(".cz")[1], plugin.config.id),
			name: dom.getElementsByClassName('show-hero__header-container')[0].firstChild.textContent,
			thumbnail: dom.getElementsByClassName('show-hero__img')[0].getAttribute('data-bg'),
			banner: dom.getElementsByClassName('show-hero__img')[0].getAttribute('data-bg'),
			subscribers: 0,
			description: text.substring(text.indexOf('notifikace') + 11),
			url: url,
		})
	}

};
source.getChannelContents = function (url) {
	return new TalkVideoPager({ page: 1, last: null, url: url });
};

class TalkVideoPager extends VideoPager {
	constructor(context) {
		let url = context.url + "?pages=" + context.page;
		if (context.page == 0) {
			url = context.url;
		}
		var divs = http.GET(url, {}, true).body;
		//throw new ScriptException(divs);
		var dom = domParser.parseFromString(divs);
		var listItems = dom.getElementsByClassName('list__row');
		//throw new ScriptException(listItems.length);
		if (listItems.length == 0) {
			listItems = dom.getElementsByClassName('sidevideos__content');
		}
		listItems = listItems[0].querySelectorAll('a');
		while (listItems[0].textContent !== context.last && listItems.length > 0 && context.last != null) {
			listItems = listItems.slice(1);
			//throw new ScriptException("listItems: " + listItems[0].innerHTML);
		}
		if (context.page > 1) {
			listItems = listItems.slice(1);
		}
		if (listItems.length > 0) {
			context.last = listItems[listItems.length - 1].textContent;
			var videos = [];

			//getnumbers for channels
			var channels = []
			var items = domParser.parseFromString(http.GET(LINK + "/tvurci", {}, true).body).getElementsByClassName('list__item');
			items.forEach(function (item) {
				var colorid = item.querySelector('a').getAttribute('class').split('-')[2];
				channels.push({
					colorid: colorid,
					id: new PlatformID(PLATFORM, item.querySelector('a').getAttribute('href'), plugin.config.id),
					url: LINK + item.querySelector('a').getAttribute('href'),
					name: item.textContent,
					cover: item.firstChild.firstChild.firstChild.getAttribute('data-bg'),
				});
				//throw new ScriptException(item.innerHTML);
			});
			listItems.forEach(function (item) {
				var colorid = item.querySelector('a').getAttribute('class').split('-')[1];
				videos.push(serializeVideo(item, channels, colorid, LINK + item.querySelector('a').getAttribute('href')));
			});
			super(videos, context.next !== null, context)
		}
		else {
			super([], false, context)
		}
	}
	nextPage() {
		this.context.page++
		return new TalkVideoPager(this.context)
	}
}



function serializeVideo(item, channels, colorid, videourl,) {
	const chanel = findChannel(colorid, channels);
	var author = new PlatformAuthorLink(
		chanel.id,
		chanel.name,
		chanel.url,
		chanel.cover
	);
	//throw new ScriptException(name);
	// Output the video list
	var parts = item.querySelector('a').getAttribute('href').split('-');
	var id = parts[parts.length - 1]
	//time
	var date = 0;
	if (true) {
		const [day, monthName, year] = domParser.parseFromString(http.GET(videourl, {}, true).body).getElementsByClassName('details__info')[0].textContent.split(' ');
		const monthMap = {
			"ledna": 0,
			"února": 1,
			"března": 2,
			"dubna": 3,
			"května": 4,
			"června": 5,
			"července": 6,
			"srpna": 7,
			"září": 8,
			"října": 9,
			"listopadu": 10,
			"prosinece": 11
		};
		date = parseInt(new Date(parseInt(year), monthMap[monthName], parseInt(day), 12).getTime() / 1000);
	}
	var name = item.getElementsByClassName('video-header__title')[0];
	if (name == undefined) {
		name = item.getElementsByClassName('media__name')[0];
	}
	return new PlatformVideo({
		id: new PlatformID(PLATFORM, id, plugin.config.id),
		name: name.textContent,
		thumbnails: new Thumbnails([new Thumbnail(item.querySelector('img').getAttribute('data-src'))]),
		author,
		uploadDate: date,
		duration: convertDurationToSeconds(item.getElementsByClassName('duration')[0].textContent),
		viewCount: 0,
		url: LINK + item.querySelector('a').getAttribute('href').split(' - ')[0],
		isLive: false,
	});
}


//Video
source.isContentDetailsUrl = function (url) {
	return VIDEO_REGEX.test(url);

};
source.getContentDetails = function (url) {
	var channels = []
	var items = domParser.parseFromString(http.GET(LINK + "/tvurci", {}, true).body).getElementsByClassName('list__item');
	items.forEach(function (item) {
		var colorid = item.querySelector('a').getAttribute('class').split('-')[2];
		channels.push({
			colorid: colorid,
			id: new PlatformID(PLATFORM, item.querySelector('a').getAttribute('href'), plugin.config.id),
			url: LINK + item.querySelector('a').getAttribute('href'),
			name: item.textContent,
			cover: item.firstChild.firstChild.firstChild.getAttribute('data-bg'),
		});
	});

	var body = http.GET(url, {}, true).body;
	const dom = domParser.parseFromString(body);
	var colorid = body[body.indexOf("coloring-") + 9];
	const pv = serializeVideo(dom, channels, colorid, url);
	const pvd = new PlatformVideoDetails(pv)
	var id = url.split("-");
	id = id[id.length - 1];
	var audiourl = JSON.parse(http.GET(LINK + "/srv/podcasts/list", {}, true).body).podcasts[0].audioUrl;
	pvd.description = dom.getElementsByClassName('details__info')[0].textContent;
	const sources = dom.querySelectorAll('source');
	pvd.video = new UnMuxVideoSourceDescriptor([
		new VideoUrlSource({
			width: 1280,
			height: 720,
			container: "video/mp4",
			codec: "avc1.4d401e",
			name: "720p30 mp4",
			url: sources[1].getAttribute('src')
		}),
		new VideoUrlSource({
			width: 854,
			height: 480,
			container: "video/mp4",
			codec: "avc1.4d401e",
			name: "480p30 mp4",
			url: sources[2].getAttribute('src')
		}),
		new VideoUrlSource({
			width: 640,
			height: 360,
			container: "video/mp4",
			codec: "avc1.4d401e",
			name: "360p30 mp4",
			url: sources[3].getAttribute('src')
		}),
		new VideoUrlSource({
			width: 426,
			height: 240,
			container: "video/mp4",
			codec: "avc1.4d401e",
			name: "240p30 mp4",
			url: sources[4].getAttribute('src')
		}),
	], [
		new AudioUrlSource({
			name: "audio",
			bitrate: 77000,
			url: "https://extra.talktv.cz/audio/" + id + audiourl.substring(audiourl.indexOf('.mp3')),
			language: "cs"
		}),
	]
	);
	pvd.getContentRecommendations = function() {
		return new TalkVideoPager({ page: 0, last: null, url: url });
	}

	return pvd
};

//Comments
source.getComments = function (url) {
	return new CommentPager([], false);
}
source.getSubComments = function (comment) {
	return new CommentPager([], false);
}

log("LOADED");