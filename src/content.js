import moment from "moment"

const dropdownScreenshotList = $('<select style="margin-right: 10px;" />');

const extensionID = $('script[data-extension]').data('extension');
console.log(extensionID)

$(document).ready(function () {
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
    })

    $("#formtabtab1").append(button).append(dropdownScreenshotList)
    buildScreenshotList()

    dropdownScreenshotList.change(() => {
        const id = dropdownScreenshotList.val()
        chrome.runtime.sendMessage(extensionID, {
            action: "db-get",
            id: parseInt(id)
        }, screenshot => {
            console.log(screenshot)

            const IDs = []

            $('.extension').remove()
            $('.portlet').css('background-color', '')
            $('.portlet').removeClass("extension-new")
            $('.portlet').removeClass("extension-changes")
            $(".portlet").each((index, el) => {
                const new_amount = parseFloat($(el).find(".portlet-content").children().first().text().replace("€", "").replace(" ", ""))
                const new_probability = parseFloat($(el).find(".portlet-content").children().eq(3).text().replace("%", "").replace(" ", ""))/100
                const new_step_column = ($(el).parent().first()).attr("class").replace("ui-sortable", "").replace("pip_column", "").trim()
                const new_step = $(".pipe_column_pipe").eq(parseInt(new_step_column.replace("col", "")-1)).find(".pipe_column_pipe3").clone().children().remove().end().text().trim()

                const new_weighted_value = new_amount*new_probability

                $(el).find(".portlet-content").children().eq(3).after(`<br class="extension" /><span class="extension weighted">Valeur pondérée : ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(new_weighted_value)}</span>`)

                const id = $(el).attr("data-id")
                IDs.push(id)
                const prev = screenshot.values.find(e => e.id === id)

                if (prev) {
                    let changes = false

                    const old_weighted_value = prev.amount * prev.probability
                    if (new_weighted_value != old_weighted_value) {
                        let icon = ''
                        if (old_weighted_value < new_weighted_value) icon = '➚'
                        else if (old_weighted_value > new_weighted_value) icon = '➘'
                        $(el).find(".portlet-content").find(".weighted").append(`${icon} (prev ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(old_weighted_value)})`)
                    }

                    if (prev.amount != new_amount) {
                        let icon = ''
                        if (prev.amount < new_amount) icon = '➚'
                        else if (prev.amount > new_amount) icon = '➘'
                        $(el).find(".portlet-content").children().first().append(`<span class='extension'>${icon} (prev ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(prev.amount)})</span>`)
                        changes = true
                    }
                    if (prev.probability != new_probability) {
                        let icon = ''
                        if (prev.probability < new_probability) icon = '➚'
                        else if (prev.probability > new_probability) icon = '➘'
                        $(el).find(".portlet-content").children().eq(3).append(`<span class='extension'>${icon} (prev ${prev.probability*100}%)</span>`)
                        changes = true
                    }
                    if (prev.step_name != new_step) {
                        $(el).find(".portlet-content").children().eq(3).after(`<br class="extension" /><span class="extension">${prev.step_name} → ${new_step}</span>`)
                        changes = true
                    }

                    if (changes) {
                        $(el).css("background-color", "#f6b93b")
                        $(el).addClass("extension-changes")
                    }
                } else {
                    $(el).css("background-color", "#78e08f")
                    $(el).find('.portlet-header').prepend("<span class='extension'>(new) </span>")
                    $(el).addClass("extension-new")
                }
            })

            const removed_values = screenshot.values.filter(e => IDs.indexOf(e.id) === -1)
            console.log(removed_values)
            for (let e of removed_values) {
                $(`<div class="portlet ui-widget ui-widget-content ui-helper-clearfix ui-corner-all extension-new" data-id="${e.id}" style="background-color: #e55039">
                    <div class="extension portlet-header ui-sortable-handle ui-widget-header ui-corner-all">(deleted)
                    ${e.name}
                    </div>
                    <div class="portlet-content">
                        <span class="g_nowrap">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(e.amount)}</span>
                        <br>
                        <span class="pipe_litgr">Probabilité : </span><span>${e.probability*100}%</span>
                        <br>
                    </div>
                </div>`).appendTo(`.${e.step_column}`)
            }

            $(".extension-changes").each((index, el) => {
                $(el).parent().prepend(el)
            })
            $(".extension-new").each((index, el) => {
                $(el).parent().prepend(el)
            })
        })
    })
})

function buildScreenshotList() {
    chrome.runtime.sendMessage(extensionID, {
        action: "db-select",
        where: {
            company: $("select[name=team]").next().find(".select2-selection__rendered").first().text()
        }
    }, screenshots => {
        console.log(screenshots)
        $('<option  disabled selected value> -- sélectionnez un screenshot -- </option>').appendTo(dropdownScreenshotList);
        for(let val of screenshots) {
            $('<option />', {value: val.id, text: `${moment(val.date).fromNow()} - ${moment(val.date).format("DD/MM/YYYY HH:mm")}`}).appendTo(dropdownScreenshotList);
        }
    })
}