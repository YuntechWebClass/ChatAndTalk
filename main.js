
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



server.listen(port, function() {
  console.log("Server listening on port %d", port);
});

app.use(express.static(__dirname + "/public"));

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
let database = firebase.database()



io.on("connection", function(socket) {
  console.log("Connected and ready!");


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


  // send message
  socket.on("send message", (data) => {
    let time = getTime();
    let upload = {
      id: time.full,
      time: time.short,
      author: data.author,
      message: data.message
    };
    
    if (isUrl(data.message)) {
      upload.url = data.message;
    }
    if (isImageUrl(data.message)) {
      upload.image = data.message;
      upload.url = data.message;
      database.ref(`room/${data.room}/${time.full}`).set(upload);
   
    } else if (isUrl(data.message)) {
      upload.url = data.message;
      database.ref(`room/${data.room}/${time.full}`).set(upload);
    
    } else {
      database.ref(`room/${data.room}/${time.full}`).set(upload);
    }

  });
});



function hasImage(url) {
  return new Promise(function(resolve, reject) {
    var timeout = 5000;
    var timer, img = new Image();
    img.onerror = img.onabort = function() {
        clearTimeout(timer);
        reject("error");
    };
    img.onload = function() {
         clearTimeout(timer);
         resolve("success");
    };
    timer = setTimeout(function() {
        // reset .src to invalid URL so it stops previous
        // loading, but doens't trigger new load
        img.src = "//!!!!/noexist.jpg";
        reject("timeout");
    }, timeout); 
    img.src = url;
  });
}

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
    full: `${year}-${month}-${date}_${hour}:${min}:${sec}_${milSec}`,
    short: `${hour}:${min}:${sec}`
  };
}


// write
// database.ref("Test").set("TEST", function(error) {
//   if (error) {
//     console.log("Failed with error: " + error)
//   } else {
//     console.log("success")
//   }
// })

// listener
// database.ref().on('child_changed', function(childSnapshot, prevChildKey) {
//   console.log(childSnapshot.val())
// });

// read once
// database.ref("Test").once('value', (snapshot) => {
//   console.log(snapshot.val());
// });