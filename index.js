const express = require('express')
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session')
const Post = require('./models/post');
const User = require('./models/user');
const Video = require('./models/video');
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

app.get('/', async(req, res) => {
    const latestArticle = await Post.findOne();
    const latestVideo = await Video.findOne();
    res.render('index', {user: req.session.user, latestArticle: latestArticle, latestVideo: latestVideo});
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
    if (!article) {
        return res.redirect('/');
    }
    res.render('article', {user: req.session.user, article: article});
})

app.post('/article/save', async(req, res) => {
    const currentUser = await User.findById(req.session.user.id);
    const article = await Post.findById(req.body.article);
    if (!currentUser || !article) {
        return res.redirect('/articles');
    }
    if (currentUser.savedArticles.includes(req.body.article)) {
        return res.redirect(`/article/${req.body.article}`);
    }
    await User.findByIdAndUpdate(req.session.user.id, {
        savedArticles: [...currentUser.savedArticles, req.body.article]
    })
    return res.redirect(`/article/${req.body.article}`);
})

app.get('/saved-articles', async(req, res) => {
    const savedArticles = (await User.findById(req.session.user.id)).savedArticles;
    if (!savedArticles) {
        return res.redirect('/');
    }
    const articles = await Promise.all(savedArticles.map(async (article) => Post.findById(article)));
    res.render('articles', {user: req.session.user, articles: articles});
})

app.get('/videos', async(req, res) => {
    const videos = await Video.find();
    res.render('videos', {user: req.session.user, videos: videos});
})

app.post('/video', async(req, res) => {
    const { title } = req.body;
    const { link } = req.body;
    await Video.create({title: title, link: link});
    res.redirect('/videos');
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
        return res.redirect('/');
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