let express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const i18n = require("i18n-express");
const fetch = require('node-fetch');
const fs = require('fs');
const schedule = require('node-schedule');
require("dotenv").config();

app.set("view engine", "ejs");

// BODY PARSER SETUP
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// MONGOOSE SETUP
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

// CONNECT TO MONGODB
mongoose.connect(process.env.MONGODB_URI, function(){
    console.log("Connected to MongoDB Database!");
});

app.use(
    i18n({
        translationsPath: __dirname + '/locales',
        cookieLangName: "lang",
        paramLangName: "lang",
        siteLangs: ["en","it"],
        textsVarName: 'text'
    })
);

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

let fetchData = schedule.scheduleJob("0 0 0 * * *", function(fireDate){
    try {
        console.log('This job was supposed to run at ' + fireDate + ', but actually ran at ' + new Date());
        fetch('https://pomber.github.io/covid19/timeseries.json')
            .then(res => res.json())
            .then(function(json){
                // fs.writeFile(`data/data-${Date.now()}.json`, JSON.stringify(json, null, 2), function(err){{
                // if (err) throw err;
                // console.log(`The data file has been saved as data/data-${Date.now()}.json`);
                stats = json;
                let countriesData = [];
                for(data in json){
                    countriesData.push({
                        country: data,
                        data: json[data]
                    });
                }
                let fetchedStats = new Stat({
                    countries: countriesData
                });
                fetchedStats.save(function(err){if(err){console.log(err);}});
            // }});
        });
    } catch(e){
        throw new Error(e);
    }
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

app.get("/", function(req, res){
    try {
        fetch(`https://ipapi.co/${req.ip}/json/`)
        .then(res => res.json())
        .then(function(json){
            if(json.country_name){
                res.render("index", { stats: JSON.stringify(stats[json.country_name]), country: json.country_name });
            } else {
                res.render("index", { stats: JSON.stringify(stats["United Kingdom"]), country: "United Kingdom" });
            }
        });
    } catch(e){
        res.send(e);
    }
});

app.get("/:country", function(req, res){
    let country = req.params.country;
    if(country == "South Korea"){
        country = "Korea, South";
    } else if(country == "United States"){
        country = "US"
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
    }
    // else if(country == "XXXXX"){
    //     country = "XXXXX";
    // } else if(country == "XXXXX"){
    //     country = "XXXXX";
    // }
    if(stats[country]){
        res.json(stats[country]);
    } else {
        res.status(400).send("Invalid country");
    }
});

app.get("*", function(req, res){
    res.redirect("/");
});