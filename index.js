/**
 *@author Mintaha Tekdemir
 */

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var newuser = [];
var users = {};

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

http.listen(3000, function() {
    console.log('listening on *:3000');
});

// connect a user
io.on('connection', function(socket) {
    console.log(" a user connected");
    // disconnect a user
    // if the user leaves the chat room, the userlist will updated
    //and a message is generated to the chat room with offline
    socket.on('disconnect', function(user) {
        console.log("user disconnected");
        var date = new Date();
        if (!socket.names) return;
        newuser.splice(newuser.indexOf(socket.names), 1);
        io.emit('usernames', newuser);
        io.sockets.emit('chat message', {message : socket.names + " is offline", date : date
        });

    });

    // user register with a username
    // check of username is valid
    // if the username is valid, user has join to the chat
    // and the user list is updated
    //a message is generated when the new user connects to the chat room
    socket.on('login user', function(username, callback) {
        console.log(username);
        var date = new Date();
        if (newuser.indexOf(username) == -1) {
            socket.names = username;
            newuser.push(socket.names);
            users[socket.names]=socket.id  // save the userids in users
            io.emit('usernames', newuser);
            io.sockets.emit('chat message', {message : socket.names + " is online", date : date
            });
            callback(true);
        } else {
            callback(false);
        }
    });

    // the chat message is public and displayed in chronological order with a date and  username
    socket.on('chat message', function(msg) {
        var date = new Date();
        io.sockets.emit('chat message', {message : msg, name : socket.names, date : date
        });
    });

    //
   socket.on('private message', function(privateData){
    socket.to(users[privateData.privateMsgTo]).emit('private nessage',
        {privateMessageFrom : socket.names, msg: privateData.msg
    });

});

});


