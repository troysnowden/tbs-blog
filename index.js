const express = require('express')
const mongoose = require('mongoose');
const path = require('path');
const User = require('./models/user');
require('dotenv').config({path: __dirname + '/.env'})

const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true, limit: "30mb" }));
app.use(express.json({ limit: "30mb" }));

app.use('/tinymce', express.static(path.join(__dirname, 'node_modules', 'tinymce')));

mongoose.connect(process.env.DB_URL, { useNewUrlParser: true })
    .then(() => {
        console.log("Connection to database was successful");
    })
    .catch(error => {
        console.log("An error occured connecting to database")
    })

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

app.get('/register', (req, res) => {
    res.render('register');
})

app.post('/register', (req, res) => {
    //firstname, username, password
    const user = req.body;
    
    // check all inputs are filled in
    if (checkInvalidUser(user)) {
        return res.redirect("/register");
    }

    const newUser = new User({
        firstName: user.firstname,
        username: user.username,
        password: user.password,
        isWriter: true
    })

    User.create(newUser);

    res.redirect('/');
})

app.get('*', (req, res) => {
    res.send("404 Not Found")
})

function checkInvalidUser(user) {
    const invalidInputs = ["", undefined, null]
    return invalidInputs.includes(user.firstname.trim()) || 
    invalidInputs.includes(user.username.trim()) ||
    invalidInputs.includes(user.password.trim());
}