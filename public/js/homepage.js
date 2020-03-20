let localCountry = { name: "Global", code: "global" }
let createChart = true;

let globalChartElem = document.getElementById('globalChart').getContext('2d');

function getPreferredCountries(){
    let preferredArr = ["global", "cn", "it", "us"];
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

let stats;
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

$("#country_selector").focus(function(){
    $("#country_selector").val("");
});

function updateChart(){
    if(createChart){
        createChart = false;
        newChart();
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
    $("#section1").append(`<div><p class="delete-country" onclick="countryCheckbox(this)" id="${localCountry.code}"><img src="/img/cross.svg" alt="Delete" style="max-width: 1rem;"> <img src="/img/flags/${localCountry.code}.png" alt="Flag" style="max-width: 1rem;"> <span class="country-name strike-link">${localCountry.name}</span></p></div>`);
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
};

function getCountry(callback){
    $("#country_selector").blur();
    $("#loading-container").show();
    $.ajax({
        url: "/getData/" + localCountry.name,
        success: function(xhr, status){
            try {
                stats = JSON.parse(xhr.responseText);
            } catch(e){
                stats = xhr;
            }
        },
        error: function(xhr,status,error){
            alert(`${xhr.status} ${xhr.statusText}, ${text.CANT_REQUEST} /${localCountry.name}: ${xhr.responseText}. ${text.ERROR_LETMEKNOW}`);
        },
        complete: function(){
            $("#loading-container").hide();
            if(callback){
                callback();
            }
        }
    });
}

$("#tutorial").on("click", function(){
    $(this).remove();
});

let findTimer = false;

$("#country_selector").on("change", function(){
    changeCountry();
});

$("#showStats").on("click", function(){
    changeCountry();
});

function changeCountry(){
    if(!findTimer){
        findTimer = setTimeout(function(){findTimer = false; $("#showStats").prop("disabled", false);}, 1000);
        $("#showStats").prop("disabled", true);
        $("#tutorial").remove();
        updateCountry();
        getCountry(updateChart);
    }
}

$("#country_selector").on("keypress",function(e){
    if(e.which == 13){
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

Chart.pluginService.register({
    beforeDraw: function(chart, easing){
        if(chart.config.options.chartArea && chart.config.options.chartArea.backgroundColor){
            var helpers = Chart.helpers;
            var ctx = chart.chart.ctx;
            var chartArea = chart.chartArea;

            ctx.save();
            ctx.fillStyle = chart.config.options.chartArea.backgroundColor;
            ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
            ctx.restore();
        }
    }
});

let watermarkProp = {};
if($(document).width() > $(document).height()){
    watermarkProp.width = $(document).width() / 5;
    watermarkProp.height = $(document).width() / 20;
    watermarkProp.pr = 100;
    watermarkProp.pb = 100;
    watermarkProp.opacity = 0.2;
} else {
    watermarkProp.width = $(document).height() / 8;
    watermarkProp.height = $(document).height() / 32;
    watermarkProp.pr = 10;
    watermarkProp.pb = 60;
    watermarkProp.opacity = 0.2;
};

let globalChart;

function newChart(){
    globalChart = new Chart(globalChartElem, {
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
            chartArea: {
                backgroundColor: '#fff'
            },
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
                    },
                    scaleLabel: {
                        display: true,
                        labelString: text.PEOPLE,
                        fontColor: "black",
                        fontSize: 14
                    }
                }],
                xAxes: [{
                    ticks: {
                        fontColor: "black"
                    },
                    scaleLabel: {
                        display: true,
                        labelString: text.DATE,
                        fontColor: "black",
                        fontSize: 14
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
            },
            // container for watermark options
            watermark: {
                // the image you would like to show
                // alternatively, this can be of type "Image"
                image: "/img/watermark.png",
                
                // x and y offsets of the image
                x: watermarkProp.pr,
                y: watermarkProp.pb,
        
                // width and height to resize the image to
                // image is not resized if these values are not set
                width: watermarkProp.width,
                height: watermarkProp.height,
                
                // opacity of the image, from 0 to 1 (default: 1)
                opacity: watermarkProp.opacity,
                
                // x-alignment of the image (default: "left")
                // valid values: "left", "middle", "right"
                alignX: "right",
                // y-alignment of the image (default: "top")
                // valid values: "top", "middle", "bottom"
                alignY: "bottom",
                
                // if true, aligns the watermark to the inside of the chart area (where the lines are)
                // (where the lines are)
                // if false, aligns the watermark to the inside of the canvas
                // see samples/alignToChartArea.html
                alignToChartArea: false,
                
                // determines whether the watermark is drawn on top of or behind the chart
                // valid values: "front", "back"
                position: "front"
            }
        },
    });
    $("#chartOptions").show();
    $(".no-nations").remove();
    $("#section1").append(`<div><p class="delete-country" onclick="countryCheckbox(this)" id="${localCountry.code}"><img src="/img/cross.svg" alt="Delete" style="max-width: 1rem;"> <img src="/img/flags/${localCountry.code}.png" alt="Flag" style="max-width: 1rem;"> <span class="country-name strike-link">${localCountry.name}</span></p></div>`);
}

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
            if(($("#section1").text().trim() == text.SELECTED_COUNTRIES + ":")){
                $("#section1").append(`<p class="no-nations text-muted" style="font-size: 0.8rem">${text.NO_COUNTRIES}</p>`);
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
// });

// if($( window ).width() >= 768){
//     $("#section1").css("height", $("#section2").css("height"));
// }

$("#saveAsImage").click(function(){
    // var canvas = document.getElementById("canvas"),
    //     ctx = canvas.getContext("2d");

    // ctx.fillStyle = "#ffffff";
    // ctx.fillRect(0, 0, canvas.width, canvas.height);

    // canvas.toBlob(function(blob){
    //     saveAs(blob, "grafica.png");
    // });
    alert("Not yet available. Right click on the chart and choose \"Save as image\" for a similar result!");
    // saveAs(globalChart.toBase64Image(), text.FILE_NAME + ".jpg");

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

function canvasToImage(canvas){
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

$('input[type=radio][name=textStyle]').change(function(){
    globalChart.options.legend.labels.fontStyle = this.value;
    globalChart.options.scales.yAxes[0].ticks.fontStyle = this.value;
    globalChart.options.scales.xAxes[0].ticks.fontStyle = this.value;
    globalChart.update();
});

setTimeout(function(){
    $('.st-label').each(function(){
        if($(this).text() == "Share" && text.SHARE != "Share"){
            $(this).text(text.SHARE);
        }
    });
}, 1000);

$("#resetZoom").on("click", function(){
    globalChart.resetZoom();
});


$('#datasetBackground').change(function(){
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

// $(function(){
//     $('#chartBackground').colorpicker();
//     $('#chartBackground').on('colorpickerChange', function(event){
//         globalChart.options.chartArea.backgroundColor = event.color.toString();
//         globalChart.update();
//     });
// });

let colorWheel = new iro.ColorPicker("#chartBackground", {color: '#fff'});
let tempColor;

$(".colorBtn").parent("div").on("click", function(){
    $('#colorModal').modal('show');
    tempColor = colorWheel.color.hexString;
});

$("#closeColorModal").on("click", function(){
    $('#colorModal').modal('hide');
    $(".colorBtn").css("background-color", colorWheel.color.rgbaString);
    globalChart.options.chartArea.backgroundColor = colorWheel.color.rgbaString;
    globalChart.update();
});

$("#resetColorModal").on("click", function(){
    colorWheel.color.hexString = "#ffffff";
});

$('#colorModal').on('hidden.bs.modal', function(){
    colorWheel.color.hexString = tempColor;
});

colorWheel.on('color:change', function(color, changes){
    $(".colorBtn").css("background-color", color.hexString);
});

function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
}

$(document).ready(function(){
    let lastCountry = getCookie("lastCountry");
    if(lastCountry){
        lastCountry = decodeURIComponent(lastCountry)
        $("#country_selector").countrySelect("setCountry", lastCountry);
        localCountry = {
            name: $("#country_selector").countrySelect("getSelectedCountryData").name.replace(/ *\([^)]*\) */g, ""),
            code: $("#country_selector").countrySelect("getSelectedCountryData").iso2
        }
    } else {
        $.ajax({
            url: "/getLocalCountry",
            success: function(xhr, status){
                try {
                    localCountry = JSON.parse(xhr.responseText);
                } catch(e){
                    localCountry = xhr;
                }
                $("#country_selector").countrySelect("setCountry", localCountry.name);
            },
            error: function(xhr,status,error){
                alert(`${xhr.status} ${xhr.statusText}, ${text.CANT_REQUEST} /${localCountry.name}: ${xhr.responseText}. ${text.ERROR_LETMEKNOW}`);
            }
        });
    }
});