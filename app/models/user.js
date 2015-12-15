var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var userSchema = new Schema({
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    email_info: {
        email: {type: String, required: true},
        emailVisible: Boolean
    },
    personal_info: {
        name: String,
        city: String,
        state: String,
        personalVisible: Boolean
    },
    book_collection: [{book: Number, trade_req: [String]}],
    book_collectionVisible: Boolean,
    isAdmin: Boolean
})

var User = mongoose.model("User", userSchema);

module.exports = User;