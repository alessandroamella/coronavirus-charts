var globalChartElem = document.getElementById('globalChart').getContext('2d');

function getPreferredCountries(){
    let preferredArr = ["cn", "it", "us"];
    let flag = true;
    preferredArr.forEach(function(country){
        if(country == localCountry.code){
            flag = false;
            return preferredArr;
        }
    });
    if(flag) preferredArr.push(localCountry.code);
    return preferredArr;
}

$("#country_selector").countrySelect({
    preferredCountries: getPreferredCountries(),
    excludeCountries: ["AS", "AO", "AI", "AX", "BB", "BZ", "BJ", "BM", "BQ", "BW", "IO", "IM", "VG", "CG", "BN", "MM", "BI", "CC", "CV", "ID", "KM", "CK", "GS", "CW", "CX", "DJ", "DM", "SV", "ER", "FK", "FO", "FM", "FJ", "GF", "PF", "GI", "GL", "GD", "GU", "GW", "HT", "HK", "KI", "KY", "KG", "LA", "LS", "LR", "LY", "MO", "MG", "MW", "ML", "MH", "MU", "YT", "ME", "MS", "MZ", "NR", "AN", "NC", "NI", "NE", "NU", "NF", "KP", "MP", "PW", "PG", "PR", "RE", "BL", "SH", "KN", "MF", "PM", "WS", "ST", "SL", "SX", "SB", "SO", "SS", "SY", "TW", "TJ", "TZ", "BS", "GM", "TL", "TK", "TO", "TM", "TC", "TD", "TV", "UG", "UM", "VI", "VU", "VA", "WF", "EH", "YE", "ZM", "ZW"]
});

let stats = JSON.parse($("#stats-p").text());
$("#stats-p").remove();
// console.log(stats);
let text = JSON.parse($("#texts").text());
$("#texts").remove();

let colorNum = 0;
function getColor(){
    colorNum++;
    return "hsl(" + (colorNum * (360 / 9) % 360) + ",100%,50%)";
}

// function getColor(){
//     return "hsla(" + ~~(360 * Math.random()) + "," +
//                     "70%,"+
//                     "80%,1)"
//   }

function setBackground(chart, d1, d2, d3, c1, c2, c3){
    d1.backgroundColor = c1;
    d2.backgroundColor = c2;
    d3.backgroundColor = c3;
    chart.update();
};

$("#country_selector").on("change", function(){
    $("#loading-container").show();
    updateCountry();
    $.ajax({
        url: "/getData/" + localCountry.name,
        success: function(xhr, status){
            try {
                stats = JSON.parse(xhr.responseText);
            } catch(e){
                stats = xhr;
            }
            let alreadyThere = false;
            globalChart.data.datasets.forEach(function(dataset, i){
                if(dataset.label == `${text.CONFIRMED} ${localCountry.name}`){
                    let datasets = globalChart.data.datasets;
                    setTimeout(setBackground.bind(null, globalChart, datasets[i], datasets[i+1], datasets[i+2], datasets[i].backgroundColor, datasets[i+1].backgroundColor, datasets[i+2].backgroundColor), 1500);
                    datasets[i].backgroundColor = datasets[i].borderColor;
                    datasets[i+1].backgroundColor = datasets[i+1].borderColor;
                    datasets[i+2].backgroundColor = datasets[i+2].borderColor;
                    globalChart.update();
                    alreadyThere = true;
                    return false;
                }
            });
            if(alreadyThere){ return false; }
            $(".no-nations").remove();
            $("#section1").append(`<div><p class="delete-country" onclick="countryCheckbox(this)" id="${localCountry.code}"><img src="/img/cross.svg" alt="Delete" style="max-width: 1rem;"> <span class="country-name back-link">${localCountry.name}</span></p></div>`);
            globalChart.data.datasets.push({
                label: `${text.CONFIRMED} ${localCountry.name}`,
                borderColor: getColor(),
                data: stats.map(stat => stat.confirmed)
            });
            globalChart.data.datasets.push({
                label: `${text.RECOVERIES} ${localCountry.name}`,
                borderColor: getColor(),
                data: stats.map(stat => stat.recovered)
            });
            globalChart.data.datasets.push({
                label: `${text.DEATHS} ${localCountry.name}`,
                borderColor: getColor(),
                data: stats.map(stat => stat.deaths)
            });
            globalChart.resetZoom();
            globalChart.update();
        },
        error: function(xhr,status,error){
            alert(`${xhr.status} ${xhr.statusText}, ${text.CANT_REQUEST} /${localCountry.name}: ${xhr.responseText}. ${text.ERROR_LETMEKNOW}`);
        },
        complete: function(){ $("#loading-container").hide(); }
    });
    // console.log(localCountry.name);
});

$("#country_selector").on("keypress",function(e) {
    if(e.which == 13) {
        $(this).blur();
    }
});

if(localCountry.name != "404"){
    $("#country_selector").countrySelect("setCountry", localCountry.name);
} else {
    updateCountry();
}

function updateCountry(){
    localCountry = {
        name: $("#country_selector").countrySelect("getSelectedCountryData").name.replace(/ *\([^)]*\) */g, ""),
        code: $("#country_selector").countrySelect("getSelectedCountryData").iso2
    }
}

var globalChart = new Chart(globalChartElem, {
    type: "line",
    data: {
        labels: stats.map(stat => `${(new Date(stat.date)).getDate()}/${(new Date(stat.date)).getMonth() + 1}`),
        datasets: [{
            label: `${text.CONFIRMED} ${localCountry.name}`,
            borderColor: getColor(),
            data: stats.map(stat => stat.confirmed)
        }, {
            label: `${text.RECOVERIES} ${localCountry.name}`,
            borderColor: getColor(),
            data: stats.map(stat => stat.recovered)
        }, {
            label: `${text.DEATHS} ${localCountry.name}`,
            borderColor: getColor(),
            data: stats.map(stat => stat.deaths)
        }]
    },
    options: {
        legend: {
            labels: {
                fontColor: "black",
                fontSize: 14
            }
        },
        scales: {
            yAxes: [{
                type: "linear",
                ticks: {
                    fontColor: "black"
                }
            }],
            xAxes: [{
                ticks: {
                    fontColor: "black"
                }
            }]
        },
        elements: {
            point: {
                radius: 4,
                hoverRadius: 7,
                hitRadius: 10,
            },
            line: {
                borderWidth: 4
            }
        },
        responsive: true,
        responsiveAnimationDuration: 200,
        maintainAspectRatio: false,
        plugins: {
            zoom: {
                pan: {
                    enabled: true,
                    mode: "xy",
                    speed: 10,
                    threshold: 10
                },
                zoom: {
                    enabled: true,
                    sensitivity: 1,
                    mode: "x",
                    sensitivity: 0.1
                }
            }
        }
    },
});

console.log(globalChart.options);

// $("#country_selector").focusin(function(){
//     $(".country-list").removeClass("hide");
// });

// $("#country_selector").focusout(function(){
//     $(".country-list").addClass("hide");
// });

function countryCheckbox(element){
    globalChart.data.datasets.forEach(function(dataset, index){
        if(dataset.label == `${text.CONFIRMED} ${ $("#" + element.id).children(".country-name").text() }`){
            globalChart.data.datasets.splice(index, 3);
            $("#" + element.id).remove();
            if(($("#section1").text().trim() == text.SELECTED_NATIONS + ":")){
                $("#section1").append(`<p class="no-nations text-muted" style="font-size: 0.8rem">${text.NO_NATIONS}</p>`);
            }
            globalChart.update();
            return false;
        }
    });
};

// Split(['#section1', '#section2'], {
//     sizes: [25, 75],
//     direction: 'horizontal',
//     minSize: 300
// })

// if($( window ).width() >= 768){
//     $("#section1").css("height", $("#section2").css("height"));
// }

$("#saveAsImage").click(function(){

    saveAs(document.getElementById("globalChart").toDataURL("image/png", 1.0), "canvas.png");

    // let canvas = document.getElementById("globalChart");
    // var image = canvas.toDataURL("image/jpeg", 0.9);
    // $("#saveAsImage").attr("href", image);
    // PNG TO JPEG!!!
    // RISOLVI SFONDO!!
    // let oldColor = $("#globalChart").css("background-color");
    // $("#globalChart").css("background-color", "white");
    // var canvas = $("#globalChart").get(0);
    // var dataURL = canvas.toDataURL('image/png');
    // console.log(dataURL);

    // $("#saveAsImage").attr("href", dataURL);
    // $("#globalChart").css("background-color", oldColor);

});

// $("#saveAsImage").click(function(){
//     let blob = document.getElementById("globalChart").toDataURL("image/png");
//     saveAs(blob, "chart.png");
// });

function canvasToImage(canvas) {
	var image = new Image();
    image.src = canvas.toDataURL("image/png");
	return image;
}

$('input[type=radio][name=axisType]').change(function(){
    globalChart.options.scales.yAxes[0].type = this.value;
    globalChart.resetZoom();
    globalChart.update();
});

$('input[type=radio][name=chartType]').change(function(){
    if(this.value == "bar"){
        globalChart.data.datasets.forEach(function(dataset){
            dataset.backgroundColor = getColor();
        });
    } else {
        globalChart.data.datasets.forEach(function(dataset){
            dataset.backgroundColor = undefined;
        });
    }
    globalChart.config.type = this.value;
    globalChart.resetZoom();
    globalChart.update();
});

setTimeout(function(){
    $('.st-label').each(function(){
        if($(this).text() == "Share" && text.SHARE != "Share"){
            $(this).text(text.SHARE);
        }
    });
}, 1000)

$("#resetZoom").on("click", function(){
    globalChart.resetZoom();
});

$('#chartBackground').change(function(){
    if(this.checked){
        globalChart.data.datasets.forEach(function(dataset){
            dataset.backgroundColor = dataset.borderColor;
        });
        globalChart.update();
    } else {
        globalChart.data.datasets.forEach(function(dataset){
            dataset.backgroundColor = undefined;
        });
        globalChart.update();
    }      
});

$('#globalChart').bind('contextmenu', function(e){
    return false;
}); 