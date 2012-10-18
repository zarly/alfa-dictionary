var sessionDictionary = {};

var Translator = (function() {
	var default_title;
	
	function handleError(e){
	
	}
	
	function getWordAtPoint(elem, x, y) {
		if(elem.nodeType == elem.TEXT_NODE) {
			var range = elem.ownerDocument.createRange();
			range.selectNodeContents(elem);
			var currentPos = 0;
			var endPos = range.endOffset;
			while(currentPos+1 < endPos) {
			  range.setStart(elem, currentPos);
			  range.setEnd(elem, currentPos+1);
			  if(range.getBoundingClientRect().left <= x && range.getBoundingClientRect().right  >= x &&
				 range.getBoundingClientRect().top  <= y && range.getBoundingClientRect().bottom >= y) {
				try{
					range.expand("word");
				}catch(e){}
				var ret = range.toString();
				range.detach();
				return(ret);
			  }
			  currentPos += 1;
			}
		} else {
			for(var i = 0; i < elem.childNodes.length; i++) {
			  var range = elem.childNodes[i].ownerDocument.createRange();
			  range.selectNodeContents(elem.childNodes[i]);
			  if(range.getBoundingClientRect().left <= x && range.getBoundingClientRect().right  >= x &&
				 range.getBoundingClientRect().top  <= y && range.getBoundingClientRect().bottom >= y) {
				range.detach();
				return(getWordAtPoint(elem.childNodes[i], x, y));
			  } else {
				range.detach();
			  }
			}
		}
		return(null);
	}
	
	function show_translation(word){
		//document.title = sessionDictionary[word] + ' <= ' + word;
	}
	
	function hide_translation(word){
		document.title = default_title;
	}
	
	function load_translation(word){
		function onTranslationLoaded(data){
			sessionDictionary[word] = data;
			show_translation(word);
			
			$.ajax({
				url: domain+'cmd/put_translation.php',
				data: {
					user: user,
					eng: word,
					rus: data
				}
			});
		}
		
		if(Math.random() > 0.02) return;
		$.ajax({
			url: 'http://translate.yandex.ru/tr.json/translate',
			data: {
				format: '',
				lang: 'en-ru',
				text: word
			},
			success: onTranslationLoaded,
			error: handleError
		});
	}
	
	function handleMousemove(e){
		var word = getWordAtPoint(e.target, e.clientX, e.clientY);
		if(word){
			word = /([a-zA-Z'’]+)/.exec(word);
			word = word && word[0];
		}
		if(!word){
			hide_translation();
			return;
		}
		if('undefined' === typeof sessionDictionary[word]){
			sessionDictionary[word] = 'loading...';
			load_translation(word);
		}
		show_translation(word);
	}
	
	function init(){
		default_title = document.title;
		$(document.body).mousemove(handleMousemove);
	}
	
	return {
		init: init
	};
})();

Translator.init();