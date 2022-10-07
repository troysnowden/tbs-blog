const express = require('express')
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({path: __dirname + '/.env'})

const app = express();

mongoose.connect(process.env.DB_URL, { useNewUrlParser: true })
    .then(() => {
        console.log("Connection to database was successful");
    })
    .catch(error => {
        console.log("An error occured connecting to database")
    })

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true, limit: "30mb" }));
app.use(express.json({ limit: "30mb" }));

app.use('/tinymce', express.static(path.join(__dirname, 'node_modules', 'tinymce')));

// start app on port 8080
app.listen(8080, function () {
    console.log('Application Started')
})

app.get('/', (req, res) => {
    res.render('index');
})

app.get('/about', (req, res) => {
    res.render('about');
})

app.get('/create', (req, res) => {
    res.render('create');
})

app.get('*', (req, res) => {
    res.send("404 Not Found")
})