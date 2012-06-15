exports.getMeetingsString = function() {
  return "meetings";
};

exports.getMeetingString = function(meetingID) {
  return "meeting-" + meetingID;
};

exports.getUsersString = function(meetingID) {
  return "meeting-" + meetingID + "-users";
};

exports.getUserString = function(meetingID, sessionID) {
  return "meeting-" + meetingID + "-user-" + sessionID;
};

// Checks the Redis datastore whether the session is valid
exports.isValidSession = function(meetingID, sessionID, callback) {
  store.sismember(redisAction.getUsersString(meetingID), sessionID, function(err, isValid) {
    callback(isValid);
  });
};

// Gets all the properties associated with a specific user (sessionID)
exports.getUserProperties = function(meetingID, sessionID, callback) {
  store.hgetall(redisAction.getUserString(meetingID, sessionID), function(err, properties) {
    callback(properties);
  });
};

// Gets a single property from a specific user
exports.getUserProperty = function(meetingID, sessionID, property, callback) {
  store.hget(redisAction.getUserString(meetingID, sessionID), property, function(err, prop) { 
    callback(prop);
  });
};

// Get all users and their data in an array
exports.getUsers =  function (meetingID, callback) {
  users = [];
  usercount = 0;
  usersdone = 0;

  store.smembers(redisAction.getUsersString(meetingID), function (err, userids) {
    usercount = userids.length;
    for (var i = usercount - 1; i >= 0; i--){
      store.hgetall(redisAction.getUserString(meetingID, userids[i]), function (err, props) {
        users.push(props);
        usersdone++;
        if (usercount == usersdone) {
          callback(users);
        }
      });
    };
  });
};