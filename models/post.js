const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    date: {
        type: Date,
    },
    author: {
        type: Boolean,
        default: false
    }
})

const Post = mongoose.model('User', postSchema);
module.exports = Post;