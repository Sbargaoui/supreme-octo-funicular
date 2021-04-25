import moment from "moment"

import { teamIdFromName, columnNameFromID } from "./helpers"

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
            const button = $("<button>Générer un screenshot</button>").click(function(e) {
                e.preventDefault()
                const data = []
                $(".portlet").each((index, el) => {
                    const step_column = ($(el).parent().first()).attr("class").replace("ui-sortable", "").replace("pip_column", "").trim()
                    data.push({
                        id: $(el).attr("data-id"),
                        step_column,
                        step_name: $(".pipe_column_pipe").eq(parseInt(step_column.replace("col", "")-1)).find(".pipe_column_pipe3").clone().children().remove().end().text().trim(),
                        name: $(el).find(".portlet-header").text().trim(),
                        amount: parseFloat($(el).find(".portlet-content").children().first().text().replace("€", "").replace(" ", "")),
                        probability: parseFloat($(el).find(".portlet-content").children().eq(3).text().replace("%", "").replace(" ", ""))/100
                    })
                })
                chrome.runtime.sendMessage(extensionID, {
                    action: "db-insert",
                    value: {
                        company: $("select[name=team]").next().find(".select2-selection__rendered").first().text(),
                        date: new Date(),
                        values: data
                    }
                })
                alert("Le screenshot a été créé")
            })

            $("#formtabtab1").append(button).append(dropdownScreenshotList)
            buildScreenshotList()

            dropdownScreenshotList.change(() => {
                const id = dropdownScreenshotList.val()
                chrome.runtime.sendMessage(extensionID, {
                    action: "db-get",
                    id: parseInt(id)
                }, async screenshot => {
                    const teamName = $("select[name=team]").next().find(".select2-selection__rendered").first().text()
                    screenshot.values = screenshot.values.filter(e => e.teams.indexOf(teamIdFromName(teamName)) !== -1)
                    console.log(screenshot)

                    let total_win = 0, total_lost = 0;
                    let total_win_weighted = 0, total_lost_weighted = 0;
                    let total_new_weighted = 0
                    let total_delta = 0

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
                        IDs.push(id)
                        const prev = screenshot.values.find(e => e.id == id)

                        if (prev) {
                            prev.step_name = columnNameFromID(prev.column_id)
                            let changes = false, decrease = false, increase = false

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

                            total_new_weighted += new_amount * new_probability
                        }
                    })

                    const removed_values = screenshot.values.filter(e => IDs.indexOf(e.id.toString()) === -1)
                    console.log(removed_values)
                    for (let e of removed_values) {
                        console.log(e)
                        
                        console.log(token)
                        const data = await $.ajax({
                            url: "https://stafiz.net/api/opportunities/" + e.id,
                            headers: {
                                "Authorization": "Bearer " + token
                            }
                        })
                        
                        const won = data.length > 0 && data[0].status === "won";

                        if (won) {
                            total_win += e.amount
                            total_win_weighted += e.amount * e.probability
                        } else {
                            total_lost += e.amount
                            total_lost_weighted += e.amount * e.probability
                        }
                        
                        $(`<div class="portlet ui-widget ui-widget-content ui-helper-clearfix ui-corner-all extension-new" data-id="${e.id}" style="background-color: ${won ? '#9b59b6' : '#e55039'}">
                            <div class="extension portlet-header ui-sortable-handle ui-widget-header ui-corner-all">(${won ? 'Gagnée' : 'Perdue'})
                            ${e.name}
                            </div>
                            <div class="portlet-content">
                                <span class="g_nowrap">${formatCurrency(e.amount)}</span>
                                <br>
                                <span class="pipe_litgr">Probabilité : </span><span>${e.probability*100}%</span>
                                <br>
                                ${!won && data.length > 0 && data[0].reazon ? `Raison : ${JSON.parse(data[0].reazon).comment}` : ''}
                            </div>
                        </div>`).appendTo(`.${e.step_column}`)
                    }
                    $("#formtabtab1").after(`<div style='text-align:left;'>
                        <ul style='list-style: none;'>
                        <table>
                            <tr><td><b>Total WIN</b>&nbsp;&nbsp;</td><td>${formatCurrency(total_win)} (pondéré ${formatCurrency(total_win_weighted)})</td></tr>
                            <tr><td><b>Total LOST</b>&nbsp;&nbsp;</td><td>${formatCurrency(total_lost)} (pondéré ${formatCurrency(total_lost_weighted)})</td></tr>
                            <tr><td><b>Total NEW</b>&nbsp;&nbsp;</td><td>${formatCurrency(total_new_weighted)}</td></tr>
                            <tr><td><b>Évolution</b>&nbsp;&nbsp;</td><td>${formatCurrency(total_delta)}</td></tr>
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