let firebase = require("firebase");
let express = require("express");
let app = express();
let server = require("http").createServer(app);
let io = require("socket.io")(server);
const isImageUrl = require('is-image-url');
const isUrl = require('is-url');
const firebaseConfig = require("./FirebaseConfig.json");
const { time } = require("console");
const pathName = firebaseConfig.pathName
let port = process.env.PORT || 3000;



// Initialize Firebase
firebase.initializeApp(firebaseConfig);
let database = firebase.database()



// create server
server.listen(port, function() {
    console.log("Server listening on port %d", port);
});



// URL route
app.use(express.static(__dirname));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/login.html');
});

app.get('/:roomname', function (req, res) {
    res.sendFile(__dirname + '/public/login.html');
});

app.get('/:roomname/:username', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});



// socket
io.on("connection", function(socket) {
    console.log("Connected and ready!");

    // on user join
    socket.on("join", (data) => {
        let userName = data.userName;
        let roomName = data.roomName;
        console.log(`${userName} joined room: ${roomName}`);

        // new message
        database.ref(`room/${roomName}`).on('child_added', function(childSnapshot, prevChildKey) {
            if (!childSnapshot) return;
            let msgData = childSnapshot.val();

            socket.emit("show message", msgData);
        });

        // remove message
        database.ref(`room/${roomName}`).on('child_removed', function(childSnapshot, prevChildKey) {
            if (!childSnapshot) return;
            let msgData = childSnapshot.val();

            socket.emit("hide message", msgData);
        });
    });


    // on server recieve message
    socket.on("send message", (data) => {
        let time = getTime();
        let upload = {
            id: time.full,
            time: time.short,
            author: data.author,
            message: data.message
        };
        
        if (isImageUrl(data.message)) { // message is a image link
            upload.image = data.message;
            upload.url = data.message;
            database.ref(`room/${data.room}/${time.full}`).set(upload);
     
        } else if (isUrl(data.message)) { // message is a link
            upload.url = data.message;
            database.ref(`room/${data.room}/${time.full}`).set(upload);
        
        } else { // only text
            database.ref(`room/${data.room}/${time.full}`).set(upload);
        }

    });
});



// return timestamp in 2 format
function getTime() {
    let time = new Date();
    time.setHours(time.getHours() + 8);
    let year = time.getFullYear().toString().padStart(4, 0);
    let month = (time.getMonth()+1).toString().padStart(2, 0);
    let date = time.getDate().toString().padStart(2, 0);
    let hour = time.getHours().toString().padStart(2, 0);
    let min = time.getMinutes().toString().padStart(2, 0);
    let sec = time.getSeconds().toString().padStart(2, 0);
    let milSec = time.getMilliseconds().toString().padStart(3, 0);

    return {
        // used for database
        full: `${year}-${month}-${date}_${hour}:${min}:${sec}_${milSec}`,
        
        // used for user
        short: `${year}-${month}-${date} ${hour}:${min}`
    };
}
