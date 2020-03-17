var globalChartElem = document.getElementById('globalChart').getContext('2d');

$("#country_selector").countrySelect({
    excludeCountries: ["AS", "AO", "AI", "AX", "BB", "BZ", "BJ", "BM", "BQ", "BW", "IO", "IM", "VG", "CG", "BN", "MM", "BI", "CC", "CV", "ID", "KM", "CK", "GS", "CW", "CX", "DJ", "DM", "SV", "ER", "FK", "FO", "FM", "FJ", "GF", "PF", "GI", "GL", "GD", "GU", "GW", "HT", "HK", "KI", "KY", "KG", "LA", "LS", "LR", "LY", "MO", "MG", "MW", "ML", "MH", "MU", "YT", "ME", "MS", "MZ", "NR", "AN", "NC", "NI", "NE", "NU", "NF", "KP", "MP", "PW", "PG", "PR", "RE", "BL", "SH", "KN", "MF", "PM", "WS", "ST", "SL", "SX", "SB", "SO", "SS", "SY", "TW", "TJ", "TZ", "BS", "GM", "TL", "TK", "TO", "TM", "TC", "TD", "TV", "UG", "UM", "VI", "VU", "VA", "WF", "EH", "YE", "ZM", "ZW"]
});

let stats = JSON.parse($("#stats-p").text());
$("#stats-p").remove();
// console.log(stats);
let text = JSON.parse($("#texts").text());
$("#texts").remove();

$("#country_selector").on("change", function(){
    updateCountry();
    $.ajax({
        url: "/" + localCountry,
        success: function(xhr, status){
            try {
                stats = JSON.parse(xhr.responseText);
            } catch(e){
                stats = xhr;
            }
            // console.log(stats);
            globalChart.data.datasets[0].label = `${text.CONFIRMED} ${localCountry}`;
            globalChart.data.datasets[0].data = stats.map(stat => stat.confirmed);
            globalChart.data.datasets[1].label = `${text.RECOVERIES} ${localCountry}`;
            globalChart.data.datasets[1].data = stats.map(stat => stat.recovered);
            globalChart.data.datasets[2].label = `${text.DEATHS} ${localCountry}`;
            globalChart.data.datasets[2].data = stats.map(stat => stat.deaths);
            globalChart.update();
        },
        error: function(xhr,status,error){
            alert(`${xhr.status} ${xhr.statusText}, ${text.CANT_REQUEST} /${localCountry}: ${xhr.responseText}. ${text.ERROR_LETMEKNOW}`);
        }
    });
    // console.log(localCountry);
})

$("#country_selector").on('keypress',function(e) {
    if(e.which == 13) {
        $(this).blur();
    }
});

if(localCountry != "404"){
    $("#country_selector").countrySelect("setCountry", localCountry);
} else {
    updateCountry();
}

function updateCountry(){
    localCountry = $("#country_selector").countrySelect("getSelectedCountryData").name.replace(/ *\([^)]*\) */g, "");
}

var globalChart = new Chart(globalChartElem, {
    type: 'line',
    data: {
        labels: stats.map(stat => `${(new Date(stat.date)).getDate()}/${(new Date(stat.date)).getMonth() + 1}`),
        datasets: [{
            label: `${text.CONFIRMED} ${localCountry}`,
            borderColor: '#f76a8c',
            data: stats.map(stat => stat.confirmed)
        }, {
            label: `${text.RECOVERIES} ${localCountry}`,
            borderColor: '#09fbd3',
            data: stats.map(stat => stat.recovered)
        }, {
            label: `${text.DEATHS} ${localCountry}`,
            borderColor: '#f5d300',
            data: stats.map(stat => stat.deaths)
        }]
    },
    options: {
        legend: {
            labels: {
                fontColor: "white"
            }
        },
        scales: {
            yAxes: [{
                // type: 'logarithmic',
                ticks: {
                    fontColor: "white"
                }
            }],
            xAxes: [{
                ticks: {
                    fontColor: "white"
                }
            }]
        }
    }
});