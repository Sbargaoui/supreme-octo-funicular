<template>
<div class="w-full">
  <nav class="bg-indigo-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <img class="h-14" src="../assets/logo.png" alt="Quantmetry">
          </div>
          <div class="hidden md:block">
            <div class="ml-10 flex items-baseline space-x-4">
              <!-- Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white" -->
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
  <header class="bg-gray-100 shadow">
    <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <h1 class="text-3xl font-bold text-gray-900">
        Screenshots Pipe Quantmetry x Stafiz
      </h1>
    </div>
  </header>
  <main class="bg-gray-100">
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div>
            <template v-if="token">
                Token API : {{ token }}<br />
                <button type="button" class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                @click="logout">
                    Se déconnecter
                </button>
            </template>
            <template v-else>
                <input type="text" v-model="form.email" /> <input type="password" v-model="form.password" />
                <button @click="login">Se connecter</button>
            </template>
        </div>
    </div>
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8" v-if="token">
        <div>
            <div class="mb-4">
                <button type="button" class="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-4"
                @click="generate">
                    Générer un screenshot
                </button>
                <font-awesome-icon 
                icon="upload"
                size="2x"
                class="cursor-pointer"
                v-tooltip="'Uploader un nouveau screenshot'"
                v-confirm="{
                    ok: dialog => upload(null),
                    message:
                        'Voulez-vous uploader un fichier JSON pour crééer un nouveau screenshot ?'
                }"
                />
            </div>
            <div class="flex flex-col">
                <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                        <div class="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Company
                                        </th>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Values
                                        </th>
                                        <th scope="col" class="relative px-6 py-3">
                                            <span class="sr-only">Edit</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Odd row -->
                                    <tr class="bg-white" v-for="s of screenshots" :key="s.id">
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {{ s.date | moment("from", "now") }} ({{ s.date | moment("DD/MM/YYYY HH:mm") }})
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {{ s.company }}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <json-viewer theme="json-theme" :value="s.values" :expand-depth="0"></json-viewer>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <span class="mr-2" v-tooltip="'Télécharger le screenshot'"><font-awesome-icon icon="download" size="2x" class="cursor-pointer" @click.prevent="download(s.id)" /></span>
                                            <span class="mr-2"><font-awesome-icon 
                                                icon="upload"
                                                size="2x"
                                                class="cursor-pointer"
                                                v-tooltip="'Remplacer le contenu de ce screenshot'"
                                                v-confirm="{
                                                    ok: dialog => upload(s.id),
                                                    message:
                                                        'Voulez-vous uploader un fichier JSON pour remplacer ce screenshot ? Les données d\'origine seront perdues'
                                                }"
                                            /></span>
                                            <span><font-awesome-icon 
                                                icon="times"
                                                size="2x"
                                                class="cursor-pointer"
                                                v-tooltip="'Supprimer ce screenshot'"
                                                v-confirm="{
                                                    ok: dialog => remove(s.id),
                                                    message:
                                                        'Voulez-vous vraiment supprimer ce screenshot ? Cette action ne pourra pas être annulée'
                                                }"
                                            /></span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  </main>
  <a id="downloadAnchorElem" style="display:none"></a>
  <input type="file" style="display: none" ref="fileInput" accept="application/json" @change="onFilePicked"/>
</div>
</template>

<script>
import moment from "moment"
import JsonViewer from 'vue-json-viewer'
import axios from 'axios'

const browser = require("webextension-polyfill")

import { TEAMS } from "../helpers"

export default {
    components: {JsonViewer},
    data() {
        return {
            screenshots: [],
            uploadingID: null,
            token: null,
            form: {
                email: "",
                password: ""
            }
        }
    },
    async mounted() {
        this.loadScreenshots()
        chrome.storage.local.get(['token'], async (result) => {
            this.token = result.token
        })
    },
    methods: {
        async loadScreenshots() {
            this.screenshots = await browser.runtime.sendMessage({
                action: "db-getall"
            })
        },
        async login() {
            const result = await axios.post("https://stafiz.net/api/login", {
                email: this.form.email,
                password: this.form.password
            })
            if (result.data.status) {
                chrome.storage.local.set({'token': result.data.data.api_token}, () => {
                    this.token = result.data.data.api_token
                });
            }
        },
        logout() {
            chrome.storage.local.set({'token': null});
            this.token = null
        },
        async generate() {
            const all_opportunities = []
            let next_url = "https://stafiz.net/api/opportunities"
            do {
                const result = await axios.get(next_url, {
                    headers: {
                        Authorization: "Bearer " + this.token
                    }
                })
                all_opportunities.push(...result.data.data)
                next_url = result.data.next_page_url
            } while(next_url)
            console.log(all_opportunities)
            const open_opportunities = all_opportunities.filter(e => {
                return e.status === "open" && (JSON.parse(e.teams).filter(t => TEAMS.find(T => t === T.id) != -1)).length > 0
            }).map(e => ({
                ...e,
                amount: parseFloat(e.amount),
                probability: parseFloat(e.chances),
                teams: JSON.parse(e.teams),
                column_id: e.status2
            }))
            console.log(open_opportunities)
            await browser.runtime.sendMessage({
                action: "db-insert",
                value: {
                    company: "All",
                    date: new Date(),
                    values: open_opportunities
                }
            })
            this.loadScreenshots()
        },
        download(id) {
            const s = this.screenshots.find(e => e.id === id)
            var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(s));
            var dlAnchorElem = document.getElementById('downloadAnchorElem');
            dlAnchorElem.setAttribute("href", dataStr);
            dlAnchorElem.setAttribute("download", `screenshot-${encodeURIComponent(s.company)}-${moment(s.date).format("YYYY-MM-DD")}.json`);
            dlAnchorElem.click();
        },
        remove(id) {
            browser.runtime.sendMessage({
                action: "db-delete",
                id
            })
            this.screenshots.splice(this.screenshots.findIndex(e => e.id === id), 1)
        },
        upload(id) {
            this.$refs.fileInput.click()
            this.uploadingID = id
        },
        onFilePicked(event) {
            const files = event.target.files
            const fileReader = new FileReader()
            fileReader.addEventListener('load', async () => {
                const screenshot = JSON.parse(fileReader.result)
                if (screenshot.company && screenshot.date && screenshot.values) {
                    console.log(this.uploadingID)
                    if (this.uploadingID) {
                        browser.runtime.sendMessage({
                            action: "db-update",
                            value: {
                                ...screenshot,
                                id: this.uploadingID
                            }
                        })
                        this.screenshots.splice(this.screenshots.findIndex(e => e.id === this.uploadingID), 1, {...screenshot, id: this.uploadingID})
                        this.uploadingID = null
                    } else {
                        await browser.runtime.sendMessage({
                            action: "db-insert",
                            value: {
                                ...screenshot,
                                id: undefined
                            }
                        })   
                        this.screenshots = await browser.runtime.sendMessage({
                            action: "db-getall"
                        })
                    }
                }
                this.$refs.fileInput.value = null
            })
            if (files[0]) {
                fileReader.readAsText(files[0])
            }
        }
    }
}
</script>

<style lang="scss">
// values are default one from jv-light template
.json-theme {
  background: #fff;
  white-space: nowrap;
  color: #525252;
  font-size: 14px;
  font-family: Consolas, Menlo, Courier, monospace;
  max-height: 200px;
  overflow-y: auto;
  width: 500px;

  .jv-ellipsis {
    color: #999;
    background-color: #eee;
    display: inline-block;
    line-height: 0.9;
    font-size: 0.9em;
    padding: 0px 4px 2px 4px;
    border-radius: 3px;
    vertical-align: 2px;
    cursor: pointer;
    user-select: none;
  }
  .jv-button { color: #49b3ff }
  .jv-key { color: #111111 }
  .jv-item {
    &.jv-array { color: #111111 }
    &.jv-boolean { color: #fc1e70 }
    &.jv-function { color: #067bca }
    &.jv-number { color: #fc1e70 }
    &.jv-number-float { color: #fc1e70 }
    &.jv-number-integer { color: #fc1e70 }
    &.jv-object { color: #111111 }
    &.jv-undefined { color: #e08331 }
    &.jv-string {
      color: #42b983;
      word-break: break-word;
      white-space: normal;
    }
  }
  .jv-code {
    .jv-toggle {
      &:before {
        padding: 0px 2px;
        border-radius: 2px;
      }
      &:hover {
        &:before {
          background: #eee;
        }
      }
    }
  }
}
</style>