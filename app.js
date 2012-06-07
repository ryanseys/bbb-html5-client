/**
 * Module dependencies.
 */

users = {}; //global variable for (temporary) datastore

var express = require('express')
	, routes = require('./routes')
	, app = module.exports = express.createServer()
	, io = require('socket.io').listen(app)
	, RedisStore = require('connect-redis')(express)
	, redisStore = new RedisStore;
	
// Configuration

app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser());
	app.use(express.session({ secret: 'keyboard cat', cookie: { secure: true }, store: redisStore, key: 'express.sid' }));
	app.use(express['static'](__dirname + '/public'));
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
app.post('/chat', routes.post_chat);
app.post('/logout', routes.logout);
app.get('/logout', routes.logout);
app.get('/chat', requiresLogin, routes.get_chat);

// Start the web server listening
app.listen(3000, function() {
	console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

// Socket.IO

// When someone connects to the websocket.
io.sockets.on('connection', function(socket) {
	
	//When a user sends a message...
	socket.on('msg', function(msg) {
		io.sockets.emit('msg', socket.username, msg);
	});
	
	// When a user connects to the socket...
	socket.on('user connect', function(id) {
		socket.sessid = id;
		socket.username = users[id]; //save the username into the socket data
		io.sockets.emit('user connect', socket.username);
	});
	
	// When a user disconnects from the socket...
	socket.on('disconnect', function () {
	    io.sockets.emit('user disconnected', socket.username);
		//delete users[socket.sessid]; //delete the disconnected user from the datastore
	  });
});
