import moment from "moment"

import { teamIdFromName, columnNameFromID, TEAMS, TEAM_RECURRING, TEAM_NON_RECURRING } from "./helpers"

const dropdownScreenshotList = $('<select style="margin-right: 10px;" />');

const extensionID = $('script[data-extension]').data('extension');
console.log(extensionID)

function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount)
}

const CardsColor = {
    CHANGE: '#F79F1F',
    CHANGE_DECREASE: "#fd79a8",
    CHANGE_INCREASE: '#78e08f',
    NEW: "#fffa65",
    WON: '#cd84f1',
    LOST: '#e55039'
}

$(`<style type='text/css'>
#report table, #report th, #report td {
    border: 1px solid black;
    padding: 10px;
}
#report table {
    border-collapse: collapse;
}</style>`).appendTo("head");

$(document).ready(function () {
    chrome.runtime.sendMessage(extensionID, {
        action: "get-token"
    }, async token => {
        if (token) {
            $("#formtabtab1").append(dropdownScreenshotList)
            buildScreenshotList()

            dropdownScreenshotList.change(async () => {
                const all_opportunities = []
                let next_url = "https://stafiz.net/api/opportunities"
                do {
                    const result = await $.ajax({
                        url: next_url,
                        headers: {
                            Authorization: "Bearer " + token
                        }
                    })
                    all_opportunities.push(...result.data)
                    next_url = result.next_page_url
                } while(next_url)
                
                const id = dropdownScreenshotList.val()
                chrome.runtime.sendMessage(extensionID, {
                    action: "db-get",
                    id: parseInt(id)
                }, async screenshot => {
                    const teamName = $("select[name=team]").next().find(".select2-selection__rendered").first().text()
                    console.log(teamName)
                    if (teamName !== "Entreprise") {
                        screenshot.values = screenshot.values.filter(e => e.teams.indexOf(teamIdFromName(teamName)) !== -1)
                    } else {
                        console.log("loading")
                        screenshot.values = screenshot.values.filter(e => {
                            return (e.teams.filter(t => TEAMS.find(T => t === T.id) != -1)).length > 0
                        })
                    }
                    console.log(screenshot)

                    let total_win = 0, total_lost = 0;
                    let total_win_weighted = 0, total_lost_weighted = 0;
                    let total_new_weighted = 0
                    let total_delta = 0

                    /**/ let total_recurring_weighted = 0, total_non_recurring_weighted = 0
                    /**/ let total_recurring = 0, total_non_recurring = 0
                    /**/ let total_delta_recurring = 0, total_delta_non_recurring = 0
                    /**/ let total_win_recurring = 0, total_win_non_recurring = 0
                    /**/ let total_win_weighted_recurring = 0, total_win_weighted_non_recurring = 0
                    /**/ let total_lost_recurring = 0, total_lost_non_recurring = 0
                    /**/ let total_lost_weighted_recurring = 0, total_lost_weighted_non_recurring = 0
                    /**/ let total_new_recurring_weighted = 0, total_new_non_recurring_weighted = 0


                    const IDs = []

                    $('.extension').remove()
                    $('.portlet').css('background-color', '')
                    $('.portlet').removeClass("extension-new")
                    $('.portlet').removeClass("extension-changes")
                    $(".portlet").each((index, el) => {
                        const new_amount = parseFloat($(el).find(".portlet-content").children().first().text().replace("€", "").replace(" ", ""))
                        const new_probability = parseFloat($(el).find(".portlet-content").children().eq(3).text().replace("%", "").replace(" ", ""))
                        const new_step_column = ($(el).parent().first()).attr("class").replace("ui-sortable", "").replace("pip_column", "").trim()
                        const new_step = $(".pipe_column_pipe").eq(parseInt(new_step_column.replace("col", "")-1)).find(".pipe_column_pipe3").clone().children().remove().end().text().trim()

                        const new_weighted_value = new_amount*new_probability/100

                        $(el).find(".portlet-content").children().eq(3).after(`<br class="extension" /><span class="extension weighted">Valeur pondérée : ${formatCurrency(new_weighted_value)}</span>`)

                        const id = $(el).attr("data-id")

                        const opp = all_opportunities.find(e => e.id === parseInt(id))
                        opp.teams = JSON.parse(opp.teams)
                        if (opp.teams.includes(TEAM_RECURRING)) {
                            total_recurring_weighted += parseFloat(opp.amount) * opp.chances/100
                            total_recurring += parseFloat(opp.amount)
                        }
                        else if (opp.teams.includes(TEAM_NON_RECURRING)) {
                            total_non_recurring_weighted += parseFloat(opp.amount) * opp.chances/100
                            total_non_recurring += parseFloat(opp.amount)
                        }

                        IDs.push(id)
                        const prev = screenshot.values.find(e => e.id == id)

                        if (prev) {
                            prev.step_name = columnNameFromID(prev.column_id)
                            let changes = false, decrease = false, increase = false

                            console.log(new_amount, new_probability)

                            // if (prev.teams.includes(TEAM_RECURRING)) total_recurring += new_amount * new_probability/100
                            // else if (prev.teams.includes(TEAM_NON_RECURRING)) total_non_recurring += new_amount * new_probability/100

                            const old_weighted_value = prev.amount * prev.probability/100
                            if (new_weighted_value != old_weighted_value) {
                                let icon = ''
                                if (old_weighted_value < new_weighted_value) icon = '➚'
                                else if (old_weighted_value > new_weighted_value) icon = '➘'
                                $(el).find(".portlet-content").find(".weighted").append(`${icon} (prec. ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(old_weighted_value)})<br /><b>Delta pondéré : ${formatCurrency(new_weighted_value - old_weighted_value)}</b>`)
                                total_delta += new_weighted_value - old_weighted_value

                                if (opp.teams.includes(TEAM_RECURRING)) {
                                    total_delta_recurring += new_weighted_value - old_weighted_value
                                }
                                else if (opp.teams.includes(TEAM_NON_RECURRING)) {
                                    total_delta_non_recurring += new_weighted_value - old_weighted_value
                                }
                            }

                            if (prev.amount != new_amount) {
                                let icon = ''
                                if (prev.amount < new_amount) {
                                    icon = '➚'
                                    increase = true
                                }
                                else if (prev.amount > new_amount) {
                                    icon = '➘'
                                    decrease = true
                                }
                                $(el).find(".portlet-content").children().first().append(`<span class='extension'>${icon} (prec. ${formatCurrency(prev.amount)})</span>`)
                                changes = true
                            }
                            if (prev.probability != new_probability) {
                                let icon = ''
                                if (prev.probability < new_probability) {
                                    icon = '➚'
                                    increase = true
                                }
                                else if (prev.probability > new_probability) {
                                    icon = '➘'
                                    decrease = true
                                }
                                $(el).find(".portlet-content").children().eq(3).append(`<span class='extension'>${icon} (prec. ${prev.probability}%)</span>`)
                                changes = true
                            }
                            if (prev.step_name != new_step) {
                                $(el).find(".portlet-content").children().eq(3).after(`<br class="extension" /><span class="extension">${prev.step_name} → ${new_step}</span>`)
                                changes = true
                            }

                            if (changes) {
                                $(el).css("background-color", decrease ? CardsColor.CHANGE_DECREASE : increase ? CardsColor.CHANGE_INCREASE : CardsColor.CHANGE)
                                $(el).addClass("extension-changes")
                            }
                        } else {
                            $(el).css("background-color", CardsColor.NEW)
                            $(el).find('.portlet-header').prepend("<span class='extension'>(new) </span>")
                            $(el).addClass("extension-new")

                            total_new_weighted += new_amount * new_probability/100
                            if (opp.teams.includes(TEAM_RECURRING)) {
                                total_new_recurring_weighted += new_amount * new_probability/100
                            }
                            else if (opp.teams.includes(TEAM_NON_RECURRING)) {
                                total_new_non_recurring_weighted += new_amount * new_probability/100
                            }
                        }
                    })
                    const removed_values = screenshot.values.filter(e => IDs.indexOf(e.id.toString()) === -1)
                    console.log(removed_values)
                    for (let e of removed_values) {
                        console.log(e)
                        const data = await $.ajax({
                            url: "https://stafiz.net/api/opportunities/" + e.id,
                            headers: {
                                "Authorization": "Bearer " + token
                            }
                        })

                        if(data[0]) {
                            const data_client = await $.ajax({
                                url: "https://stafiz.net/api/crmorgas/" + data[0].client_company,
                                headers: {
                                    "Authorization": "Bearer " + token
                                }
                            })
                            data[0].teams = JSON.parse(data[0].teams)
                            const column = $(`input[value="${e.column_id}"]`).attr("id").replace("colorder_of_", "")
                            const won = data.length > 0 && data[0].status === "won";

                            if (won) {
                                total_win += e.amount
                                total_win_weighted += e.amount * e.probability/100

                                if (data[0].teams.includes(TEAM_RECURRING)) {
                                    total_win_recurring += e.amount
                                    total_win_weighted_recurring = e.amount * e.probability/100
                                }
                                else if (data[0].teams.includes(TEAM_NON_RECURRING)) {
                                    total_win_non_recurring += e.amount
                                    total_win_weighted_non_recurring = e.amount * e.probability/100
                                }
                            } else {
                                total_lost += e.amount
                                total_lost_weighted += e.amount * e.probability/100

                                if (data[0].teams.includes(TEAM_RECURRING)) {
                                    total_lost_recurring += e.amount
                                    total_lost_weighted_recurring = e.amount * e.probability/100
                                }
                                else if (data[0].teams.includes(TEAM_NON_RECURRING)) {
                                    total_lost_non_recurring += e.amount
                                    total_lost_weighted_non_recurring = e.amount * e.probability/100
                                }
                            }
                            
                            $(`<div class="portlet ui-widget ui-widget-content ui-helper-clearfix ui-corner-all extension-new" data-id="${e.id}" style="background-color: ${won ? CardsColor.WON : CardsColor.LOST}">
                                <div class="extension portlet-header ui-sortable-handle ui-widget-header ui-corner-all">(${won ? 'Gagnée' : 'Perdue'})
                                ${data_client[0].name} - ${e.job_name}
                                </div>
                                <div class="portlet-content">
                                    <span class="g_nowrap">${formatCurrency(e.amount)}</span>
                                    <br>
                                    <span class="pipe_litgr">Probabilité : </span><span>${e.probability}%</span>
                                    <br>
                                    ${!won && data.length > 0 && data[0].reazon ? `Raison : ${JSON.parse(data[0].reazon).select}${JSON.parse(data[0].reazon).comment ? ` / ${JSON.parse(data[0].reazon).comment}` : ''}` : ''}
                                </div>
                            </div>`).appendTo(`.col${column}`)
                        }
                    }
                    $("#formtabtab1").after(`<div style='text-align:left;'>
                        <ul style='list-style: none;'>
                        <table>
                            <tr><td><b>Total WIN</b>&nbsp;&nbsp;</td><td>${formatCurrency(total_win)} (pondéré ${formatCurrency(total_win_weighted)})</td></tr>
                            <tr><td><b>Total LOST</b>&nbsp;&nbsp;</td><td>${formatCurrency(total_lost)} (pondéré ${formatCurrency(total_lost_weighted)})</td></tr>
                            <tr><td><b>Total NEW</b>&nbsp;&nbsp;</td><td>${formatCurrency(total_new_weighted)}</td></tr>
                            <tr><td><b>Évolution</b>&nbsp;&nbsp;</td><td>${formatCurrency(total_delta)}</td></tr>
                            <tr><td><b>Évolution TOTAL</b>&nbsp;&nbsp;</td><td>${formatCurrency(total_delta + total_new_weighted - total_win_weighted - total_lost_weighted)}</td></tr>
                            <tr><td><b>Total récurrent</b>&nbsp;&nbsp;</td><td>${formatCurrency(total_recurring)}</td></tr>
                            <tr><td><b>Total non récurrent</b>&nbsp;&nbsp;</td><td>${formatCurrency(total_non_recurring)}</td></tr>
                        </table>

                        <table id="report" style="margin-top: 10px;">
                            <tr>
                                <td></td>
                                <td><b>Evolution pipe pondéré</b></td>
                                <td style="background-color: ${CardsColor.LOST}"><b>LOST</b></td>
                                <td style="background-color: ${CardsColor.WON}"><b>WIN</b></td>
                                <td style="background-color: ${CardsColor.NEW}"><b>NEW</b></td>
                                <td><b>Evolution</b></td>
                                <td ><b>WIN non pondéré</b></td>
                                <td><b>LOST non pondéré</b></td>
                                <td><b>Total pipe non pondéré</b></td>
                                <td><b>Total pipe pondéré</b></td>
                            </tr>
                            <tr>
                                <td><b>Récurrent</b></td>
                                <td>${formatCurrency(total_delta_recurring + total_new_recurring_weighted - total_lost_weighted_recurring - total_win_weighted_recurring)}</td>
                                <td>${formatCurrency(total_lost_weighted_recurring)}</td>
                                <td>${formatCurrency(total_win_weighted_recurring)}</td>
                                <td>${formatCurrency(total_new_recurring_weighted)}</td>
                                <td>${formatCurrency(total_delta_recurring)}</td>
                                <td>${formatCurrency(total_win_recurring)}</td>
                                <td>${formatCurrency(total_lost_recurring)}</td>
                                <td>${formatCurrency(total_recurring)}</td>
                                <td>${formatCurrency(total_recurring_weighted)}</td>
                            </tr>
                            <tr>
                                <td><b>Non récurrent</b></td>
                                <td>${formatCurrency(total_delta_non_recurring + total_new_non_recurring_weighted - total_lost_weighted_non_recurring - total_win_weighted_non_recurring)}</td>
                                <td>${formatCurrency(total_lost_weighted_non_recurring)}</td>
                                <td>${formatCurrency(total_win_weighted_non_recurring)}</td>
                                <td>${formatCurrency(total_new_non_recurring_weighted)}</td>
                                <td>${formatCurrency(total_delta_non_recurring)}</td>
                                <td>${formatCurrency(total_win_non_recurring)}</td>
                                <td>${formatCurrency(total_lost_non_recurring)}</td>
                                <td>${formatCurrency(total_non_recurring)}</td>
                                <td>${formatCurrency(total_non_recurring_weighted)}</td>
                            </tr>
                        </table>
                    </div>`)

                    $(".extension-changes").each((index, el) => {
                        $(el).parent().prepend(el)
                    })
                    $(".extension-new").each((index, el) => {
                        $(el).parent().prepend(el)
                    })
                })
            })
        } else {
            $("#formtabtab1").append("<p>Pour utiliser l'extension, connectez-vous dans les paramètres</p>")
        }
    })
})

function buildScreenshotList() {
    // Selected company
    // $("select[name=team]").next().find(".select2-selection__rendered").first().text()
    chrome.runtime.sendMessage(extensionID, {
        action: "db-select",
        where: {
            company: "All"
        }
    }, screenshots => {
        console.log(screenshots)
        $('<option disabled selected value> -- sélectionnez un screenshot -- </option>').appendTo(dropdownScreenshotList);
        for(let val of screenshots) {
            $('<option />', {value: val.id, text: `${moment(val.date).fromNow()} - ${moment(val.date).format("DD/MM/YYYY HH:mm")}`}).appendTo(dropdownScreenshotList);
        }
    })
}