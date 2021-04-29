import moment from "moment"

import { teamIdFromName, columnNameFromID, TEAMS, TEAM_RECURRING, TEAM_NON_RECURRING } from "./helpers"

const dropdownScreenshotList = $('<select style="margin-right: 10px;" />');

const extensionID = $('script[data-extension]').data('extension');
console.log(extensionID)

function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount)
}

$(document).ready(function () {
    chrome.runtime.sendMessage(extensionID, {
        action: "get-token"
    }, async token => {
        if (token) {
            $("#formtabtab1").append(dropdownScreenshotList)
            buildScreenshotList()

            dropdownScreenshotList.change(() => {
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

                    let total_recurring = 0, total_non_recurring = 0

                    const IDs = []

                    $('.extension').remove()
                    $('.portlet').css('background-color', '')
                    $('.portlet').removeClass("extension-new")
                    $('.portlet').removeClass("extension-changes")
                    const promises = []
                    $(".portlet").each((index, el) => {
                        const new_amount = parseFloat($(el).find(".portlet-content").children().first().text().replace("€", "").replace(" ", ""))
                        const new_probability = parseFloat($(el).find(".portlet-content").children().eq(3).text().replace("%", "").replace(" ", ""))
                        const new_step_column = ($(el).parent().first()).attr("class").replace("ui-sortable", "").replace("pip_column", "").trim()
                        const new_step = $(".pipe_column_pipe").eq(parseInt(new_step_column.replace("col", "")-1)).find(".pipe_column_pipe3").clone().children().remove().end().text().trim()

                        const new_weighted_value = new_amount*new_probability/100

                        $(el).find(".portlet-content").children().eq(3).after(`<br class="extension" /><span class="extension weighted">Valeur pondérée : ${formatCurrency(new_weighted_value)}</span>`)

                        const id = $(el).attr("data-id")
                        IDs.push(id)
                        const prev = screenshot.values.find(e => e.id == id)

                        if (prev) {
                            prev.step_name = columnNameFromID(prev.column_id)
                            let changes = false, decrease = false, increase = false

                            if (prev.teams.includes(TEAM_RECURRING)) total_recurring = prev.amount * prev.probability/100
                            else if (prev.teams.includes(TEAM_NON_RECURRING)) total_non_recurring = prev.amount * prev.probability/100

                            const old_weighted_value = prev.amount * prev.probability/100
                            if (new_weighted_value != old_weighted_value) {
                                let icon = ''
                                if (old_weighted_value < new_weighted_value) icon = '➚'
                                else if (old_weighted_value > new_weighted_value) icon = '➘'
                                $(el).find(".portlet-content").find(".weighted").append(`${icon} (prec. ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(old_weighted_value)})<br />Delta pondéré : ${formatCurrency(new_weighted_value - old_weighted_value)}`)
                                total_delta += new_weighted_value - old_weighted_value
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
                                $(el).css("background-color", decrease ? "#fd79a8" : increase ? '#2ecc71' : '#F79F1F')
                                $(el).addClass("extension-changes")
                            }
                        } else {
                            $(el).css("background-color", "#FFC312")
                            $(el).find('.portlet-header').prepend("<span class='extension'>(new) </span>")
                            $(el).addClass("extension-new")

                            promises.push($.ajax({
                                url: "https://stafiz.net/api/opportunities/" + id,
                                headers: {
                                    "Authorization": "Bearer " + token
                                }
                            }))

                            total_new_weighted += new_amount * new_probability/100
                        }
                    })
                    const new_data = await $.when(...promises).then((...results) => results)
                    $.each(new_data, (_, data) => {
                        if (JSON.parse(data[0][0].teams).includes(TEAM_RECURRING)) total_recurring += parseFloat(data[0][0].amount) * data[0][0].chances/100
                        else if (JSON.parse(data[0][0].teams).includes(TEAM_NON_RECURRING)) total_non_recurring += parseFloat(data[0][0].amount) * data[0][0].chances/100
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

                        const column = $(`input[value="${e.column_id}"]`).attr("id").replace("colorder_of_", "")
                        const won = data.length > 0 && data[0].status === "won";

                        if (won) {
                            total_win += e.amount
                            total_win_weighted += e.amount * e.probability/100
                        } else {
                            total_lost += e.amount
                            total_lost_weighted += e.amount * e.probability/100
                        }
                        
                        $(`<div class="portlet ui-widget ui-widget-content ui-helper-clearfix ui-corner-all extension-new" data-id="${e.id}" style="background-color: ${won ? '#9b59b6' : '#e55039'}">
                            <div class="extension portlet-header ui-sortable-handle ui-widget-header ui-corner-all">(${won ? 'Gagnée' : 'Perdue'})
                            ${e.job_name}
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
                    $("#formtabtab1").after(`<div style='text-align:left;'>
                        <ul style='list-style: none;'>
                        <table>
                            <tr><td><b>Total WIN</b>&nbsp;&nbsp;</td><td>${formatCurrency(total_win)} (pondéré ${formatCurrency(total_win_weighted)})</td></tr>
                            <tr><td><b>Total LOST</b>&nbsp;&nbsp;</td><td>${formatCurrency(total_lost)} (pondéré ${formatCurrency(total_lost_weighted)})</td></tr>
                            <tr><td><b>Total NEW</b>&nbsp;&nbsp;</td><td>${formatCurrency(total_new_weighted)}</td></tr>
                            <tr><td><b>Évolution</b>&nbsp;&nbsp;</td><td>${formatCurrency(total_delta)}</td></tr>
                            <tr><td><b>Total récurrent</b>&nbsp;&nbsp;</td><td>${formatCurrency(total_recurring)}</td></tr>
                            <tr><td><b>Total non récurrent</b>&nbsp;&nbsp;</td><td>${formatCurrency(total_non_recurring)}</td></tr>
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
        $('<option  disabled selected value> -- sélectionnez un screenshot -- </option>').appendTo(dropdownScreenshotList);
        for(let val of screenshots) {
            $('<option />', {value: val.id, text: `${moment(val.date).fromNow()} - ${moment(val.date).format("DD/MM/YYYY HH:mm")}`}).appendTo(dropdownScreenshotList);
        }
    })
}