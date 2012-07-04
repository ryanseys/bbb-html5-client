// Returns the function for getting the string of a specific
// item given the name of the item type in Redis.
exports.getItemStringFunction = function(itemString) {
  var functions = {
    "messages" : redisAction.getMessageString, 
    "paths" : redisAction.getPathString, 
    "currentpaths" : redisAction.getPathString,
    "currentrects" : redisAction.getRectString
  };
  return functions[itemString];
};

// Returns the function for getting the string of all the items
// given the name of the items in Redis
exports.getItemsStringFunction = function(itemString) {
  var functions = {
    "messages" : redisAction.getMessagesString, 
    "paths" : redisAction.getPathsString, 
    "currentpaths" : redisAction.getCurrentPathsString,
    "currentrects" : redisAction.getCurrentRectsString
  };
  return functions[itemString];
};

// Get the string respresenting the list of meetings 
// in Redis
exports.getMeetingsString = function() {
  return "meetings";
};

// Get the string representing the key for the meeting
// given the meetingID in Redis
exports.getMeetingString = function(meetingID) {
  return "meeting-" + meetingID;
};

// Get the string representing the key for the hash of all
// the users for a specified meetingID in Redis
exports.getUsersString = function(meetingID) {
  return "meeting-" + meetingID + "-users";
};

// Get the string representing the key for a specific sessionID in Redis
exports.getUserString = function(meetingID, sessionID) {
  return "meeting-" + meetingID + "-user-" + sessionID;
};

// Get the string representing the key for the hash of all
// the messages for a specified meetingID in Redis
exports.getMessagesString = function(meetingID) {
  return "meeting-" + meetingID + "-messages";
};

// Get the string representing the key for a specific message in Redis
exports.getMessageString = function(meetingID, messageID) {
  return "meeting-" + meetingID + "-message-" + messageID;
};

exports.getPathString = function(meetingID, pathID) {
  return "meeting-" + meetingID + "-path-" + pathID;
};

exports.getPathsString  = function(meetingID) {
  return "meeting-" + meetingID + "-paths";
};

exports.getCurrentPathsString = function(meetingID) {
  return "meeting-" + meetingID + "-currentpaths";
};

exports.getRectString = function(meetingID, rectID) {
  return "meeting-" + meetingID + "-rect-" + rectID;
};

exports.getRectsString  = function(meetingID) {
  return "meeting-" + meetingID + "-rects";
};

exports.getCurrentRectsString = function(meetingID) {
  return "meeting-" + meetingID + "-currentrects";
};

exports.deleteItemList = function(meetingID, itemName, callback) {
  //delete the list which contains the item ids
  store.del(redisAction.getItemsStringFunction(itemName)(meetingID), function(err, reply) {
    if(reply) {
      console.log("Delete the list of items");
    }
  });
};

// Deletes the items by itemName and an array of itemIDs (use helper)
exports.deleteItems = function(meetingID, itemName, itemIDs) {
  //delete each item
  for (var j = itemIDs.length - 1; j >= 0; j--) {
    store.del(redisAction.getItemStringFunction(itemName)(meetingID, itemIDs[j]), function(err, reply) {
      if(reply) {
        console.log("Deleted item");
      }
    });
  };
};

// Process of the meeting once all the users have left
// For now, this simply deletes all the messages
exports.processMeeting = function(meetingID) {
  items = ['messages', 'paths', 'currentpaths'];
  var i = 0;
  for (var i = items.length - 1; i >= 0; i--){
    redisAction.getItemIDs(meetingID, items[i], function(itemIDs, itemName) {
      redisAction.deleteItemList(meetingID, itemName);
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

// Get array of items by item name and meeting id
exports.getItems = function(meetingID, item, callback) {
  var items = [];
  var itemCount = 0;
  var itemsDone = 0;
  var itemsGetFunction;
  var itemGetFunction;
  
  itemGetFunction = redisAction.getItemStringFunction(item);
  itemsGetFunction = redisAction.getItemsStringFunction(item);
  
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