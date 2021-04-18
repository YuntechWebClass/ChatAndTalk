var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
let engine = require('ejs-locals');
const {joinUser, removeUser, findUser} = require('./users');



app.engine('ejs', engine);
app.set('views', './views');
app.set('view engine', 'ejs');



app.get('/', function (req, res) {
  res.render('index')
  setTimeout(function() {
      res.render('index', {'title': 'test'})
  }, 1000);
})
// app.get("/", function (req, res) {
//   res.sendFile(__dirname + "/index.html");
// });



io.on("connection", function (socket) {
  socket.on("join room", (data) => {
    console.log(data.username + " joined the room: " + data.roomName);

    var Newuser = joinUser(socket.id, data.username, data.roomName);
    socket.emit("send data" , {id: socket.id, username: Newuser.username, roomname: Newuser.roomname });
    
    socket.join(Newuser.roomname);
  });


  socket.on("chat message", (data) => {
    io.to(data.room).emit("chat message", {data: data, id: socket.id});
    console.log(data.user + " send to " + data.room + ": " + data.value);
  });


  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if(user) {
      console.log(user.username + " has left the room: " + user.roomname);
    }
  });
});

http.listen(process.env.PORT || 3000);