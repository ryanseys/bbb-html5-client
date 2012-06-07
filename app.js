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

function requiresLogin(req, res, next) {
	if(req.session.user) {
		next();
	} else {
		res.redirect('/');
	}
}

// Routes
app.get('/', routes.get_index);
app.post('/chat', routes.post_chat);
app.post('/logout', routes.logout);
app.get('/logout', routes.logout);
app.get('/chat', requiresLogin, routes.get_chat);

// Start the web server listening
app.listen(3000, function() {
	console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

// When someone connects to the websocket.
io.sockets.on('connection', function(socket) {
	console.log('A socket: ' + socket.id + ' connected!');
	socket.on('msg', function(msg, id) {
		var name = users[id];
		io.sockets.emit('msg', name + ': ' + msg);
	});
});
