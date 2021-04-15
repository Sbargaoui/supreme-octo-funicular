import browser from "webextension-polyfill"
import Dexie from 'dexie';

var db = new Dexie('quantmetry');
db.version(1).stores({
    screenshots: '++id,date,company,values'
});

function messageListener(request, sender, sendResponse) {
    console.log(request)
    if (request.action === "db-insert") {
        return db.screenshots.add(request.value)
    } else if (request.action === "db-update") {
        return db.screenshots.put(request.value)
    } else if (request.action === "db-delete") {
        return db.screenshots.delete(request.id)
    } else if (request.action === "db-getall") {
        return db.screenshots.reverse().sortBy("date")
    } else if (request.action === "db-get" && request.id) {
        db.screenshots.get(request.id).then(result => {
            sendResponse(result)
        })
        return true
    } else if (request.action === "db-select" && request.where) {
        db.screenshots.where(request.where).reverse().sortBy("date").then(result => {
            sendResponse(result)
        })
        return true
    } else if (request.action === "get-token") {
        chrome.storage.local.get(['token'], (result) => {
            sendResponse(result.token)
        })
        return true
    }
}

browser.runtime.onMessageExternal.addListener(messageListener);
browser.runtime.onMessage.addListener(messageListener);