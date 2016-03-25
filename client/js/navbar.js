
// logs the user out of the system and redirects to the index
// the index in turn calls the server to render index
function userLogout() {
    document.cookie = "username=; Path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    window.location.pathname = "/";
}