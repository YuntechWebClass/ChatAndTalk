var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
const {joinUser, removeUser, findUser} = require('./users');



app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});




http.listen(process.env.PORT || 3000);