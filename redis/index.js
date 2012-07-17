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

exports.getCurrentUsersString = function(meetingID) {
  return "meeting-" + meetingID + "-currentusers";
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

exports.getCurrentPageNumString = function(meetingID, presentationID, pageID) {
  return "meeting-" + meetingID + "-presentation-" + presentationID + "-currentpagenum";
};

exports.getCurrentViewBoxString = function(meetingID, presentationID) {
  return "meeting-" + meetingID + "-presentation-" + presentationID + "-viewbox";
};

exports.getCurrentToolString = function(meetingID) {
  return "meeting-" + meetingID + "-currenttool";
};

exports.getPresenterString = function(meetingID) {
  return "meeting-" + meetingID + "-presenter";
};

exports.setCurrentTool = function(meetingID, tool, callback) {
  store.set(redisAction.getCurrentToolString(meetingID), tool, function(err, reply) {
    if(reply) {
      if(callback) callback(true);
    }
    else if(err) {
      console.log(err);
      if(callback) callback(null);
    }
  });
};

exports.setPresenter = function(meetingID, sessionID, callback) {
  store.set(redisAction.getPresenterString(meetingID), sessionID, function(err, reply) {
    if(reply) {
      if(callback) callback(true);
    }
    else if(err) {
      console.log(err);
      if(callback) callback(false);
    }
  });
};

exports.getPresenter = function(meetingID, callback) {
  store.get(redisAction.getPresenterString(meetingID), function(err, reply) {
    if(reply) {
      callback(reply);
    }
    else if(err) {
      console.log(err);
      callback(null);
    }
  });
};

exports.getCurrentTool = function(meetingID, callback) {
  store.get(redisAction.getCurrentToolString(meetingID), function(err, reply) {
    if(reply) {
      callback(reply);
    }
    else if(err) {
      console.log(err);
      callback(null);
    }
  });
};

exports.deleteItemList = function(meetingID, presentationID, pageID, itemName, callback) {
  //delete the list which contains the item ids
  store.del(redisAction.getItemsStringFunction(itemName)(meetingID, presentationID, pageID), function(err, reply) {
    if(reply) {
      console.log("REDIS: Deleted the list of items: " + itemName);
    }
    if(err) console.log("REDIS ERROR: could not delete list of items: " + itemName);
  });
};

// Deletes the items by itemName and an array of itemIDs (use helper)
exports.deleteItems = function(meetingID, presentationID, pageID, itemName, itemIDs) {
  //delete each item
  for (var j = itemIDs.length - 1; j >= 0; j--) {
    store.del(redisAction.getItemStringFunction(itemName)(meetingID, presentationID, pageID, itemIDs[j]), function(err, reply) {
      if(reply) console.log("REDIS: Deleted item: " + itemName);
      if(err) console.log("REDIS ERROR: could not delete item: " + itemName);
    });
  };
};

exports.deleteMeeting = function(meetingID, callback) {
  store.srem(redisAction.getMeetingsString(), meetingID, function(err, reply) {
    if(reply) {
      console.log("Deleted meeting " + meetingID + " from list of meetings.");
      if(callback) callback(true);
    }
    else if(err) {
      console.log("Meeting was not in the list of meetings.");
      if(callback) callback(false);
    }
  });
};

// Process of the meeting once all the users have left
// For now, this simply deletes all the messages
exports.processMeeting = function(meetingID) {
  redisAction.deleteMeeting(meetingID);
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

exports.getCurrentUsers = function(meetingID, callback) {
  store.smembers(redisAction.getCurrentUsersString(meetingID), function(err, reply) {
    if(reply) {
      callback(reply);
    }
    else if(err) {
      
    }
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

exports.isMeetingRunning = function(meetingID, callback) {
  store.sismember(redisAction.getMeetingsString(), meetingID, function(err, reply) {
    if(reply == 1) {
      callback(true);
    }
    else if(reply == 0) {
      callback(false);
    }
  });
};

exports.deletePages = function(meetingID, presentationID, callback) {
  //delete each page image
  redisAction.getPageIDs(meetingID, presentationID, function(presentationID, pageIDs) {
    for (var i = pageIDs.length - 1; i >= 0; i--) {
      redisAction.deletePageImage(meetingID, presentationID, pageIDs[i]);
    };
    //delete list of pages
    store.del(redisAction.getPagesString(meetingID, presentationID), function(err, reply) {
      if(reply) console.log("REDIS: Deleted all pages");
      if(err) console.log("REDIS ERROR: Couldn't delete all pages");
      //delete currentpage
      store.del(redisAction.getCurrentPageString(meetingID, presentationID), function(err, reply) {
        if(reply) console.log("REDIS: Deleted current page");
        if(err) console.log("REDIS ERROR: Couldn't delete current page");
        if(callback) callback();
      });
    });
  });
};

exports.deletePageImage = function(meetingID, presentationID, pageID, callback) {
  store.del(redisAction.getPageImageString(meetingID, presentationID, pageID), function(err, reply) {
    if(reply) console.log("REDIS: Deleted page image");
    if(err) console.log("REDIS ERROR: Could not delete page image");
    if(callback) callback();
  });
};

exports.deletePresentations = function(meetingID, callback) {
  store.del(redisAction.getPresentationsString(meetingID), function(err, reply) {
    if(reply) console.log("REDIS: Deleted all presentations");
    else console.log("REDIS ERROR: Couldn't delete all presentations");
    store.del(redisAction.getCurrentPresentationString(meetingID), function(err, reply) {
      if(reply) console.log("REDIS: Deleted current presentation");
      if(err) console.log("REDIS ERROR: Couldn't delete current presentation");
      if(callback) callback();
    });
  });
};

exports.deleteUser = function(meetingID, sessionID, callback) {
  store.srem(redisAction.getUsersString(meetingID), sessionID, function(err, num_deleted) {
    store.del(redisAction.getUserString(meetingID, sessionID), function(err, reply) {
		  callback(true);
    });
  });
};

//Remove the current user from the list of current user
exports.deleteCurrentUser = function(meetingID, sessionID, callback) {
  store.srem(redisAction.getCurrentUsersString(meetingID), sessionID, function(err, num_deleted) {
    callback(true);
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
    if(prop) callback(prop);
    if(err) {
      console.log(err);
      callback(null);
    }
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

exports.getPageImage = function(meetingID, presentationID, pageID, callback) {
  store.get(redisAction.getPageImageString(meetingID, presentationID, pageID), function(err, filename) {
    if(filename) callback(filename);
    else console.log("REDIS ERROR: Couldn't get page image");
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
    else console.log("REDIS ERROR: Couldn't get current presentationID");
  });
};

exports.changeToNextPage = function(meetingID, presentationID, callback) {
  var pages = redisAction.getPagesString(meetingID, presentationID);
  store.lpop(pages, function(err, reply) {
    store.rpush(pages, reply, function(err, reply) {
      store.lindex(pages, 0, function(err, currPage){
        if(currPage) {
          callback(currPage);
        }
        else console.log("REDIS ERROR: Couldn't get current pageID");
      });
    });
  });
};

exports.changeToPrevPage = function(meetingID, presentationID, callback) {
  var pages = redisAction.getPagesString(meetingID, presentationID);
  //removes the last element and then returns it, only after appending it back
  //to the beginning of the same list
  store.rpoplpush(pages, pages, function(err, currPage) {
    if(currPage) {
      callback(currPage);
    }
    else console.log("REDIS ERROR: Couldn't get current pageID");
  });
};

exports.getCurrentPageID = function(meetingID, presentationID, callback) {
  //The first element in the pages is always the current page
  store.lindex(redisAction.getPagesString(meetingID, presentationID), 0, function(err, currPgID) {
    if(currPgID) {
      callback(currPgID);
    }
    else console.log("REDIS ERROR: Couldn't get current pageID");
  });
};

exports.createPresentation = function(meetingID, setCurrent, callback) {
  var presentationID = rack(); //create a new unique presentationID
  store.sadd(redisAction.getPresentationsString(meetingID), presentationID, function(err, reply) {
    if(reply) {
      console.log("REDIS: Added presentationID " + presentationID + " to set of presentations.");
      if(setCurrent) {
        redisAction.setCurrentPresentation(meetingID, presentationID, function() {
          callback(presentationID);
        });
      }
      else callback(presentationID);
    }
    else if(err) {
      console.log("REDIS ERROR: Couldn't add presentationID " + presentationID + "to set of presentations");
      callback(null);
    }
  });
};

exports.setCurrentPage = function(meetingID, presentationID, pageID, callback) {
  store.set(redisAction.getCurrentPageString(meetingID, presentationID), pageID, function(err, reply) {
      if(reply) console.log("REDIS: Set current pageID to " + pageID);
      if(err) console.log("REDIS ERROR: Couldn't set current pageID to " + pageID);
      if(callback) callback();
    });
};

exports.createPage = function(meetingID, presentationID, imageName, setCurrent, callback) {
  var pageID = rack(); //create a new unique pageID
  var afterPush = function(err, reply) {
    if(reply) {
      console.log("REDIS: Created page with ID " + pageID);
      redisAction.setPageImage(meetingID, presentationID, pageID, imageName, function() {
        callback(pageID);
      });
    }
    else if(err) {
      console.log("REDIS ERROR: Couldn't create page with ID " + pageID);
      callback(null);
    }
  };
  
  console.log("Making page with id " + pageID);
  if(setCurrent) {
    store.lpush(redisAction.getPagesString(meetingID, presentationID), pageID, afterPush);
  }
  else {
    store.rpush(redisAction.getPagesString(meetingID, presentationID), pageID, afterPush);
  }
};

/*


exports.getCurrentPageNumber = function(meetingID, presentationID, callback) {
  store.get(redisAction.getCurrentPageNumberString(meetingID, presentationID), function(err, pageNumber) {
    if(err) console.log(err);
    callback(pageNumber);
  });
};

exports.setCurrentPageNumber = function(meetingID, presentationID, pageNumber, callback) {
  redisAction.getPageIDs(meetingID, presentationID, function(pageIDs) {
    var length = pageIDs.length;
    if(!pageNumber || (pageNumber >= length) || (pageNumber < 0)){
      callback(null);
    }
    else {
      store.set(redisAction.getCurrentPageNumberString(meetingID, presentationID), pageNumber, function(err, reply) {
        console.log("Set current page number to " + pageNumber);
        callback(pageNumber);
      });
    }
  });
};

exports.getCurrentPageNumber = function(meetingID, presentationID, callback) {
  store.get(redisAction.getCurrentPageNumString(meetingID, presentationID), function (err, reply) {
    if(!err && reply) callback(reply);
    else {
      console.log("REDIS ERROR: Couldn't get current page number");
      callback(null);
    }
  });
};

exports.getLowestHops = function(from, to, length) {
  var f_hops = to - from; // from 0 to 1, it's 1 - 0 = 1 forward hop.
  if(f_hops == 0) {
    return 0;
  }
  var possible_hops1 = Math.abs(f_hops) - length; // 0 to 60 with max 100 is 60f - 100 = -40
  var possible_hops2 = f_hops;
  if(Math.abs(possible_hops1) < Math.abs(possible_hops2)) {
    return possible_hops1;
  }
  else return possible_hops2;
};

exports.setCurrentPageNumber = function(meetingID, presentationID, pageNumber, callback) {
  redisAction.getCurrentPageNumber(meetingID, presentationID, function(currentNum) {
    if(currentNum) {
     redisAction.getPageIDs(meetingID, presentationID, function(pageIDs) {
       var length = pageIDs.length;
       if((pageNumber >= length) ||(pageNumber < 0)) {
         callback(null);
         return;
       }
       var hops = redisAction.getLowestHops(parseInt(currentNum, 10), pageNumber, length);
       if(hops == 0) {
         console.log("You are on that page");
       }
       else {
         if(hops < 0) {
           var index = -1;
         }
         else var index = 0;
         store.lrange(redisAction.getPagesString(meetingID, presentationID), index, hops, function(err, reply) {
           if(reply) {
              console.log("replied with: " +  reply);
              if(hops < 0) reply.reverse();
              reply.unshift(redisAction.getPagesString(meetingID, presentationID));
              reply.push(function() {
                console.log("Rearranged pages");
                store.ltrim(redisAction.getPagesString(meetingID, presentationID), index, hops, function(err, reply) {
                  if(reply) console.log("Deleted old values");
                  store.set(redisAction.getCurrentPageNumString(meetingID, presentationID), pageNumber, function(err, reply) {
                    if(reply) console.log("Successfully set page number to " + pageNumber);
                    callback(true);
                  });
                });
              });
              if(hops < 0) store.lpush.apply(store, reply);
              else if(hops > 0) store.rpush.apply(store, reply);
            }
          });
        }
     });
    }
    else {
      store.set(redisAction.getCurrentPageNumString(meetingID, presentationID), pageNumber, function(err, reply) {
        if(reply) console.log("Successfully set page number to " + pageNumber);
        callback(true);
      });
    }
  });
};

*/

exports.setPageImage = function(meetingID, presentationID, pageID, imageName, callback) {
  store.set(redisAction.getPageImageString(meetingID, presentationID, pageID), imageName, function (err, reply) {
    if(reply) console.log("REDIS: Set page " + pageID +" image to " + imageName);
    else if(err) console.log("REDIS ERROR: Couldn't set page " + pageID +" image to " + imageName);
    if(callback) callback();
  });
};

exports.setCurrentPresentation = function(meetingID, presentationID, callback) {
  store.set(redisAction.getCurrentPresentationString(meetingID), presentationID, function(err, reply) {
    if(reply) console.log("REDIS: Set current presentationID to " + presentationID);
    else if(err) console.log("REDIS ERROR: Couldn't set current presentationID"); //impossible because set never fails
    if(callback) callback();
  });
};

exports.setViewBox = function(meetingID, presentationID, viewbox, callback) {
  store.set(redisAction.getCurrentViewBoxString(meetingID, presentationID), viewbox, function(err, reply){
    if(reply) {
      if(callback) callback(true);
    }
    else if(err) {
      console.log(err);
      if(callback) callback(false);
    }
  });
};

exports.getViewBox = function(meetingID, presentationID, callback) {
  store.get(redisAction.getCurrentViewBoxString(meetingID, presentationID), function(err, reply) {
    if(reply) callback(reply);
    else if(err) {
      console.log(err);
      callback(null);
    }
  });
};

exports.createMeeting = function(meetingID, callback) {
  store.sadd(redisAction.getMeetingsString(), meetingID); //create the meeting if not already created.
  if(callback) callback();
};

exports.createUser = function(meetingID, userID, callback) {
  store.sadd(redisAction.getUsersString(meetingID), userID); //meeting-123-users.push(sessionID)
  if(callback) callback();
};

exports.updateUserProperties = function(meetingID, userID, properties, callback) {
  properties.unshift(redisAction.getUserString(meetingID, userID));
  properties.push(function(err, reply) {
    if(reply) {
      if(callback) callback(true);
    }
    else if(err) {
      console.log(err);
      if(callback) callback(false);
    }
  });
  store.hmset.apply(store, properties);
};
