const express = require('express')
const mongoose = require('mongoose');
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
app.use(express.static('public'));

app.use(express.urlencoded({ extended: true, limit: "30mb" }));
app.use(express.json({ limit: "30mb" }));

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