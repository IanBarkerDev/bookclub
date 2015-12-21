var express = require("express");
var mongoose = require("mongoose")
var bodyparser = require("body-parser");
var path = require("path");


mongoose.connect("mongodb://localhost/bookclub");
var db = mongoose.connection;

var User = require("./app/models/user");
var Book = require("./app/models/book");

var app = express();

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: true}));
app.use(express.cookieParser());
app.use(express.static(path.resolve(__dirname, 'client'), {redirect: false}));

app.set("views", "./views");
app.set("view engine", "jade");

/* ------------ Routes ------------- */

// Base page
app.get("/", function(req, res) {
  res.render("index");
})

app.post("/logout", function(req, res) {
  res.cookie("username", "");
  res.end();
})

// Login to get to profile
app.post("/login", function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  
  User.findOne({username: username}, function(err, doc) {
    if(err) throw err;
    if(doc.password === password) {
      res.cookie("username", username);
      res.cookie("isAdmin", doc.isAdmin);
      
      res.redirect("/user/" + username);
    }
    
    // TODO: if not send back that information, need to be able to deal with that

  })
})

// Signup to database and then get sent to profile
// TODO: if password !== confirm_password, send back that information and deal with it client side
app.post("/signup", function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  var email = req.body.email;
  var user = new User({
    username: username,
    password: password,
    email_info: {
      email: email,
      emailVisible: false
    },
    personal_info: {
      name: null,
      city: null,
      state: null,
      personalVisible: false
    },
    book_collection: [],
    book_collectionVisible: true,
    isAdmin: false
  })
  
  // saves user to databse
  user.save();
  
  res.cookie("username", username);
  res.cookie("isAdmin", user.isAdmin);
  res.redirect("/user/" + username); 
})

app.get("/user/:username", function(req, res) {
  var username = req.params.username;
  
  // find user
  var user = User.findOne({
    username: username
  }, function(err, user) {
    if(err) throw err;
    
    // if admin
    if(user.isAdmin) {
      Book.find(function(err, books) {
        if(err) throw err;
        
        res.render("profile", {
          username: username,
          user_signed: req.cookies.username,
          isAdmin: user.isAdmin,
          book_collection: books,
          book_collectionVisible: true
        })
      })
    } else {
    
      // simplify book_collection down to just the books
        var arr = user.book_collection.map(function(x) {
          return x.book;
        })
        // find all of the books based on isbn and store in an array
      Book.find({ISBN: {$in: arr}}, function(err, books) {
        if(err) throw err;
      
        // TODO: find trade requests for each book
        // console.log("user collection: " + user.book_collection);
        var book_collection = [];
        for(var i = 0; i < user.book_collection.length; i ++) {
          var isbn = user.book_collection[i].book;
          for(var j = 0; j < books.length; j ++) {
            if(isbn === books[j].ISBN) {
              book_collection.push({
               book: books[j],
               trade_req: user.book_collection[i].trade_req
              })
           }
         }
       }
       //console.log(book_collection);
      
       res.render("profile", {
          username: user.username, 
          user_signed: req.cookies.username, 
          isAdmin: user.isAdmin, 
          book_collection: book_collection, 
          book_collectionVisible: user.book_collectionVisible});
      })
    }
    
  })
})

// Take username and go to personal settings page for them
app.get("/user/:username/settings", function(req, res) {
  var issue = req.query.issue;
  
  User.findOne({
    username: req.params.username
  }, function(err, doc) {
    if(err) throw err;
    
    res.render("settings", {
      username: doc.username, 
      name: doc.personal_info.name || null, 
      city: doc.personal_info.city || null, 
      state: doc.personal_info.state || null, 
      personalVisible: doc.personal_info.personalVisible || null,
      emailVisible: doc.email_info.emailVisible || null,
      book_collectionVisible: doc.book_collectionVisible || null,
      issue: issue
    });
  })
})

// Change the password of a user
app.post("/user/:username/new_password", function(req, res) {

  var password = req.body.password;
  var con_password = req.body.confirm_password;
  var cur_password = req.body.current_password;
  
  var username = req.params.username;
  
  // if the new password and the new password confirmation are not the same
  if(password != con_password) {
    // first problem: new != confirm
    var string = encodeURIComponent("confirm");
    res.redirect("/user/" + username + "/settings?issue=" + string);
  } else {
    User.findOne({
      username: username
    }, function(err, doc) {
      if(err) throw err;
      
      // If current password doesn't match password then can't make new one
      if(cur_password != doc.password) {
        // second problem: cur != actual
        var string = encodeURIComponent("current");
        res.redirect("/user/" + username + "/settings?issue=" + string);
      } else {
      
        doc.password = password;
        doc.save();
      
        res.redirect("/user/" + username);
      }
    })
  }
})

// Change information (city, state, name, email) of a user
app.post("/user/:username/update_profile", function(req, res) {
  var username = req.params.username;
  var name = req.body.name || null;
  var city = req.body.city || null;
  var state = req.body.state || null;
  
  var privacy = req.body.privacy;
  var private_email;
  var private_profile;
  var private_collection;
  
  if(privacy === undefined) {
    private_email = true;
    private_collection = true;
    private_profile = true;
  } else {
  
    if(privacy.indexOf("email") !== -1) {
      private_email = false;
    } else {
      private_email = true;
    }
  
    if(privacy.indexOf("profile") !== -1) {
      private_profile = false;
    } else {
      private_profile = true;
    }
  
    if(privacy.indexOf("collection") !== -1) {
      private_collection = false;
    } else {
      private_collection = true;
    }
  }
  
  User.findOne({
    username: username
  }, function(err, doc) {
    if(err) throw err;
    
    doc.personal_info.name = name;
    doc.personal_info.city = city;
    doc.personal_info.state = state;
    
    doc.email_info.emailVisible = private_email;
    doc.personal_info.personalVisible = private_profile;
    doc.book_collectionVisible = private_collection;
    doc.save();
    
    res.redirect("/user/" + username);
  })
  
  
})

// Admin adds a book to the global collection
app.post("/addbook", function(req, res) {
  var ISBN = req.body.ISBN;
  var title = req.body.title;
  var author = req.body.author;
  var pages = req.body.pages;
  var published_by = req.body.published_by;
  
  var book = new Book({
    ISBN: ISBN,
    title: title,
    author: author,
    pages: pages,
    published: {published_date: null, published_by: published_by}
  })
  
  book.save();
  res.redirect("/book/" + ISBN);
})

/*
 admin editing a book would seem to be 3 calls
 first: a search of the general collection whether by isbn, author, or all
 second: click on an edit button which has an #isbn to get the rest of the information and display it in text input
 third: send the new information to the global array with an update
*/

/* admin searches global collection by isbn, author, or for all */
app.post("/admin/search", function(req, res) {
  var query = req.body.query;
  var typeOfSearch = req.body.typeOfSearch;
  
  if(typeOfSearch === "ISBN") {
    Book.find({ISBN: query}, function(err, doc) {
      if(err) throw err;
      res.json(doc);
    })
  }
  
  if(typeOfSearch === "author") {
    Book.find({author: query}, function(err, doc) {
      if(err) throw err;
      res.json(doc);
    })
  }
  
  if(typeOfSearch === "all") {
    Book.find(function(err, doc) {
      if(err) throw err;
      res.json(doc);
    })
  }
})

/* admin edit button has been clicked, looking for information to populate edit dialog */
app.post("/admin/search/ISBN", function(req, res) {
  var isbn = req.body.isbn;
  
  Book.findOne({ISBN: isbn}, function(err, doc) {
    if(err) throw err;
    res.json(doc);
  })
})

// book is edited based on new information provided by admin
app.post("/admin/edit", function(req, res) {
  var isbn = req.body.isbn;
  var title = req.body.title;
  var author = req.body.author;
  var genre = req.body.genre;
  var img = req.body.img;
  var pages = req.body.pages;
  var published_date = req.body.published.published_date;
  var published_by = req.body.published.published_by;
  
  var updatedData = {
    ISBN: isbn,
    title: title,
    author: author,
    img: img,
    genre: genre,
    pages: pages,
    published: {
      published_date: published_date,
      published_by: published_by
    }
  }
  
  Book.update({ISBN: isbn}, updatedData, function(err, doc) {
    if(err) throw err;
    res.json({url: "/book/" + isbn});
  })
})

app.post("/admin/add", function(req, res) {
  var isbn = req.body.isbn;
  var title = req.body.title;
  var author = req.body.author;
  var genre = req.body.genre;
  var img = req.body.img;
  var pages = req.body.pages;
  var published_date = req.body.published.published_date;
  var published_by = req.body.published.published_by;
  
  var book = new Book({
    ISBN: isbn,
    title: title,
    author: author,
    img: img,
    genre: genre,
    pages: pages,
    published: {
      published_date: published_date,
      published_by: published_by
    }
  })
  
  book.save();
  res.json({url: "/book/" + isbn});
})

// Book's page based on unique ISBN
app.get("/book/:ISBN", function(req, res) {
  Book.findOne({
    ISBN: req.params.ISBN
  }, function(err, doc) {
    if(err) throw err;
    
    res.render("book", {username: req.cookies.username, ISBN: doc.ISBN, title: doc.title, author: doc.author, img: doc.img, genre: doc.genre, pages: doc.pages, published_by: doc.published.published_by, published_date: doc.published.published_date});
  })
})


//TODO: simplify this down to 1 or 2 routes from 6
// User searches the global collection via ISBN
app.post("/user_search/ISBN", function(req, res) {
  var ISBN = req.body.data;
  res.json({url: "/search/results/ISBN/" + ISBN});
})

app.get("/search/results/ISBN/:ISBN", function(req, res) {
  var ISBN = req.params.ISBN;
  Book.find({ISBN: ISBN}, function(err, doc) {
    if(err) throw err;
    res.render("search-results", {username: req.cookies.username, results: doc, book: true})
  })
})

// User searches the global collection via author
app.post("/user_search/author", function(req, res) {
  var author = req.body.data;
  res.json({url: "/search/results/author/" + author});
})

app.get("/search/results/author/:author", function(req, res) {
  var author = req.params.author;
  Book.find({author: author}, function(err, doc) {
    if(err) throw err;
    res.render("search-results", {username: req.cookies.username, results: doc, book: true})
  })
})

// User searches the global collection via user
app.post("/user_search/user", function(req, res) {
  var user = req.body.data;
  res.json({url: "/search/results/user/" + user});
})

app.get("/search/results/user/:user", function(req, res) {
  var user = req.params.user;
  User.find({username: user}, function(err, users) {
    if(err) throw err;
    res.render("search-results", {username: req.cookies.username, results: users, book: false});
  })
})

// User add's a book to their personal collection
// TODO: make sure user doesn't already own OR when displaying, don't show add button if user owns
app.get("/:username/add/:ISBN", function(req, res) {
  var user = req.params.username;
  var isbn = req.params.ISBN;
  
  User.update({username: user}, {$push: {book_collection: {book: isbn, trade_req: []}}}, function(err, doc) {
    if(err) throw err;
  })
  
  Book.update({ISBN: isbn}, {$push: {ownedBy: user}}, function(err, doc) {
    if(err) throw err;
  })
  
})

// On another user's page, requesting user asks for another book
app.post("/userrequest", function(req, res) {
  var user_own = req.body.user_own;
  var isbn = req.body.isbn;
  var user_req = req.cookies.username;

  User.findOne({username: user_own}, function (err, user) {
    if(err) throw err;
    
    var books = user.book_collection;
    
    for(var i = 0; i < books.length; i ++) {
      if(books[i].book == isbn) {
        books[i].trade_req.push(user_req);
        break;
      }
    }
    user.save();
    res.json({data: "success"});
    
  })
})


app.listen(process.env.PORT, process.env.IP);