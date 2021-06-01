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
                v-confirm="{
                    ok: generate,
                    message: 'Générer un nouveau screenshot ?',
                    loader: true
                }">
                    Générer un nouveau screenshot
                </button>
                <button type="button" class="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-4"
                v-confirm="{
                    ok: dialog => upload(null),
                    message:
                        'Voulez-vous uploader un fichier JSON pour crééer un nouveau screenshot ?'
                }"
                >
                    Insérer un screenshot existant
                </button>
            </div>

            <h1 class="text-2xl">Export CSV</h1>
            <div class="mb-4 flex flex-row">
                <div class="mr-4">
                    <label for="location" class="block text-sm font-medium text-gray-700">Screenshot début</label>
                    <select id="location" name="location" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" v-model="screenshot1">
                        <option disabled selected value> -- sélectionnez un screenshot -- </option>
                        <option v-for="s of screenshots" :key="`s1-${s.id}`" :value="s.id">{{s.date | moment('from', 'now')}} - {{s.date | moment("DD/MM/YYYY HH:mm")}}</option>
                    </select>
                </div>
                <div>
                    <label for="location" class="block text-sm font-medium text-gray-700">Screenshot fin</label>
                    <select id="location" name="location" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" v-model="screenshot2">
                        <option disabled selected value> -- sélectionnez un screenshot -- </option>
                        <option v-for="s of screenshots" :key="`s2-${s.id}`" :value="s.id">{{s.date | moment('from', 'now')}} - {{s.date | moment("DD/MM/YYYY HH:mm")}}</option>
                    </select>
                </div>
                <button v-if="screenshot1 && screenshot2" type="button" class="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ml-4"
                v-confirm="{
                    ok: exportCSV,
                    message: 'Exporter en CSV ?',
                    loader: true
                }"
                >
                    Exporter CSV résumé
                </button>
                <button v-if="screenshot1 && screenshot2" type="button" class="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ml-4"
                v-confirm="{
                    ok: exportXLS,
                    message: 'Exporter en XLS ?',
                    loader: true
                }"
                >
                    Exporter Excel résumé
                </button>
                <button v-if="screenshot1 && screenshot2" type="button" class="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ml-4"
                v-confirm="{
                    ok: exportCSVFull,
                    message: 'Exporter en CSV ?',
                    loader: true
                }"
                >
                    Exporter CSV détaillé
                </button>
            </div>

            <h1 class="text-2xl">Screenshots</h1>
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
                                        <td class="py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <span class="mr-2" v-tooltip="'Télécharger le screenshot'">
                                                <button type="button" class="inline-flex items-center px-2 py-2 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
                                                @click.prevent="download(s.id)">
                                                    Télécharger
                                                </button>
                                            </span>
                                            <span class="mr-2">
                                                <button type="button" class="inline-flex items-center px-2 py-2 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
                                                v-confirm="{
                                                    ok: dialog => upload(s.id),
                                                    message:
                                                        'Voulez-vous uploader un fichier JSON pour remplacer ce screenshot ? Les données d\'origine seront perdues'
                                                }">
                                                    Remplacer
                                                </button>
                                            </span>
                                            <span>
                                                <button type="button" class="inline-flex items-center px-2 py-2 border border-transparent text-base font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
                                                v-confirm="{
                                                    ok: dialog => remove(s.id),
                                                    message:
                                                        'Voulez-vous vraiment supprimer ce screenshot ? Cette action ne pourra pas être annulée'
                                                }">
                                                    Supprimer
                                                </button>
                                            </span>
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

import { TEAMS, TEAM_RECURRING, TEAM_NON_RECURRING } from "../helpers"

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
            },
            screenshot1: null,
            screenshot2: null
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
                action: "db-select",
                where: {
                    company: "All"
                }
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
        async retrieveAllOpportunities() {
            const all_opportunities = []
            let next_url = "https://stafiz.net/api/opportunities"
            do {
                try {
                    const result = await axios.get(next_url, {
                        headers: {
                            Authorization: "Bearer " + this.token
                        }
                    })
                    all_opportunities.push(...result.data.data)
                    next_url = result.data.next_page_url
                } catch(err) {
                    if (err.response.status == 403) {
                        this.logout()
                        this.$dialog.alert('Votre session Stafiz a expiré, vous devez vous reconnecter.');
                    }
                    throw 'Logged out'
                }
            } while(next_url)
            return all_opportunities
        },
        async generate(dialog) {
            const all_opportunities = await this.retrieveAllOpportunities()
            
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
            dialog.close()
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
        async exportCSV(dialog) {
            const s1 = this.screenshots.find(e => e.id === this.screenshot1)
            const s2 = this.screenshots.find(e => e.id === this.screenshot2)
            console.log(s1)

            const rows = [
                [ "Practice" ]
            ]

            try {
                const result_all = await this.retrieveAllOpportunities()
                console.log(result_all)
                
                for (let team of TEAMS) {
                    let s1_values = s1.values.filter(e => e.teams.indexOf(team.id) !== -1)
                    let s2_values = s2.values.filter(e => e.teams.indexOf(team.id) !== -1)
                    
                    let total_win = 0, total_lost = 0;
                    let total_win_weighted = 0, total_lost_weighted = 0;
                    let total_new_weighted = 0
                    let total_delta = 0

                    let total_recurring_weighted = 0, total_non_recurring_weighted = 0
                    let total_recurring = 0, total_non_recurring = 0
                    let total_delta_recurring = 0, total_delta_non_recurring = 0
                    let total_win_recurring = 0, total_win_non_recurring = 0
                    let total_win_weighted_recurring = 0, total_win_weighted_non_recurring = 0
                    let total_lost_recurring = 0, total_lost_non_recurring = 0
                    let total_lost_weighted_recurring = 0, total_lost_weighted_non_recurring = 0
                    let total_new_recurring_weighted = 0, total_new_non_recurring_weighted = 0

                    console.log(s1_values)

                    const IDs = []

                    for (let new_s of s2_values) {
                        IDs.push(new_s.id)
                        if (new_s.teams.includes(TEAM_RECURRING)) {
                            total_recurring += new_s.amount
                            total_recurring_weighted += new_s.amount * new_s.probability/100
                        }
                        else if (new_s.teams.includes(TEAM_NON_RECURRING)) {
                            total_non_recurring += new_s.amount
                            total_non_recurring_weighted += new_s.amount * new_s.probability/100
                        }

                        const prev = s1_values.find(e => e.id == new_s.id)

                        if (prev) {
                            const old_weighted_value = prev.amount * prev.probability/100
                            const new_weighted_value = new_s.amount * new_s.probability/100
                            total_delta += new_weighted_value - old_weighted_value

                            if (new_s.teams.includes(TEAM_RECURRING)) {
                                total_delta_recurring += new_weighted_value - old_weighted_value
                            }
                            else if (new_s.teams.includes(TEAM_NON_RECURRING)) {
                                total_delta_non_recurring += new_weighted_value - old_weighted_value
                            }
                        } else {
                            total_new_weighted += new_s.amount * new_s.probability/100
                            if (new_s.teams.includes(TEAM_RECURRING)) {
                                total_new_recurring_weighted += new_s.amount * new_s.probability/100
                            }
                            else if (new_s.teams.includes(TEAM_NON_RECURRING)) {
                                total_new_non_recurring_weighted += new_s.amount * new_s.probability/100
                            }
                        }
                    }

                    const removed_values = s1_values.filter(e => IDs.indexOf(e.id) === -1)
                    for (let removed of removed_values) {
                        const data = result_all.find(e => e.id === removed.id)
                        if (data) {
                            const won = data.status === "won";
                            if (won) {
                                total_win += removed.amount
                                total_win_weighted += removed.amount * removed.probability/100

                                if (data.teams.includes(TEAM_RECURRING)) {
                                    total_win_recurring += removed.amount
                                    total_win_weighted_recurring += removed.amount * removed.probability/100
                                }
                                else if (data.teams.includes(TEAM_NON_RECURRING)) {
                                    total_win_non_recurring += removed.amount
                                    total_win_weighted_non_recurring += removed.amount * removed.probability/100
                                }
                            } else {
                                total_lost += removed.amount
                                total_lost_weighted += removed.amount * removed.probability/100

                                if (data.teams.includes(TEAM_RECURRING)) {
                                    total_lost_recurring += removed.amount
                                    total_lost_weighted_recurring += removed.amount * removed.probability/100
                                }
                                else if (data.teams.includes(TEAM_NON_RECURRING)) {
                                    total_lost_non_recurring += removed.amount
                                    total_lost_weighted_non_recurring += removed.amount * removed.probability/100
                                }
                            }
                        }
                    }

                    rows.push(
                        [team.name, "Récurrent", "Delta pipe pondéré", "LOST", "WIN", "NEW", "Evolution", "WIN non pondéré", "LOST non pondéré", "Total pipe non pondéré", "Total pipe pondéré" ]
                    )

                    rows.push([
                        "", "", Math.round(total_delta_recurring + total_new_recurring_weighted - total_lost_weighted_recurring - total_win_weighted_recurring), total_lost_weighted_recurring, total_win_weighted_recurring, total_new_recurring_weighted, Math.round(total_delta_recurring), total_win_recurring, total_lost_recurring, total_recurring, total_recurring_weighted 
                    ])

                    rows.push([])

                    rows.push(
                        ["", "Non récurrent", "Delta pipe pondéré", "LOST", "WIN", "NEW", "Evolution", "WIN non pondéré", "LOST non pondéré", "Total pipe non pondéré", "Total pipe pondéré" ]
                    )

                    rows.push([
                        "", "", Math.round(total_delta_non_recurring + total_new_non_recurring_weighted - total_lost_weighted_non_recurring - total_win_weighted_non_recurring), total_lost_weighted_non_recurring, total_win_weighted_non_recurring, total_new_non_recurring_weighted, Math.round(total_delta_non_recurring), total_win_non_recurring, total_lost_non_recurring, total_non_recurring, total_non_recurring_weighted
                    ])

                    rows.push([], [])
                }

                let csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
                var encodedUri = encodeURI(csvContent);
                var link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                console.log(this.screenshot1)
                link.setAttribute("download", `${moment(s1.date).format("YYYYMMDDHHMM")}--${moment(s2.date).format("YYYYMMDDHHMM")}.csv`);
                link.click();
            }
            finally {
                dialog.close()
            }
        },
        async exportXLS(dialog) {
            console.log("test")
            try {
                const ExcelJS = require('exceljs');

                console.log(ExcelJS)

                const s1 = this.screenshots.find(e => e.id === this.screenshot1)
                const s2 = this.screenshots.find(e => e.id === this.screenshot2)
                console.log(s1)

                const workbook = new ExcelJS.Workbook();
                const sheet = workbook.addWorksheet('Screenshot details');
                sheet.properties.defaultColWidth = 20
                sheet.properties.defaultRowHeight = 20
                new Array("E", "F", "G").map(k => sheet.getColumn(k).width = 10)
                new Array("B").map(k => sheet.getColumn(k).width = 12)
                new Array("C", "D").map(k => sheet.getColumn(k).width = 15)

                let row = sheet.addRow(["Practice"])
                row.getCell("A").font = { bold: true }
                row.getCell("A").fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: "FFD9D9D9" } }

                const result_all = await this.retrieveAllOpportunities()
                console.log(result_all)
                
                for (let team of TEAMS) {
                    let s1_values = s1.values.filter(e => e.teams.indexOf(team.id) !== -1)
                    let s2_values = s2.values.filter(e => e.teams.indexOf(team.id) !== -1)
                    
                    let total_win = 0, total_lost = 0;
                    let total_win_weighted = 0, total_lost_weighted = 0;
                    let total_new_weighted = 0
                    let total_delta = 0

                    let total_recurring_weighted = 0, total_non_recurring_weighted = 0
                    let total_recurring = 0, total_non_recurring = 0
                    let total_delta_recurring = 0, total_delta_non_recurring = 0
                    let total_win_recurring = 0, total_win_non_recurring = 0
                    let total_win_weighted_recurring = 0, total_win_weighted_non_recurring = 0
                    let total_lost_recurring = 0, total_lost_non_recurring = 0
                    let total_lost_weighted_recurring = 0, total_lost_weighted_non_recurring = 0
                    let total_new_recurring_weighted = 0, total_new_non_recurring_weighted = 0

                    console.log(s1_values)

                    const IDs = []

                    for (let new_s of s2_values) {
                        IDs.push(new_s.id)
                        if (new_s.teams.includes(TEAM_RECURRING)) {
                            total_recurring += new_s.amount
                            total_recurring_weighted += new_s.amount * new_s.probability/100
                        }
                        else if (new_s.teams.includes(TEAM_NON_RECURRING)) {
                            total_non_recurring += new_s.amount
                            total_non_recurring_weighted += new_s.amount * new_s.probability/100
                        }

                        const prev = s1_values.find(e => e.id == new_s.id)

                        if (prev) {
                            const old_weighted_value = prev.amount * prev.probability/100
                            const new_weighted_value = new_s.amount * new_s.probability/100
                            total_delta += new_weighted_value - old_weighted_value

                            if (new_s.teams.includes(TEAM_RECURRING)) {
                                total_delta_recurring += new_weighted_value - old_weighted_value
                            }
                            else if (new_s.teams.includes(TEAM_NON_RECURRING)) {
                                total_delta_non_recurring += new_weighted_value - old_weighted_value
                            }
                        } else {
                            total_new_weighted += new_s.amount * new_s.probability/100
                            if (new_s.teams.includes(TEAM_RECURRING)) {
                                total_new_recurring_weighted += new_s.amount * new_s.probability/100
                            }
                            else if (new_s.teams.includes(TEAM_NON_RECURRING)) {
                                total_new_non_recurring_weighted += new_s.amount * new_s.probability/100
                            }
                        }
                    }

                    const removed_values = s1_values.filter(e => IDs.indexOf(e.id) === -1)
                    for (let removed of removed_values) {
                        const data = result_all.find(e => e.id === removed.id)
                        if (data) {
                            const won = data.status === "won";
                            if (won) {
                                total_win += removed.amount
                                total_win_weighted += removed.amount * removed.probability/100

                                if (data.teams.includes(TEAM_RECURRING)) {
                                    total_win_recurring += removed.amount
                                    total_win_weighted_recurring += removed.amount * removed.probability/100
                                }
                                else if (data.teams.includes(TEAM_NON_RECURRING)) {
                                    total_win_non_recurring += removed.amount
                                    total_win_weighted_non_recurring += removed.amount * removed.probability/100
                                }
                            } else {
                                total_lost += removed.amount
                                total_lost_weighted += removed.amount * removed.probability/100

                                if (data.teams.includes(TEAM_RECURRING)) {
                                    total_lost_recurring += removed.amount
                                    total_lost_weighted_recurring += removed.amount * removed.probability/100
                                }
                                else if (data.teams.includes(TEAM_NON_RECURRING)) {
                                    total_lost_non_recurring += removed.amount
                                    total_lost_weighted_non_recurring += removed.amount * removed.probability/100
                                }
                            }
                        }
                    }

                    /** RECURRING ROW */
                    row = sheet.addRow([team.name, "Récurrent", "Δ pipe pondéré", "LOST", "WIN", "NEW", "Evolution", "WIN non pondéré", "LOST non pondéré", "Total pipe non pondéré", "Total pipe pondéré"])
                    row.getCell("A").font = { bold: true, size: 9 }
                    row.getCell("A").fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: "FFD9D9D9" } }
                    row.getCell('B').font = { italic: true, size: 9 }
                    row.getCell('F').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: "FFFFFF00" } }
                    new Array("C", "D", "E", "F").map(k => {
                        row.getCell(k).font = { bold: true }
                    })
                    new Array("C", "D", "E", "F", "G", "H", "I", "J", "K").map(k => {
                        row.getCell(k).border = {
                        top: {style:'hair'},
                        left: {style:'hair'},
                        bottom: {style:'hair'},
                        right: {style:'hair'}
                        }
                    })

                    row = sheet.addRow(
                        ["", "", Math.round(total_delta_recurring + total_new_recurring_weighted - total_lost_weighted_recurring - total_win_weighted_recurring), total_lost_weighted_recurring, total_win_weighted_recurring, total_new_recurring_weighted, Math.round(total_delta_recurring), total_win_recurring, total_lost_recurring, total_recurring, total_recurring_weighted]
                    )
                    new Array("C", "D", "E", "F", "G", "H", "I", "J", "K").map(k => {
                        row.getCell(k).border = {
                        top: {style:'hair'},
                        left: {style:'hair'},
                        bottom: {style:'hair'},
                        right: {style:'hair'}
                        }
                        row.getCell(k).numFmt = '# ##0'
                    })

                    sheet.addRow([])

                    row = sheet.addRow(
                        ["", "Non récurrent", "Δ pipe pondéré", "LOST", "WIN", "NEW", "Evolution", "WIN non pondéré", "LOST non pondéré", "Total pipe non pondéré", "Total pipe pondéré"]
                    )
                    row.getCell('B').font = { italic: true, size: 9 }
                    row.getCell('F').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: "FFFFFF00" } }
                    new Array("C", "D", "E", "F").map(k => {
                        row.getCell(k).font = { bold: true }
                    })
                    new Array("C", "D", "E", "F", "G", "H", "I", "J", "K").map(k => {
                        row.getCell(k).border = {
                        top: {style:'hair'},
                        left: {style:'hair'},
                        bottom: {style:'hair'},
                        right: {style:'hair'}
                        }
                    })

                    /** NON RECURRING ROW */
                    row = sheet.addRow(
                        ["", "", Math.round(total_delta_non_recurring + total_new_non_recurring_weighted - total_lost_weighted_non_recurring - total_win_weighted_non_recurring), total_lost_weighted_non_recurring, total_win_weighted_non_recurring, total_new_non_recurring_weighted, Math.round(total_delta_non_recurring), total_win_non_recurring, total_lost_non_recurring, total_non_recurring, total_non_recurring_weighted]
                    )
                    new Array("C", "D", "E", "F", "G", "H", "I", "J", "K").map(k => {
                        row.getCell(k).border = {
                        top: {style:'hair'},
                        left: {style:'hair'},
                        bottom: {style:'hair'},
                        right: {style:'hair'}
                        }
                        row.getCell(k).numFmt = '# ##0'
                    })

                    sheet.addRow([])
                    row = sheet.addRow(["", "Total", "Δ pipe pondéré", "Pipe pondéré"])
                    row.getCell("B").font = { bold: true }
                    row.getCell("C").font = { bold: true }
                    row.getCell("D").font = { bold: true }
                    row.getCell("C").fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: total_delta >= 0 ? "FFD9EAD3" : "FFF4CCCD" } }
                    new Array("C", "D").map(k => {
                        row.getCell(k).border = {
                        top: {style:'medium'},
                        left: {style:'medium'},
                        bottom: {style:'medium'},
                        right: {style:'medium'}
                        }
                    })
                    row = sheet.addRow(["", "", total_delta, total_recurring_weighted + total_non_recurring_weighted])
                    row.getCell("C").fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: total_delta >= 0 ? "FFD9EAD3" : "FFF4CCCD" } }
                    new Array("C", "D").map(k => {
                        row.getCell(k).border = {
                        top: {style:'medium'},
                        left: {style:'medium'},
                        bottom: {style:'medium'},
                        right: {style:'medium'}
                        }   
                        row.getCell(k).numFmt = '# ##0'
                    })

                    sheet.addRows([[], []])
                }

                // row = sheet.addRow(["", "Grand Total", 
                //     Math.round(total_delta + total_new_weighted - total_lost_weighted - total_win_weighted),
                //     total_lost_weighted, total_win_weighted,
                //     total_new_weighted,
                //     total_delta,
                //     total_win, total_lost,
                //     total_recurring + total_non_recurring,
                //     total_recurring_weighted + total_non_recurring_weighted
                // ])
                // row = sheet.addRow(["", "Récurrent", 
                //     Math.round(total_delta + total_new_weighted - total_lost_weighted - total_win_weighted),
                //     total_lost_weighted, total_win_weighted,
                //     total_new_weighted,
                //     total_delta,
                //     total_win, total_lost,
                //     total_recurring + total_non_recurring,
                //     total_recurring_weighted + total_non_recurring_weighted
                // ])

                const buffer = await workbook.xlsx.writeBuffer();

                const blob = new Blob([buffer], { type: 'application/vnd.ms-excel' })
                const url = URL.createObjectURL(blob)
                var link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `${moment(s1.date).format("YYYYMMDDHHMM")}--${moment(s2.date).format("YYYYMMDDHHMM")}.xlsx`);
                link.click();
            } catch(e) { console.error(e )}
            finally {
                dialog.close()
            }
        },
        async exportCSVFull(dialog) {
            try {
                const s1 = this.screenshots.find(e => e.id === this.screenshot1)
                const s2 = this.screenshots.find(e => e.id === this.screenshot2)

                const rows = [
                    [ "Practice", "Job name", "Type", "Date 1", "Status 1", "Amount 1", "Probability 1", "Created at 1", "Sale date 1", "Date 2", "Status 2", "Amount 2", "Probability 2", "Created at 2", "Sale date 2" ]
                ]

                const result_all = await this.retrieveAllOpportunities()

                for (let team of TEAMS) {
                    let s1_values = s1.values.filter(e => e.teams.indexOf(team.id) !== -1)
                    let s2_values = s2.values.filter(e => e.teams.indexOf(team.id) !== -1)

                    const IDs = []

                    for (let new_s of s2_values) {
                        IDs.push(new_s.id)
                        
                        const row = [ team.name, new_s.job_name, new_s.teams.includes(TEAM_RECURRING) ? "Recurring" : "Non recurring" ]

                        const prev = s1_values.find(e => e.id == new_s.id)

                        if (prev) {
                            row.push(s1.date, prev.status, prev.amount, prev.probability, prev.created_at, prev.sale)
                        } else {
                            row.push(s1.date, "", "", "", "", "")
                        }

                        row.push(s2.date, new_s.status, new_s.amount, new_s.probability, new_s.created_at, new_s.sale)

                        rows.push(row)
                    }

                    const removed_values = s1_values.filter(e => IDs.indexOf(e.id) === -1)
                    for (let removed of removed_values) {
                        const data = result_all.find(e => e.id === removed.id)
                        const won = data.status === "won";

                        const row = [ team.name, data.job_name, data.teams.includes(TEAM_RECURRING) ? "Recurring" : "Non recurring", s1.date, won ? "Won" : "Lost", removed.amount, removed.probability, removed.created_at, removed.sale ]

                        rows.push(row)
                    }
                }

                let csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
                var encodedUri = encodeURI(csvContent);
                var link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `${moment(s1.date).format("YYYYMMDDHHMM")}--${moment(s2.date).format("YYYYMMDDHHMM")}-full.csv`);
                link.click();
            }
            finally {
                dialog.close()
            }
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