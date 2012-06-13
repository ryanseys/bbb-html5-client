/**
 * Module dependencies.
 */
//default global variables
users = { }; //global variable for (temporary) datastore
max_chat_length = 140;
max_username_length = 30;
max_meetingid_length = 10;

subscriptions = ['bbb.meetingid.chat.*', 'bbb.meetingid.slide.*', '*'];

var express = require('express')
	, routes = require('./routes')
	, socketroutes = require('./routes/socketio')
	, app = module.exports = express.createServer()
	, io = require('socket.io').listen(app)
	, RedisStore = require('connect-redis')(express);
	
	
	redis = require('redis');
	
	gfunc = {
      isValidSession: function(sessionID, callback) {
        store.sismember("users", "user:" + sessionID, function(err, reply) {
          callback(reply);
        });
      },

      getUserProperties: function(sessionID, callback) {
        store.hgetall("user:" + sessionID, function(err, reply) {
          callback(reply);
        });
      },
      
      getUserProperty: function(sessionID, property, callback) {
        store.hget("user:" + sessionID, property, function(err, reply) { 
          callback(reply);
        });
      }
  };
	
	//global variables
	sanitizer = require('sanitizer');
	store = redis.createClient();
	store.flushdb();
	pub = redis.createClient();
	sub = redis.createClient();
	
  sub.psubscribe.apply(sub, subscriptions);
  
  maxImage = 3;

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
	gfunc.isValidSession(req.cookies['id'], function(reply) {
	  if(reply) {
  		next();
  	} else {
  		res.redirect('/');
  	}
	});
	
}

// Routes (see /routes/index.js)
app.get('/', routes.get_index);
app.post('/chat',  routes.post_chat);
app.post('/logout', requiresLogin, routes.logout);
app.get('/chat', requiresLogin, routes.get_chat);

// --- 404 (keep as last route) --- //
app.get('*', routes.error404);

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

// Used to parse the cookie data.
function getCookie(cookie_string, c_var) {
	var i,x,y,ARRcookies=cookie_string.split(";");
	for (i=0;i<ARRcookies.length;i++) {
		x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
		y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
		x=x.replace(/^\s+|\s+$/g,"");
		if (x==c_var) {
			return unescape(y);
		}
	}
}

io.configure(function () {
  io.set('authorization', function (handshakeData, callback) {
    //console.log(handshakeData);
    var id = handshakeData.sessionID = getCookie(handshakeData.headers.cookie, "id");
    gfunc.isValidSession(id, function(reply) {
      console.log(reply);
      if(!reply) {
        console.log("Invalid sessionID");
        callback(null, false); //failed authorization
      }
      else {
        gfunc.getUserProperties(id, function (reply) {
          console.log(reply);
          handshakeData.username = reply.username;
          handshakeData.meetingID = reply.meetingID;
          callback(null, true); // error first callback style
        });
      }
    });
  });
});

// When someone connects to the websocket.
io.sockets.on('connection', socketroutes.onconnection);

// Redis Routes

//When sub gets a message from pub
sub.on("pmessage", function(pattern, channel, message) {
  console.log(pattern);
  var channel_viewers = io.sockets['in'](channel);
  var params = JSON.parse(message);
  channel_viewers.emit.apply(channel_viewers, params);
});
