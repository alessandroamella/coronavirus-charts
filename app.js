let express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    methodOverride = require("method-override"),
    i18n = require("i18n-express"),
    socket = require("socket.io");
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
    console.log("Database connesso!");
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

// SET PUBLIC FOLDER
app.use(express.static(__dirname + "/public"));

const server = app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Server partito!");
});

app.get("/", function(req, res){
    res.render("index");
});

app.get("*", function(req, res){
    res.redirect("/");
});

// Socket setup
var io = socket(server);

io.on("connection", function(data){
    socket.emit("ping");
});