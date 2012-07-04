// Returns the function for getting the string of a specific
// item given the name of the item type in Redis.
exports.getItemStringFunction = function(itemString) {
  var functions = {
    "messages" : redisAction.getMessageString, 
    "paths" : redisAction.getPathString,
    "rects" : redisAction.getRectString,
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
    "rects" : redisAction.getRectsString,
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
exports.getMessagesString = function(meetingID, presentationID, pageID) {
  return "meeting-" + meetingID + "-messages";
};

// Get the string representing the key for a specific message in Redis
exports.getMessageString = function(meetingID, presentationID, pageID, messageID) {
  return "meeting-" + meetingID + "-message-" + messageID;
};

exports.getPresentationsString = function(meetingID) {
  return "meeting-" + meetingID + "-presentations";
};

exports.getPresentationString = function(meetingID, presentationID) {
  return "meeting-" + meetingID + "-presentation-" + presentationID;
};

exports.getPagesString = function(meetingID, presentationID) {
  return "meeting-" + meetingID + "-presentation-" + presentationID + "-pages";
};

exports.getCurrentPresentationString = function(meetingID) {
  return "meeting-" + meetingID + "-currentpresentation";
};

exports.getCurrentPageString = function(meetingID, presentationID) {
  return "meeting-" + meetingID + "-presentation-" + presentationID + "-currentpage";
};

exports.getPageString = function(meetingID, presentationID, pageID) {
  return "meeting-" + meetingID + "-presentation-" + presentationID + "-page-" + pageID;
};

exports.getPageImageString = function(meetingID, presentationID, pageID) {
  return "meeting-" + meetingID + "-presentation-" + presentationID + "-page-" + pageID + "-image";
};

exports.getPathString = function(meetingID, presentationID, pageID, pathID) {
  return "meeting-" + meetingID + "-presentation-" + presentationID + "-page-" + pageID + "-path-" + pathID;
};

exports.getPathsString  = function(meetingID, presentationID, pageID) {
  return "meeting-" + meetingID + "-presentation-" + presentationID + "-page-" + pageID + "-paths";
};

exports.getCurrentPathsString = function(meetingID, presentationID, pageID) {
  return "meeting-" + meetingID + "-presentation-" + presentationID + "-page-" + pageID + "-currentpaths";
};

exports.getRectString = function(meetingID, presentationID, pageID, rectID) {
  return "meeting-" + meetingID + "-presentation-" + presentationID + "-page-" + pageID + "-rect-" + rectID;
};

exports.getRectsString  = function(meetingID, presentationID, pageID) {
  return "meeting-" + meetingID + "-presentation-" + presentationID + "-page-" + pageID + "-rects";
};

exports.getCurrentRectsString = function(meetingID, presentationID, pageID) {
  return "meeting-" + meetingID + "-presentation-" + presentationID + "-page-" + pageID + "-currentrects";
};

exports.deleteItemList = function(meetingID, presentationID, pageID, itemName, callback) {
  //delete the list which contains the item ids
  store.del(redisAction.getItemsStringFunction(itemName)(meetingID, presentationID, pageID), function(err, reply) {
    if(reply) {
      console.log("Delete the list of items: " + itemName);
    }
    else console.log("Error: could not delete list of items: " + itemName);
  });
};

// Deletes the items by itemName and an array of itemIDs (use helper)
exports.deleteItems = function(meetingID, presentationID, pageID, itemName, itemIDs) {
  console.log("Deleting " + itemName +" with IDs ");
  console.log(itemIDs);
  //delete each item
  for (var j = itemIDs.length - 1; j >= 0; j--) {
    console.log(redisAction.getItemStringFunction(itemName)(meetingID, presentationID, pageID, itemIDs[j]));
    store.del(redisAction.getItemStringFunction(itemName)(meetingID, presentationID, pageID, itemIDs[j]), function(err, reply) {
      if(reply) {
        console.log("Deleted item: " + itemName);
      }
      else console.log("Error: could not delete item: " + itemName);
    });
  };
};

// Process of the meeting once all the users have left
// For now, this simply deletes all the messages
exports.processMeeting = function(meetingID) {
  redisAction.getPresentationIDs(meetingID, function(presIDs) {
    for(var k = presIDs.length - 1; k >=0; k--) {
      redisAction.getPageIDs(meetingID, presIDs[k], function(presID, pageIDs) {
        for(var m = pageIDs.length - 1; m >= 0; m--) {
          items = ['messages', 'paths', 'rects'];
          var j = 0;
          for (var j = items.length - 1; j >= 0; j--) {
            //must iterate through all presentations and all pages
            redisAction.getItemIDs(meetingID, presID, pageIDs[m], items[j], function(meetingID, presentationID, pageID, itemIDs, itemName) {
              redisAction.deleteItems(meetingID, presentationID, pageID, itemName, itemIDs);
            });
          }
          lists = ['currentpaths', 'currentrects', 'messages', 'paths', 'rects'];
          for (var n = lists.length - 1; n >= 0; n--) {
            redisAction.deleteItemList(meetingID, presID, pageIDs[m], lists[n]);
          }
        }
      });
      redisAction.deletePages(meetingID, presIDs[k]); //delete all the pages for the associated presentation
    }
  });
  redisAction.deletePresentations(meetingID); //delete all the presentations
};

// This doesn't work right now. It is supossed to delete all the messages from
// a specific meeting
exports.getItemIDs = function(meetingID, presentationID, pageID, itemName, callback) {
  store.lrange(redisAction.getItemsStringFunction(itemName)(meetingID, presentationID, pageID), 0, -1, function(err, itemIDs) {
    callback(meetingID, presentationID, pageID, itemIDs, itemName);
  });
};

exports.getPresentationIDs = function(meetingID, callback) {
  store.smembers(redisAction.getPresentationsString(meetingID), function(err, presIDs) {
    callback(presIDs);
  });
};

exports.getPageIDs = function(meetingID, presentationID, callback) {
  store.lrange(redisAction.getPagesString(meetingID, presentationID), 0, -1, function(err, pageIDs) {
    callback(presentationID, pageIDs);
  });
};

// Checks the Redis datastore whether the session is valid
exports.isValidSession = function(meetingID, sessionID, callback) {
  store.sismember(redisAction.getUsersString(meetingID), sessionID, function(err, isValid) {
    callback(isValid);
  });
};

exports.deletePages = function(meetingID, presentationID) {
  store.del(redisAction.getPagesString(meetingID, presentationID), function(err, reply) {
    if(reply) {
      console.log("Deleted all pages");
    }
    else console.log("Couldn't delete all pages");
  });
  store.del(redisAction.getCurrentPageString(meetingID, presentationID), function(err, reply) {
    if(reply) {
      console.log("Deleted current page");
    }
    else console.log("Couldn't delete current page");
  });
};

exports.deletePresentations = function(meetingID) {
  store.del(redisAction.getPresentationsString(meetingID), function(err, reply) {
    if(reply) {
      console.log("Deleted all presentations");
    }
    else console.log("Couldn't delete all presentations");
  });
  store.del(redisAction.getCurrentPresentationString(meetingID), function(err, reply) {
    if(reply) {
      console.log("Deleted current presentation");
    }
    else console.log("Couldn't delete current presentation");
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
exports.getItems = function(meetingID, presentationID, pageID, item, callback) {
  var items = [];
  var itemCount = 0;
  var itemsDone = 0;
  var itemsGetFunction;
  var itemGetFunction;
  
  itemGetFunction = redisAction.getItemStringFunction(item);
  itemsGetFunction = redisAction.getItemsStringFunction(item);
  
  store.lrange(itemsGetFunction(meetingID, presentationID, pageID), 0, -1, function (err, itemIDs) {
    itemCount = itemIDs.length;
    for (var i = itemCount - 1; i >= 0; i--) {
      store.hgetall(itemGetFunction(meetingID, presentationID, pageID, itemIDs[i]), function(err, itemHash) {
        items.push(itemHash);
        itemsDone++;
        if (itemCount == itemsDone) {
          callback(items);
        }
      });
    };
  });
};

exports.getCurrentPresentationID = function(meetingID, callback) {
  store.get(redisAction.getCurrentPresentationString(meetingID), function(err, currPresID) {
    if(currPresID) {
      callback(currPresID);
    }
    else console.log("Error: could not get current presentationID");
  });
};

exports.getCurrentPageID = function(meetingID, presentationID, callback) {
  store.get(redisAction.getCurrentPageString(meetingID, presentationID), function(err, currPgID) {
    if(currPgID) {
      callback(currPgID);
    }
    else console.log("Error: could not get current pageID");
  });
};