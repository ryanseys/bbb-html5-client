/**
 * Module dependencies.
 */

users = { }; //global variable for (temporary) datastore

var express = require('express')
	, routes = require('./routes')
	, app = module.exports = express.createServer()
	, io = require('socket.io').listen(app)
	, RedisStore = require('connect-redis')(express)
	, redis = require("redis")
	, client = redis.createClient();

// Configuration

app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express['static'](__dirname + '/public'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser());
	app.use(express.session({
		secret: "password",
		cookie: { secure: true },
		store: new RedisStore({
			host: "127.0.0.1",
			port: "6379",
			db: "name_of_my_local_db"
		}),
		key: 'express.sid'
	}));
	app.use(app.router);
});

app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	
});

app.configure('production', function(){
	app.use(express.errorHandler());
});

// If a page requires authentication to view...
function requiresLogin(req, res, next) {
	//check that they have a cookie with valid session id
	if(users[req.cookies['id']]) {
		next();
	} else {
		res.redirect('/');
	}
}

// Routes (see /routes/index.js)
app.get('/', routes.get_index);
app.post('/chat',  routes.post_chat);
app.post('/logout', requiresLogin, routes.logout);
app.get('/chat', requiresLogin, routes.get_chat);

// --- 404 (keep as last route) --- //
//app.get('*', routes.error404);

// Start the web server listening
app.listen(3000, function() {
	console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

// Socket.IO Routes

/* 
  This verifies with the database that the sessionID
  contained within the connected socket is indeed valid.
  If the sessionID is not valid, the socket is disconnected
  and the function returns false.
  
  This test is to be used whenever a connected socket requests
  to make actions against the server i.e. sends a message to the server.
*/
function is_valid_connected(socket) {
	if(!users[socket.sessid]) {
		socket.disconnect();
		return false;
	}
	else return true;
};

// When someone connects to the websocket.
io.sockets.on('connection', function(socket) {
  var socket_redis = redis.createClient();
  var meetingRoom = "";
	//When a user sends a message...
	socket.on('msg', function(msg) {
	  if(is_valid_connected(socket)) {
      client.publish(socket.meetingID, JSON.stringify(['msg', socket.username, msg]));
	  }
	});

	// When a user connects to the socket...

	socket.on('user connect', function(id) {
		if(!users[id]) {
			socket.disconnect();
		}
		else {
			socket.sessid = id;
			//save the username into the socket data
			socket.username = users[id]['username'];
			//save the meetingID into the socket data
			socket.meetingID = meetingRoom = users[id]['meetingID'];
			socket.join(meetingRoom); //join the socket Room with name of the meetingID
			socket_redis.subscribe('bbb.html.*'); //redis instance subscribe to all html messages
			socket_redis.subscribe(socket.meetingID); //redis instance subscribe to meetingID as well
			
			//add socket to list of sockets.
			users[id]['sockets'][socket.id] = true;
			if((users[id]['refreshing'] == false) && (users[id]['duplicateSession'] == false)) {
			   //all of the next sessions created with this id are duplicates
				users[id]['duplicateSession'] = true; 
				socket.broadcast.emit('user connect', socket.username);
			}
			else users[id]['refreshing'] = false;
		}
	});

	// When a user disconnects from the socket...
	socket.on('disconnect', function () {
		var session_id = socket.sessid;
		if(users[session_id]) {
		  var socket_id = socket.id;
  		var username = socket.username;
			users[session_id]['refreshing'] = true; //assume they are refreshing...

			//wait one second, then check if there are 0 sockets...
			setTimeout(function() {
				if(users[session_id]) {
					delete users[session_id]['sockets'][socket_id]; //socket has been disconnected
					if(Object.keys(users[session_id]['sockets']).length == 0) {
						delete users[session_id]; //delete the user from the datastore
						io.sockets.emit('user disconnected', username); //tell everyone they disconnected
					}
				}
				else {
					io.sockets.emit('user disconnected', username); //tell everyone they disconnected
				}
			}, 1000);
		}
	});

	socket.on('logout', function() {
	  var username = socket.username;
		if(is_valid_connected(socket)) {
		  var session_id = socket.sessid;
      var sockets = users[session_id]['sockets']; //get all connected sockets
      delete users[session_id]; //delete user from datastore
			for (socket_id in sockets) {
        if (sockets.hasOwnProperty(socket_id)) {
          io.sockets.socket(socket_id).emit('logout');
				}
			}
			socket.disconnect();
		}
		io.sockets.emit('user disconnected', username);
	});
	
	// Redis Routes
  socket_redis.on("message", function(channel, message) {
    var params = JSON.parse(message);
    socket.emit.apply(socket, params);
  });

  client.on('message', function(msg) {
    //do nothing here
  });

  client.on('disconnect', function() {
    socket_redis.quit();
  });
});
