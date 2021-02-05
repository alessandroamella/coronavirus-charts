const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
// const mongoose = require("mongoose");
const methodOverride = require("method-override");
const fetch = require("node-fetch");
// const fs = require("fs");
const schedule = require("node-schedule");
const requestIp = require("request-ip");
const diff = require("deep-diff");
require("dotenv").config();

const localeMiddleware = require("express-locale");

// Require languages
const lang = {
    en: require("./locales/en.json"),
    it: require("./locales/it.json")
};

app.set("view engine", "ejs");

// BODY PARSER SETUP
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// COOKIE PARSER SETUP
app.use(cookieParser());

// MONGOOSE SETUP
// mongoose.set("useNewUrlParser", true);
// mongoose.set("useFindAndModify", false);
// mongoose.set("useCreateIndex", true);
// mongoose.set("useUnifiedTopology", true);

// CONNECT TO MONGODB
// mongoose.connect(process.env.MONGODB_URI, function(){
//     console.log("Connected to MongoDB Database!");
// });

app.use(requestIp.mw());

app.use(localeMiddleware());

// METHOD OVERRIDE SETUP
app.use(methodOverride("_method"));

let stats;

// const statSchema = new mongoose.Schema({
//     lastUpdated: { type: Date, default: Date.now },
//     countries: [
//         {
//             country: String,
//             data: [
//                 {
//                     date: Date,
//                     confirmed: Number,
//                     deaths: Number,
//                     recovered: Number
//                 }
//             ]
//         }
//     ]
// });
// const Stat = mongoose.model("Stat", statSchema);

let global = {};

async function fetchData(callback) {
    try {
        fetch("https://pomber.github.io/covid19/timeseries.json")
            .then(res => res.json())
            .then(function (json) {
                let countriesData = [];

                let tempGlobal = {};

                let pastDayData = {};
                let tempDayData;

                // Verifica che i dati siano validi, se sono presenti dei null, fai return false
                for (data in json) {
                    if (!json[data]) {
                        console.log(new Date());
                        console.log("Invalid JSON data:");
                        console.log(json[data]);
                        console.log("Aborting fetch!");
                        return false;
                    }
                    json[data].forEach(function (dayData, i) {
                        if (dayData.confirmed < 0)
                            console.error("dayData.confirmed < 0");
                        if (pastDayData) {
                            diff(pastDayData, dayData);
                        }
                        if (tempGlobal[dayData.date]) {
                            tempGlobal[dayData.date].confirmed +=
                                dayData.confirmed;
                            tempGlobal[dayData.date].deaths += dayData.deaths;
                            tempGlobal[dayData.date].recovered +=
                                dayData.recovered;
                        } else {
                            tempGlobal[dayData.date] = {
                                confirmed: dayData.confirmed,
                                deaths: dayData.deaths,
                                recovered: dayData.recovered
                            };
                        }
                        let tempDayData = Object.assign({}, dayData);
                        if (pastDayData.confirmed) {
                            tempDayData.confirmed -= pastDayData.confirmed;
                        }
                        // DEBUG
                        // if (data == "Italy") {
                        //     console.log(tempDayData);
                        // }
                        pastDayData = dayData;
                        json[data][i] = tempDayData;
                        dayData = tempDayData;
                    });
                    countriesData.push({
                        country: data,
                        data: json[data]
                    });
                }

                global = tempGlobal;

                // Con i dati validi, aggiorna la variabile delle stats
                stats = json;

                stats["Global"] = Object.keys(global).map(function (k) {
                    return {
                        date: k,
                        confirmed: global[k].confirmed,
                        deaths: global[k].deaths,
                        recovered: global[k].recovered
                    };
                });
                countriesData.push({
                    country: "Global",
                    data: stats["Global"]
                });
                // const fetchedStats = new Stat({
                //     countries: countriesData
                // });
                // Stat.findOne({}, {}, { sort: { lastUpdated: -1 } }, function (
                //     err,
                //     foundStat
                // ) {
                //     // Se salvataggio attuale = vecchio salvataggio, non salvare
                //     if (
                //         !foundStat ||
                //         foundStat.countries[0].data.length !=
                //             fetchedStats.countries[0].data.length
                //     ) {
                //         console.log("Saved new data!");
                //         fetchedStats.save(function (err) {
                //             if (err) {
                //                 console.log(err);
                //             }
                //         });
                //     }
                // });
                if (callback) {
                    callback();
                }
            });
    } catch (e) {
        throw new Error(e);
    }
}

const fetchDataSchedule = schedule.scheduleJob(
    "0 0 * * * *",
    function (fireDate) {
        fetchData();
    }
);

try {
    fetch("https://pomber.github.io/covid19/timeseries.json")
        .then(res => res.json())
        .then(function (json) {
            stats = json;
        });
} catch (e) {
    throw new Error(e);
}

// SET PUBLIC FOLDER
app.use(express.static(__dirname + "/public"));

const server = app.listen(process.env.PORT, process.env.IP, function () {
    console.log("Server started!");
});

function getIp(req, res, callback) {
    try {
        if (!req.clientIp) {
            callback(res, false);
            return false;
        }
        fetch(`http://ip-api.com/json/${req.clientIp}`)
            .then(res => res.json())
            .then(async function (json) {
                if (stats) {
                    callback(res, json);
                    return true;
                } else {
                    await fetchData();
                    if (stats) {
                        callback(res, json);
                        return true;
                    } else {
                        callback(res, false);
                        return false;
                    }
                }
            });
    } catch (e) {
        res.send(e);
    }
}

app.get("/info", function (req, res) {
    if (req.cookies.lang == "it" || req.cookies.lang == "en") {
        res.redirect("/info/" + req.cookies.lang);
        return false;
    } else if (req.locale.language) {
        const localLang = req.locale.language;
        if (localLang == "it" || localLang == "en") {
            res.cookie("lang", localLang);
            res.redirect("/info/" + localLang);
            return false;
        }
    }
    res.redirect("/info/en");
});

app.get("/info/:lang", function (req, res) {
    res.locals.path = "/info/";
    if (req.params.lang == "it" || req.params.lang == "en") {
        res.cookie("lang", req.params.lang);
        res.render("info", { text: lang[req.params.lang] });
    } else {
        res.redirect("/info");
    }
});

app.get("/", function (req, res) {
    if (req.cookies.lang == "it" || req.cookies.lang == "en") {
        res.redirect("/" + req.cookies.lang);
        return false;
    } else if (req.locale.language) {
        const localLang = req.locale.language;
        if (localLang == "it" || localLang == "en") {
            res.cookie("lang", localLang);
            res.redirect("/" + localLang);
            return false;
        }
    }
    res.redirect("/en");
});

app.get("/:lang", function (req, res) {
    res.locals.path = "/";
    if (req.params.lang == "it" || req.params.lang == "en") {
        res.cookie("lang", req.params.lang);
        let localCountry;
        getIp(req, res, function (res, json) {
            if (!json) {
                localCountry = "badcountry";
                return false;
            }
            if (json.country) {
                localCountry = {
                    name: json.country,
                    code: json.countryCode.toLowerCase()
                };
            } else {
                localCountry = {
                    name: "Italy",
                    code: "it"
                };
            }
            res.render("index", {
                localCountry: localCountry,
                text: lang[req.params.lang]
            });
        });
    } else {
        res.redirect("/");
    }
});

app.get("/getData/:country", async function (req, res) {
    let country = req.params.country;
    let cookieCountry = country;
    if (country == "South Korea") {
        country = "Korea, South";
    } else if (country == "United States") {
        country = "US";
    } else if (country == "Swaziland") {
        country = "Eswatini";
    } else if (country == "Congo") {
        country = "Congo (Kinshasa)";
    } else if (country == "Palestine") {
        country = "occupied Palestinian territory";
    } else if (country == "Macedonia") {
        country = "North Macedonia";
    } else if (country == "Côte d’Ivoire") {
        country = "Cote d'Ivoire";
    } else if (country == "Czech Republic") {
        country = "Czechia";
    } else if (country == "Global") {
        if (!stats || !stats[country]) {
            fetchData(function () {
                console.log("Fetched new data because not available!");
                sendCountry(res, country, cookieCountry);
            });
            return false;
        }
    }
    sendCountry(res, country, cookieCountry);
});

function sendCountry(res, country, cookieCountry) {
    if (stats[country]) {
        res.cookie("lastCountry", cookieCountry);
        res.json(stats[country]);
    } else {
        res.status(400).send("Invalid country");
    }
}

app.get("*", function (req, res) {
    res.redirect("/");
});

fetchData();
