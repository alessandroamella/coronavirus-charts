var globalChartElem = document.getElementById('globalChart').getContext('2d');

$("#country_selector").countrySelect({
    excludeCountries: ["AS", "AO", "AI", "BB", "BZ", "BJ", "BM", "BQ", "BW", "IO", "VG", "BN", "MM", "BI", "CV", "ID", "KM", "CK", "CW", "DJ", "DM", "SV", "ER", "FK", "FO", "FM", "FJ", "GF", "PF", "GI", "GL", "GD", "GU", "GW", "HT", "HK", "KI", "KG", "LA", "LS", "LR", "LY", "MO", "MG", "MW", "ML", "MH", "MU", "YT", "ME", "MS", "MZ", "NR", "AN", "NC", "NI", "NE", "NU", "NF", "KP", "MP", "PW", "PG", "PR", "RE", "BL", "SH", "KN", "MF", "PM", "WS", "ST", "SL", "SX", "SB", "SO", "SS", "SY", "TW", "TJ", "TZ", "BS", "GM", "TL", "TK", "TO", "TM", "TC", "TV", "UG", "VI", "VU", "VA", "WF", "YE", "ZM", "ZW"]
});

let stats = JSON.parse($("#stats-p").text());
$("#stats-p").remove();
// console.log(stats);

$("#country_selector").on("change", function(){
    updateCountry();
    $.ajax({
        url: "/" + localCountry,
        complete: function(xhr, status){
            stats = JSON.parse(xhr.responseText);
            // console.log(stats);
            globalChart.data.datasets[0].label = `Confirmed cases in ${localCountry}`;
            globalChart.data.datasets[0].data = stats.map(stat => stat.confirmed);
            globalChart.data.datasets[1].label = `Recoveries in ${localCountry}`;
            globalChart.data.datasets[1].data = stats.map(stat => stat.recovered);
            globalChart.data.datasets[2].label = `Deaths in ${localCountry}`;
            globalChart.data.datasets[2].data = stats.map(stat => stat.deaths);
            globalChart.update();
        },
        error: function(xhr,status,error){
            alert(`${xhr.status} ${xhr.statusText}, can't request /${localCountry}: ${xhr.responseText}. If you believe this is an error, please contact me and let me know`);
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
            label: `Confirmed cases in ${localCountry}`,
            borderColor: '#f76a8c',
            data: stats.map(stat => stat.confirmed)
        }, {
            label: `Recoveries in ${localCountry}`,
            borderColor: '#09fbd3',
            data: stats.map(stat => stat.recovered)
        }, {
            label: `Deaths in ${localCountry}`,
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