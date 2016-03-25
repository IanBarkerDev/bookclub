           var genre = [];


// action for form that searches global collection based on ISBN for user
function userSearch() {
    var str = $("input[name='nav-form-radio']:checked", "#nav-user-search").val();
    console.log(str);
    $.ajax ({
        url: "/user_search/" + str,
        type: "post",
        dataType: "json",
        data: {
            data: $("#nav-user-search-input").val()
        },
        complete: function(data) {
            console.log(data);
            window.location.pathname = data.responseJSON.url;
        }
        /*complete: function(data) {
            $(".user-search-results").empty();
            $.each(data.responseJSON, function(index, val) {
                var genre = "";
                $.each(val.genre, function(index, val) {
                    genre = genre + val + " ";
                })
                var html = '<div class="user-search-result" id="' + val.ISBN + '"><button class="btn btn-default add-to-collection">Add To Collection</button><p class="add-title">' + val.title + '</p><p class="add-author">' + val.author + '</p><p class="add-genre">' + genre + '</p></div>';
                $(".user-search-results").append(html);
            })
        }*/
    })
}

// action that adds a book (based on ISBN) to both the user's collection and to the ownedBy for the book
function userAdd(isbn, username) {
    $.ajax({
        url: "/" + username + "/add/" + isbn,
        type: "get"
    })
}

// action that searches the global collection for admins and displays results based on either isbn, author, or everything
function adminSearch() {
    var typeOfSearch = $("input[name='admin-search-radio']:checked", "#adminSearch").val();
    $(".book-collection-search").slideUp();
    $.ajax({
        url: "/admin/search",
        type: "post",
        dataType: "json",
        data: {
            typeOfSearch: typeOfSearch,
            query: $("#admin-search-input").val()
        },
        
        complete: function(data) {
            $(".admin-book-collection-results").empty();
            $.each(data.responseJSON, function(index, val) {
                var html = '<div class="book" id="admin' + val.ISBN + '"><div class="clickable"><img class="book-img" src="' + val.img + '" alt="' + val.title + ' Image"><p class="book-title">' + val.title + '</p></div><button class="btn btn-default edit-book book-button" type="button" data-toggle="modal" data-target="#editModal">Edit Book</button></div>';
                /*
                '<div class="book" id="admin' + val.ISBN + '">
                    <div class="clickable">
                        <img class="book-img" src="' + val.img + '" alt="' + val.title + ' Image">
                        <p class="book-title">' + val.title + '</p>
                    </div>
                    <button class="btn btn-default edit-book book-button" type="button" data-toggle="modal" data-target="#editModal">Edit Book</button>
                </div>';
                */
                $(".book-collection-results").append(html);
            })
            $(".book-collection-results").slideDown();
        }
    })
    
}

// searches the global collection for a single book based on id and populates the dialog for the edit button
// TODO: might change this to go to a new page and render?
function adminSearchISBN(isbn) {
    $.ajax({
        url: "/admin/search/ISBN",
        type: "post",
        dataType: "json",
        data: {
            isbn: isbn
        },
        
        complete: function(data) {
            data = data.responseJSON;
            $("#adminEdit").attr("action", "javascript:adminEditBook(" + data.ISBN + ")");
            $("#adminEditISBN").val(data.ISBN);
            $("#adminEditTitle").val(data.title);
            $("#adminEditAuthor").val(data.author);
            $("#adminEditImg").val(data.img);
            $("#adminEditPages").val(data.pages);
            $("#adminEditPubDate").val(data.published.published_date);
            $("#adminEditPubBy").val(data.published.published_by);
        }
    })
}

function adminEditBook(isbn) {
    $.ajax({
        url: "/admin/edit",
        type: "post",
        dataType: "json",
        data: {
            isbn: $("#adminEditISBN").val(),
            title: $("#adminEditTitle").val(),
            author: $("#adminEditAuthor").val(),
            genre: genre,
            img: $("#adminEditImg").val(),
            pages: $("#adminEditPages").val(),
            published: {
                published_date: $("#adminEditPubDate").val(),
                published_by: $("#adminEditPubBy").val()
            }
        }, complete: function(data) {
            window.location.pathname = data.responseJSON.url;
        }
    })
}

function adminAddBook() {
    $.ajax({
        url: "/admin/add",
        type: "post",
        dataType: "json",
        data: {
            isbn: $("#adminAddISBN").val(),
            title: $("#adminAddTitle").val(),
            author: $("#adminAddAuthor").val(),
            genre: genre,
            img: $("#adminAddImg").val(),
            pages: $("#adminAddPages").val(),
            published: {
                published_date: $("#adminAddPubDate").val(),
                published_by: $("#adminAddPubBy").val()
            }
        }, complete: function(data) {
            window.location.pathname = data.responseJSON.url;
        }
    })
}

function tradeReq(username, isbn) {
    $.ajax({
        url: "/userrequest",
        type: "post",
        dataType: "json",
        data: {
            user_own: username,
            isbn: isbn
        }
    })
}

function removeBook(user, isbn) {
    $.ajax({
        url: "/" + user + "/remove/" + isbn,
        type: "post"
    })
}

function getBookPage(isbn) {
    window.location.pathname = "/book/" + isbn;
}