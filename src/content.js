$(document).ready(function () {
    const extensionID = $('script[data-extension]').data('extension');
    console.log(extensionID)

    $(".pipe_litgr").next().filter((index, el) => {
        return parseInt(el.innerText.replace("%","")) > 10
    }).css("color", "green")

    const button = $("<button>Générer le screenshot</button>").click(function(e) {
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
        console.log({
            company: $("select[name=team]").next().find(".select2-selection__rendered").first().text(),
            data
        })
    })
    $("#formtabtab1").append(button)
})