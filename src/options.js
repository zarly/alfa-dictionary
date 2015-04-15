
$(function init() {
	$('#btnMakeDump').on('click', function () {
		$('#backup_textarea').val(dump_make()); alert('Копия создана, сохраните её в текстовой файл');
	});

	$('#btnLoadDump').on('click', function () {
		dump_load($('#backup_textarea').val()); alert('Копия загружена');
	});

	$('#inpLogin').val(localStorage['$user']);
	showStudyList();
	init_visual_settings();
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
}
