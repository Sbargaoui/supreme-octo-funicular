import Vue from "vue"
import VueRouter from 'vue-router'
import VuejsDialog from 'vuejs-dialog';
import { library } from '@fortawesome/fontawesome-svg-core'
import { faDownload, faTimes, faUpload } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import 'vuejs-dialog/dist/vuejs-dialog.min.css';

library.add(faDownload, faTimes, faUpload)
Vue.component('font-awesome-icon', FontAwesomeIcon)
Vue.use(require('vue-moment'));
Vue.use(VueRouter)
Vue.use(VuejsDialog);

import App from './App.vue'
import Popup from './Popup'
import Screenshots from './Screenshots'

const routes = [
    { path: '/popup', component: Popup },
    { path: '/screenshots', component: Screenshots }
]
const router = new VueRouter({
    routes
})

var app = new Vue({
    render: createElement => createElement(App),
    router
}).$mount('#app');