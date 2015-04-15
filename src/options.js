
$(function init() {
	$('#btnMakeDump').on('click', function () {
		$('#backup_textarea').val(dump_make());
		alert('Копия создана, сохраните её в текстовой файл');
		mixpanel.track("settings.dump.create");
	});

	$('#btnLoadDump').on('click', function () {
		dump_load($('#backup_textarea').val());
		alert('Копия загружена');
		mixpanel.track("settings.dump.restore");
	});

	$('#inpLogin').val(localStorage['$user']);
	showStudyList();
	init_visual_settings();
	mixpanel.track("settings.enter");
});

/**************************************************************************
 ************************   Backup and restore   ***************************
 **************************************************************************/
function dump_make(){
	var dump='';
	for(var item in localStorage){
		dump += item + ':' + localStorage[item] + '\n';
	}
	return dump;
}
function dump_load(dump){
	var item, items = dump.split('\n');
	for(var i=0; i<items.length; i++){
		item = items[i].split(':');
		localStorage[item[0]] = item[1];
	}
}

/**************************************************************************
 **************************   Visual settings   ***************************
 **************************************************************************/
function init_visual_settings() {
	var unknownWordsColorElement = $('#unknownWordsColor');
	function getUnknownWordsColorValue () {
		var unknownWordsColorValue = localStorage['$unknownWordsColor'] || '#FF8800';
		return 's' + unknownWordsColorValue.substr(1);
	}
	function saveUnknownWordsColorValue (val) {
		localStorage['$unknownWordsColor'] = '#' + val.substr(1);
	}

	unknownWordsColorElement.val(getUnknownWordsColorValue());
	unknownWordsColorElement.on('change', function () {
		saveUnknownWordsColorValue(unknownWordsColorElement.val());
		mixpanel.track("settings.unknownWordsColor.change");
	});
}

/**************************************************************************
 ************************   Dictionary to study   **************************
 **************************************************************************/

function showStudyList() {
	var counter = 0;
	var listElement = document.getElementById('unknownWordsList');
	listElement.innerHTML = '';
	for(var i=0; i<freqDictionary.length; i++) {
		var item = freqDictionary[i];
		if(localStorage[item[0]]) continue;

		var li = createStudyListItem(item);
		listElement.appendChild(li);
		if(++counter >= 200) break;
	}

	refreshStudyStats();
}

function createStudyListItem(data) {
	var el = document.createElement('div');
	el.innerHTML = '<div class="eng">'+data[0]+'</div><div class="rus">'+data[1]+'</div><div>'+data[2]+'</div>'
	+ '<button>знаю</button>';
	el.querySelector('button').addEventListener('click', onKnowClick.bind(null, data[0], data[2]));
	return el;
}

function refreshStudyStats () {
	var known = 0, all = 0;

	for(var i=0; i<freqDictionary.length; i++) {
		var item = freqDictionary[i];
		all += item[2];
		if(localStorage[item[0]]) known += item[2];
	}

	var tag = document.getElementById('statsKnown');
	tag.knownWords = known;
	tag.allWords = all;
	tag.innerHTML = Math.round((known / all)*100000)/1000 + '%';
}

function fastRefreshStudyStats (diff) {
	var tag = document.getElementById('statsKnown');
	var known = tag.knownWords = tag.knownWords + diff;
	var all = tag.allWords;
	tag.innerHTML = Math.round((known / all)*100000)/1000 + '%';
}

function onKnowClick (word, count, e) {
	localStorage[word] = 1;
	var row = e.target.parentNode;
	row.parentNode.removeChild(row);
	fastRefreshStudyStats(count);
	mixpanel.track("settings.words.checkAsKnown");
}


/**************************************************************************
 *****************************   MixPanel   *******************************
 **************************************************************************/
function base64(data) {
	var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, ac = 0, enc="", tmp_arr = [];

	if (!data) {
		return data;
	}

	data = utf8Encode(data);

	do { // pack three octets into four hexets
		o1 = data.charCodeAt(i++);
		o2 = data.charCodeAt(i++);
		o3 = data.charCodeAt(i++);

		bits = o1<<16 | o2<<8 | o3;

		h1 = bits>>18 & 0x3f;
		h2 = bits>>12 & 0x3f;
		h3 = bits>>6 & 0x3f;
		h4 = bits & 0x3f;

		// use hexets to index into b64, and append result to encoded string
		tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
	} while (i < data.length);

	enc = tmp_arr.join('');

	switch( data.length % 3 ){
		case 1:
			enc = enc.slice(0, -2) + '==';
			break;
		case 2:
			enc = enc.slice(0, -1) + '=';
			break;
	}

	return enc;

	function utf8Encode(string) {
		string = (string+'').replace(/\r\n/g, "\n").replace(/\r/g, "\n");

		var utftext = "",
			start,
			end;
		var stringl = 0,
			n;

		start = end = 0;
		stringl = string.length;

		for (n = 0; n < stringl; n++) {
			var c1 = string.charCodeAt(n);
			var enc = null;

			if (c1 < 128) {
				end++;
			} else if((c1 > 127) && (c1 < 2048)) {
				enc = String.fromCharCode((c1 >> 6) | 192, (c1 & 63) | 128);
			} else {
				enc = String.fromCharCode((c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128);
			}
			if (enc !== null) {
				if (end > start) {
					utftext += string.substring(start, end);
				}
				utftext += enc;
				start = end = n+1;
			}
		}

		if (end > start) {
			utftext += string.substring(start, string.length);
		}

		return utftext;
	}
}
(function (window) {
	var api = 'https://api.mixpanel.com';

	var mixpanel = {};

	function init(token, user) {
		mixpanel.token = token;
		mixpanel.distinct_id = user.userId;
	}

	function track(event) {
		var payload = {
			event: event,
			properties: {
				distinct_id: mixpanel.distinct_id,
				token: mixpanel.token,
				browser: 'Chrome'
			}
		};

		var data = window.base64(JSON.stringify(payload));
		var url = api + '/track?data=' + data;

		$.get(url);
	}

	window.mixpanel = {
		init: init,
		track: track
	};

})(window);
mixpanel.init('8c5bac0fad0e1b45b8d39e7844bc4263', {userId: localStorage['$user']});