exports.getItemStringFunction = function(itemString) {
  var functions = {"messages" : redisAction.getMessageString };
  return functions[itemString];
};

exports.getItemsStringFunction = function(itemString) {
  var functions = {"messages" : redisAction.getMessagesString };
  return functions[itemString];
};

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

exports.getMessagesString = function(meetingID) {
  return "meeting-" + meetingID + "-messages";
};

exports.getMessageString = function(meetingID, messageID) {
  return "meeting-" + meetingID + "-message-" + messageID;
};

exports.deleteItems = function(meetingID, itemName, itemIDs) {
  //delete the list which contains the item ids
  store.del(redisAction.getItemsStringFunction(itemName)(meetingID), function(err, reply) {
    if(reply) {
      console.log("Delete the list of items");
    }
  });
  
  //delete each item
  for (var j = itemIDs.length - 1; j >= 0; j--) {
    store.del(redisAction.getItemStringFunction(itemName)(meetingID, itemIDs[j]), function(err, reply) {
      if(reply) {
        console.log("Deleted item");
      }
    });
  };
};

exports.processMeeting = function(meetingID) {
  items = ['messages'];
  var i = 0;
  for (var i = items.length - 1; i >= 0; i--){
    redisAction.getItemIDs(meetingID, items[i], function(itemIDs, itemName) {
      redisAction.deleteItems(meetingID, itemName, itemIDs);
    });
  };
};

// This doesn't work right now. It is supossed to delete all the messages from
// a specific meeting
exports.getItemIDs = function(meetingID, itemName, callback) {
  store.lrange(redisAction.getItemsStringFunction(itemName)(meetingID), 0, -1, function(err, itemIDs) {
      callback(itemIDs, itemName);
  });
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
// (users are in a set, not a list, because they need to be accessed with O(1))
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

exports.getItems = function(meetingID, item, callback) {
  var items = [];
  var itemCount = 0;
  var itemsDone = 0;
  var itemsGetFunction;
  var itemGetFunction;
  
  if(item == "messages") {
    itemsGetFunction = redisAction.getMessagesString;
    itemGetFunction = redisAction.getMessageString;
  }
  else callback([]);
  
  store.lrange(itemsGetFunction(meetingID), 0, -1, function (err, itemIDs) {
    itemCount = itemIDs.length;
    for (var i = itemCount - 1; i >= 0; i--) {
      store.hgetall(itemGetFunction(meetingID, itemIDs[i]), function(err, itemHash) {
        items.push(itemHash);
        itemsDone++;
        if (itemCount == itemsDone) {
          callback(items);
        }
      });
    };
  });
};