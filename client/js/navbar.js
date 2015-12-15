
// logs the user out of the system and redirects to the index
// the index in turn calls the server to render index
function userLogout() {
    $.ajax({
        url: "/logout",
        type: "post",
        complete: function() {
            window.location.pathname = "/";
        } 
    })
}