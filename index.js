const express = require('express')
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session')
const User = require('./models/user');
require('dotenv').config({path: __dirname + '/.env'})

const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true, limit: "30mb" }));
app.use(express.json({ limit: "30mb" }));

app.use('/tinymce', express.static(path.join(__dirname, 'node_modules', 'tinymce')));

const sessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}
app.use(session(sessionOptions));

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
    const { user } = req.session;
    res.render('index', {user: user});
})

app.get('/about', (req, res) => {
    res.render('about', {user: req.session.user_id});
})

app.get('/create', (req, res) => {
    res.render('create', {user: req.session.user_id});
})

app.get('/register', (req, res) => {
    res.render('register', {user: req.session.user_id});
})

app.post('/register', async(req, res) => {
    //firstname, username, password
    const user = req.body;
    
    // check all inputs are filled in
    if (checkInvalidUser(user)) {
        return res.redirect("/register");
    }

    let newUser = new User({
        firstName: user.firstname,
        username: user.username.toLowerCase(),
        password: user.password,
    })

    // check if user exists with username
    if (await User.findOne({username: user.username.toLowerCase()})) {
        return res.redirect("/register")
    }

    newUser = User.create(newUser);
    req.session.user_id = newUser._id;
    res.redirect('/', {user: req.session.user_id});
})

app.get('/login', (req, res) => {
    res.render('login', {user: req.session.user_id});
})

app.post('/login', async(req, res) => {
    //username, password
    const user = req.body;

    const existingUser = await User.findOne({ 
        username: user.username.toLowerCase(),
        password: user.password 
    })

    if (existingUser) {
        req.session.user_id = existingUser._id;
        return res.render('index', {user: req.session.user_id})
    } else {
        return res.redirect('/login')
    }   
})

app.get('/create', (req, res) => {
    res.render('create', {user: req.session.user_id});
})

app.get('/logout', (req, res) => {
    req.session.user_id = undefined;
    res.redirect('/', {user: req.session.user_id});
})

app.get('*', (req, res) => {
    res.send("404 Not Found")
})

async function checkInvalidUser(user) {
    const invalidInputs = ["", undefined, null]
    const existingUser = await User.findOne({ username: user.username.toLowerCase() });
    return existingUser ? false : invalidInputs.includes(user.firstname.trim()) || 
    invalidInputs.includes(user.username.trim()) ||
    invalidInputs.includes(user.password.trim());
}