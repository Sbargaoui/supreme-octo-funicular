import browser from "webextension-polyfill"
import Dexie from 'dexie';

var db = new Dexie('quantmetry');
db.version(1).stores({
    screenshots: '++id,date,company,values'
});

function messageListener(request, sender, sendResponse) {
    console.log(request)
    if (request.action === "db-insert") {
        db.screenshots.add(request.value)
    } else if (request.action === "db-delete") {
        db.screenshots.delete(request.id)
    } else if (request.action === "db-getall") {
        return db.screenshots.reverse().sortBy("date")
    }
}

browser.runtime.onMessageExternal.addListener(messageListener);
browser.runtime.onMessage.addListener(messageListener);