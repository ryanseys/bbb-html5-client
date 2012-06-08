/**
 * Module dependencies.
 */

users = { }; //global variable for (temporary) datastore

var express = require('express')
	, routes = require('./routes')
	, app = module.exports = express.createServer()
	, io = require('socket.io').listen(app)
	, RedisStore = require('connect-redis')(express);
	
// Configuration

app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser());
	app.use(express['static'](__dirname + '/public'));
	app.use(app.router);
});

app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
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
app.post('/chat', routes.post_chat);
app.post('/logout', requiresLogin, routes.logout);
app.get('/chat', requiresLogin, routes.get_chat);

// --- 404 (keep as last route) --- //
//app.get('*', routes.error404);

// Start the web server listening
app.listen(3000, function() {
	console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});


// Socket.IO

// When someone connects to the websocket.
io.sockets.on('connection', function(socket) {
		//redisStore.destroy('555444', function(err) { ... });
		//When a user sends a message...
		socket.on('msg', function(msg) {
			io.sockets.emit('msg', socket.username, msg);
		});

		// When a user connects to the socket...
		
		socket.on('user connect', function(id) {
			if(!users[id]) {
				console.log("Invalid user.");
				socket.disconnect();
			}
			else {
				socket.sessid = id;
				socket.username = users[id]['username']; //save the username into the socket data
				users[id]['sockets'][socket.id] = true; //add socket to list of sockets.
				if(users[id]['refreshing'] == false) {
					io.sockets.emit('user connect', socket.username);
				}
				else users[id]['refreshing'] = false;
			}
		});

		// When a user disconnects from the socket...
		socket.on('disconnect', function () {
			delete users[socket.sessid]['sockets'][socket.id]; //socket has been disconnected
			var user = users[socket.sessid];
			users[socket.sessid]['refreshing'] = true; //assume they are refreshing...
			//if they aren't, they will be deleted anyway.
	
			//wait one second, then check if there are 0 sockets...
			setTimeout(function() {
				if(Object.keys(users[socket.sessid]['sockets']).length == 0) {
					console.log(users[socket.sessid]['username'] + " has been disconnected!");
					delete users[socket.sessid]; //delete the user from the datastore
					io.sockets.emit('user disconnected', socket.username); //tell everyone they disconnected
				}
			}, 1000);
		});
});
