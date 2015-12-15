var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var bookSchema = new Schema({
    ISBN: {type: Number, required: true},
    title: String,
    author: String,
    genre: [String],
    img: String,
    pages: Number,
    published: {published_date: String, published_by: String},
    ownedBy: [String]
})

var Book = mongoose.model("Book", bookSchema);

module.exports = Book;