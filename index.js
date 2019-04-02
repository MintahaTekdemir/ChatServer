/**
 *@author Mintaha Tekdemir, 751226
 * mintaha.tekdemir@student.reutlingen-university.de
 */

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var newuser = [];
var users = {};
var loadfile;

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
        io.sockets.emit('chat message', {message : socket.names + " is offline",name : socket.names, date : date
        });

    });

    // user register with a username
    // check of username is valid
    // if the username is valid, user has join to the chat
    // and the user list is updated
    //a message is generated when the new user connects to the chat room
    socket.on('login user', function(username, callback) {
        var date = new Date();
        if(!username){
        }else if (newuser.indexOf(username) == -1) {
            socket.names = username;
            newuser.push(socket.names);
            users[socket.names]=socket; // save the users in socket
            io.emit('usernames', newuser);
            io.sockets.emit('chat message', {message : socket.names + " is online",name : socket.names, date : date
            });
            callback(true);
        } else {
            callback(false);
        }
    });

    // the chat message is public and displayed in chronological order with a date and  username
    socket.on('chat message', function(msg) {
        var date = new Date();
        if(!msg.msg) {
        }else {
            if(msg.file){
                io.sockets.emit('chat message', {message: msg.msg, name: socket.names, date: date, file: msg.file, nameFile: msg.nameFile});
            }else{
                io.sockets.emit('chat message', {message: msg.msg, name: socket.names, date: date});
            }
        }
    });


    //private message
    // send private message to online user
   socket.on('private message', function(privateData,callback){
       var date= new Date();
       var callb = "OK";
       var user= [privateData.privateMsgTo];
        if(!privateData.privateMsgTo){
            callb = "emptyUser";
        }else {
            if (!privateData.msg) {
                callb = "emptyMSG";
            }else if (privateData.privateMsgTo==socket.names){
                callb = "msgToHIMSELF";
            } else {
                if(!isValidUser(user)){
                    callb = "invalid";
                }else{
                    if (privateData.file) {
                        users[privateData.privateMsgTo].emit('private message', {
                            privateMessageFrom: socket.names,
                            msg: privateData.msg,
                            date: date,
                            file: privateData.file,
                            nameFile: privateData.nameFile
                        });
                        users[socket.names].emit('private message', {
                            privateMessageFrom: socket.names,
                            msg: privateData.msg,
                            date: date,
                            file: privateData.file,
                            nameFile: privateData.nameFile
                        });
                    } else {
                        users[privateData.privateMsgTo].emit('private message', {
                            privateMessageFrom: socket.names, msg: privateData.msg, date: date
                        });
                        users[socket.names].emit('private message', {
                            privateMessageFrom: socket.names, msg: privateData.msg, date: date
                        });
                    }
                }

            }
        }
        callback(callb);
});
     //chat multicast
    // send message to subset of users
    // recipients are informed about to whom this msg was sent
    // Syntax enter username: Test1,Test2
    socket.on('multicast chat', function(data,callback) {
        var date = new Date();
        var splitted = data.multiMessageTo.split(",");
        if(!data.msg){

        }else if(isValidUser(splitted)){
            splitted.forEach(function (value) {
                users[value].emit('multicast chat', { multiMessageFrom : socket.names, msg: data.msg, date:date, To: data.multiMessageTo});
            });
            users[socket.names].emit('multicast chat', { multiMessageFrom : socket.names, msg: data.msg, date:date, To: data.multiMessageTo});
        }else{
            callback(false);
        }
    });
});

//check if the user is valid
function isValidUser(array){
    var valid=true;
    array.forEach(function (value) {
        if(!users[value]){
            valid = false;
        }
    });
    return valid;
}

