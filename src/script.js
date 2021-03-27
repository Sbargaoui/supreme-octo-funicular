var s = document.createElement('script');
s.src = chrome.runtime.getURL('build/content.js');
s.dataset.extension = chrome.runtime.id
s.onload = function() {
};
(document.head || document.documentElement).appendChild(s);
