chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.tabs.getSelected(null, function(tab) {
		try{
			var wrd, storage_dump={};
			for(wrd in localStorage){
				storage_dump[wrd]=localStorage[wrd];
			}
			chrome.tabs.sendMessage(tab.id, storage_dump, function(response) {});
		}catch(e){
			alert(e);
		}
	});
});
chrome.tabs.onUpdated.addListener(function(id, info, tab) {
    if(!localStorage['$user']){
        localStorage['$user'] = 'user'+Math.round(Math.random()*999999999);
    }
	
	try{
		var wrd, storage_dump={$user: localStorage['$user'], $mode: 'just_translate'};
		chrome.tabs.sendMessage(tab.id, storage_dump, function(response) {});
	}catch(e){
		alert(e);
	}
});
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	if(request.state){
		localStorage[request.word]=1;
	}else{
		localStorage[request.word]=0;
	}
	sendMessage({});
});
