var runned = false;
var user = 'anonymous';

var notifyBox = (function() {
	var box;
	
	function _handleMouseMove(e){
		var x = e.clientX, y = e.clientY;
		$(box).css({
			bottom: (document.documentElement.clientHeight - y)+'px',
			left: x+'px'
		});
	}
	function init(){
		if(box) return;
		box = document.createElement('div');
		box.className = 'alfaDictionaryTranslationBox';
		document.body.appendChild(box);
		document.addEventListener('mousemove', _handleMouseMove);
	}
	function show(text){
		$(box).html(text).show();
	}
	function hide(){
		$(box).hide();
	}
	
	return {
		init: init,
		show: show,
		hide: hide
	};
})();

function eng_plugin_servce_words(storage){
	var port = chrome.extension.connect();
	var elems={};
	user = storage['$user'];
	
	var markClass='alfaDictionaryWord';
	function tf(tel){
		var tn, df = document.createDocumentFragment();
		
		var str = tel.wholeText, i=0, word;
		var reg=/([^a-zA-Z'’]*)([a-zA-Z'’]+)/;
		while(reg.exec(str)){
			tn = document.createTextNode(RegExp.$1);
			df.appendChild(tn);
			tn = document.createElement('w');
			tn.innerHTML = RegExp.$2;
			word = RegExp.$2.toLowerCase();
			word = commonizeWord(word);
			if(!elems[word]) elems[word]=[];
			elems[word].push(tn);
			if("1"!==storage[word]){
				tn.className=markClass;
			}
			df.appendChild(tn);
			str = str.replace(reg, '');
		}
		tn = document.createTextNode(str);
		df.appendChild(tn);
		
		if(df.childNodes.length != 1) tel.parentNode.replaceChild(df, tel);
	}
	
	function commonizeWord(word){
		if(word.substring(word.length-3,word.length)=='ies'){
			return commonizeWord(word.substring(0,word.length-3)+'y');
		}else if(word.substring(word.length-2,word.length)=='es'){
			return commonizeWord(word.substring(0,word.length-1));
		}else if(word[word.length-1]=="s"){
			return commonizeWord(word.substring(0,word.length-1));
		}else if(word[word.length-1]=="'"){
			return commonizeWord(word.substring(0,word.length-1));
		}else if(word[0]=="'"){
			return commonizeWord(word.substring(1,word.length));
		}else if(word.substring(0,2)=='un'){
			return commonizeWord(word.substring(2,word.length));
		}else if(word.substring(word.length-2,word.length)=='al'){
			return commonizeWord(word.substring(0,word.length-2));
		}else if(word.substring(word.length-3,word.length)=='ern'){
			return commonizeWord(word.substring(0,word.length-3));
		}else if(word.substring(word.length-2,word.length)=='ed'){
			return commonizeWord(word.substring(0,word.length-2));
		}else if(word.substring(word.length-3,word.length)=='ing'){
			return commonizeWord(word.substring(0,word.length-3));
		}else{
			return word;
		}
	}
	
	var j, are = [];
	function getAllElements(el){
		var i, ne;
		for(i=0; i<el.childNodes.length; i++){
			ne = el.childNodes[i];
			if(ne.nodeType==1){
				if(ne.nodeName !== 'A'){
					getAllElements(ne);
				}
			}
			else if(ne.nodeType==3){
				are.push(ne);
				document.title = are.length;
			}
			else if(ne.nodeType==8){
			}
			else {
				console.error('Error: unknown nodeType '+ne.nodeType);
			}
		}
	}
	
	function click(e){
		var word = e.target.innerHTML.toLowerCase();
		word = commonizeWord(word);
		if(e.target.className==markClass){
			e.target.className="";
			for(var i=0; i<elems[word].length; i++){
				elems[word][i].className="";
			}
			storage[word]=1;
			chrome.extension.sendMessage({word: word, state: 1}, function(response) {});
			hide_transcript();
		} else {
			e.target.className=markClass;
			for(var i=0; i<elems[word].length; i++){
				elems[word][i].className=markClass;
			}
			storage[word]=0;
			chrome.extension.sendMessage({word: word, state: 0}, function(response) {});
			show_transcript(word);
		}
	}
	
	var title=document.title;
	var isOvered = false;
	function mouseover(e){
		var word = e.target.innerHTML.toLowerCase();
		if(e.target.className==markClass){
			isOvered = true;
			show_transcript(word);
		}
	}
	function mouseout(e){
		var word = e.target.innerHTML.toLowerCase();
		if(e.target.className==markClass){
			isOvered = false;
			hide_transcript();
		}
	}
	function show_transcript(word){
		function on_success(data){
			if(isOvered) {
				var translation = (data && data.text && data.text[0]) || 'перевод не найден';
				document.title = translation;
				notifyBox.show(translation);
			}
			//var user = storage['$user'];
		}
		function on_error(data){
			if(isOvered) document.title = '?..?..?..?';
		}
		if(!title) title = document.title;
		if(dict[word]){
			document.title = dict[word];
			notifyBox.show(dict[word]);
		}else{
			document.title = 'loading...';
			notifyBox.show('loading...');
			$.ajax({
				url: 'https://translate.yandex.net/api/v1.5/tr.json/translate',
				data: {
					key: 'trnsl.1.1.20141216T193009Z.52a9cfb24336f4b0.826770255dcb02ae9cdef021bf29534aa735411a',
					lang: 'en-ru',
					text: word
				},
				success: on_success,
				error: on_error
			});
		}
	}
	function hide_transcript(){
		document.title = title;
		title=false;
		notifyBox.hide();
	}
	
	function transformPage() {
		getAllElements(document.body);
		for(j=are.length-1; j>=0; j--){
			tf(are[j]);
			delete(are[j]);
		}
		var elements = document.getElementsByTagName('w');
		var i=0;
		document.title='0/'+elements.length;
		for(i=0;i<elements.length;i++){
			elements[i].addEventListener('click',click);
			elements[i].addEventListener('mouseover',mouseover);
			elements[i].addEventListener('mouseout',mouseout);
			if(!(i%16)) document.title=i+'/'+elements.length;
		}
		document.title=title;
	}
	
	transformPage();
}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	try{
		if(runned) return;
		runned = true;
		if(request.$mode == 'just_translate') {
			user = request.$user;
		} else {
			eng_plugin_servce_words(request);
			notifyBox.init();
		}
		runned = false;
		sendResponse({});
	}catch(e){
		alert('Error: '+e);
	}
});