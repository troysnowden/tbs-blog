const express = require('express')
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session')
const Post = require('./models/post');
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
    res.render('index', {user: req.session.user});
})

app.get('/about', (req, res) => {
    res.render('about', {user: req.session.user});
})

app.get('/create', (req, res) => {
    if (req.session.user && req.session.user.isWriter) {
        return res.render('create', {user: req.session.user});
    } else {
        return res.redirect('/');
    }
})

app.post('/create', async(req, res) => {
    if (req.session.user && req.session.user.isWriter) {
        const { title } = req.body;
        const { body } = req.body;
        const currentUser = await User.findById(req.session.user_id);
        if (currentUser) {
            let newPost = new Post({
                title: title,
                body: body,
                author: currentUser.username,
                date: new Date().toLocaleDateString("en-GB")
            })
            Post.create(newPost);
            return res.redirect('/');
        }
        return res.redirect('/create');
    } else {
        return res.redirect('/');
    }
})

app.get('/articles', async(req, res) => {
    const articles = await Post.find();
    res.render('articles', {user: req.session.user, articles: articles});
})

app.get('/article/:id', async(req, res) => {
    const article = await Post.findById(req.params.id);
    res.render('article', {user: req.session.user, article: article});
})

app.get('/register', (req, res) => {
    res.render('register', {user: req.session.user});
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
    req.session.user = { id: existingUser._id, isWriter: existingUser.isWriter };
    res.redirect('/', {user: req.session.user});
})

app.get('/login', (req, res) => {
    res.render('login', {user: req.session.user});
})

app.post('/login', async(req, res) => {
    //username, password
    const user = req.body;

    const existingUser = await User.findOne({ 
        username: user.username.toLowerCase(),
        password: user.password 
    })

    if (existingUser) {
        req.session.user = { id: existingUser._id, isWriter: existingUser.isWriter };
        return res.render('index', {user: req.session.user})
    } else {
        return res.redirect('/login')
    }   
})

app.get('/logout', (req, res) => {
    req.session.user = undefined;
    res.redirect('/');
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