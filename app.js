const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const fetch = require('node-fetch');
const fs = require('fs');
const schedule = require('node-schedule');
const requestIp = require('request-ip');
require("dotenv").config();

// Require languages
let lang = {
    en: require("./locales/en.json"),
    it: require("./locales/it.json")
}

app.set("view engine", "ejs");

// BODY PARSER SETUP
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// COOKIE PARSER SETUP
app.use(cookieParser());

// MONGOOSE SETUP
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

// CONNECT TO MONGODB
mongoose.connect(process.env.MONGODB_URI, function(){
    console.log("Connected to MongoDB Database!");
});

app.use(requestIp.mw());

// METHOD OVERRIDE SETUP
app.use(methodOverride("_method"));

let stats;

let statSchema = new mongoose.Schema({
    lastUpdated: { type: Date, default: Date.now },
    countries: [{
        country: String,
        data: [{
            date: Date,
            confirmed: Number,
            deaths: Number,
            recovered: Number
        }]
    }]
})
let Stat = mongoose.model("Stat", statSchema);

let global = {};

async function fetchData(callback){
    try {
        fetch('https://pomber.github.io/covid19/timeseries.json')
            .then(res => res.json())
            .then(function(json){
                // fs.writeFile(`data/data-${Date.now()}.json`, JSON.stringify(json, null, 2), function(err){{
                // if (err) throw err;
                // console.log(`The data file has been saved as data/data-${Date.now()}.json`);
                stats = json;
                let countriesData = [];
                for(data in json){
                    json[data].forEach(function(dayData){
                        if(global[dayData.date]){
                            global[dayData.date].confirmed += dayData.confirmed;
                            global[dayData.date].deaths += dayData.deaths;
                            global[dayData.date].recovered += dayData.recovered;
                        } else {
                            global[dayData.date] = {
                                confirmed: dayData.confirmed,
                                deaths: dayData.deaths,
                                recovered: dayData.recovered
                            }
                        }
                    });
                    countriesData.push({
                        country: data,
                        data: json[data]
                    });
                }
                stats["Global"] = Object.keys(global).map(function(k){
                    return {
                        date: k,
                        confirmed: global[k].confirmed,
                        deaths: global[k].deaths,
                        recovered: global[k].recovered
                    }
                });
                console.log("Fetched new data!");
                countriesData.push({
                    country: "Global",
                    data: stats["Global"]
                });
                let fetchedStats = new Stat({
                    countries: countriesData
                });
                Stat.findOne({}, {}, { sort: { 'lastUpdated' : -1 } }, function(err, foundStat){
                    // Se salvataggio attuale = vecchio salvataggio, non salvare
                    if(!foundStat || foundStat.countries[0].data.length != fetchedStats.countries[0].data.length){
                        console.log("Saved new data!");
                        fetchedStats.save(function(err){ if(err){console.log(err)}});
                    } else {
                        console.log("New data wasn't saved (same length)");
                    }
                });
                if(callback){
                    callback();
                }
            });
    } catch (e) {
        throw new Error(e);
    }
}

let fetchDataSchedule = schedule.scheduleJob("0 0 * * * *", function(fireDate){
    fetchData();
    console.log('Data save was supposed to run at ' + fireDate + ', but actually ran at ' + new Date());
});

try {
    fetch('https://pomber.github.io/covid19/timeseries.json')
        .then(res => res.json())
        .then(function(json){stats = json;});
} catch(e){
    throw new Error(e);
}

// SET PUBLIC FOLDER
app.use(express.static(__dirname + "/public"));

const server = app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Server started!");
});

function getIp(req, res, callback){
    try {
        fetch(`http://ip-api.com/json/${req.clientIp}`)
        .then(res => res.json())
        .then(async function(json){
            if(stats){
                callback(res, json);
                return true;
            } else {
                await fetchData();
                if(stats){
                    callback(res, json);
                    return true;
                } else {
                    callback(res, false);
                    return false;
                }
            }
        });
    } catch(e){
        res.send(e);
    }
}

app.use(function(req, res, next){
    res.locals.path = req.path;
    if(req.query.lang == "it" || req.query.lang == "en"){
        res.cookie("lang", req.query.lang);
        res.locals.text = lang[req.query.lang];
        next();
        return false;
    }
    if(req.cookies.lang == "it" || req.cookies.lang == "en"){
        req.lang = req.cookies.lang;
    } else {
        if(req.headers["accept-language"]){
            let localLang = req.headers["accept-language"].split(",")[1].split(";")[0];
            if(localLang == "it" || localLang == "en"){
                res.cookie("lang", localLang);
                req.lang = localLang;
            } else {
                req.lang = "en";
            }
        } else {
            req.lang = "en";
        }
    }
    res.locals.text = lang[req.lang];
    next();
});

app.get("/", function(req, res){
    let localCountry;
    getIp(req, res, function(res, json){
        if(!json){
            localCountry = "badcountry";
            return false;
        }
        if(json.country){
            localCountry = {
                name: json.country,
                code: json.countryCode.toLowerCase()
            };
        } else {
            localCountry = {
                name: "Global",
                code: "global"
            };
        }
        res.render("index", {localCountry: localCountry});
    });
    // getIp(req, res, function(res, json){
    //     if(!json){
    //         res.send("Error while loading the homepage. Sorry for the inconvenience!");
    //         return false;
    //     }
    //     if(json.country){
    //     } else {
    //         res.render("index", { stats: JSON.stringify(stats["United Kingdom"]), country: {name: "United Kingdom", code: "gb"} });
    //     }
    // });
});

app.get("/info", function(req, res){
    res.render("info");
});

app.get("/getData/:country", async function(req, res){
    let country = req.params.country;
    let cookieCountry = country;
    if(country == "South Korea"){
        country = "Korea, South";
    } else if(country == "United States"){
        country = "US";
    } else if(country == "Swaziland"){
        country = "Eswatini";
    } else if(country == "Congo"){
        country = "Congo (Kinshasa)";
    } else if(country == "Palestine"){
        country = "occupied Palestinian territory";
    } else if(country == "Macedonia"){
        country = "North Macedonia";
    } else if(country == "Côte d’Ivoire"){
        country = "Cote d'Ivoire";
    } else if(country == "Czech Republic"){
        country = "Czechia";
    } else if(country == "Global"){
        if(!stats || !stats[country]){
            fetchData(function(){
                console.log("Fetched new data because not available!");
                sendCountry(res, country, cookieCountry);
            });
            return false;
        }
    }
    sendCountry(res, country, cookieCountry);
});

function sendCountry(res, country, cookieCountry){
    if(stats[country]){
        res.cookie("lastCountry", cookieCountry);
        res.json(stats[country]);
    } else {
        res.status(400).send("Invalid country");
    }
}

app.get("*", function(req, res){
    res.redirect("/");
});

fetchData();