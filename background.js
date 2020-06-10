//run background script every minute to check for new RSS content from websites, and
//initialize the dictionary of values in storage once + website url to display for RSS feed

var dict = {};
var newCount = 0;
var counter = 0;
var newNotifsarray = [];

chrome.storage.local.clear(function() {
  chrome.extension.getBackgroundPage().console.log('Storage cleared');
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.extension.getBackgroundPage().console.log('Extension installed');
  chrome.alarms.create("1minute", {
    periodInMinutes: 1
  });
});


chrome.storage.local.set({
  'websiteURLs': dict
}, function() {
  chrome.extension.getBackgroundPage().console.log("{ 'websiteURLs' : {} } initialized into storage");
});

chrome.storage.local.set({'webToDisplay': ""}, function() {
  chrome.extension.getBackgroundPage().console.log("webToDisplay initialized into storage");
});

// chrome.storage.local.set({'newNotifs': newNotifsarray}, function() {
//   chrome.extension.getBackgroundPage().console.log("{ 'newNotifs' : [] } initialized into storage");
// });

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}


function setNotifBadge(x) {
  if (x != 0) {
    chrome.browserAction.setBadgeText({
      text: 'NEW'
    });
    chrome.extension.getBackgroundPage().console.log("Badge text changed");

  }
  chrome.extension.getBackgroundPage().console.log("New count:");
  chrome.extension.getBackgroundPage().console.log(x);
}

function compareRSS(RSS_URL, old_RSS) {

  chrome.extension.getBackgroundPage().console.log("Fetching from background.js");
  var urlText = String(RSS_URL);
  var newRSSarray = [];


  //var newNotifsarray = [];
  fetch(urlText)
    .then(response => {
      if (response.ok) {
        // console.log(response);
        chrome.extension.getBackgroundPage().console.log("Text response");
        var response2 = response.clone();
        chrome.extension.getBackgroundPage().console.log(response2.text());
        return response.text();
      } else {
        throw Error(response.statusText);
      }
    })
    .then(str => {
      var domParser = new DOMParser();
      var parsedtext = domParser.parseFromString(str, "text/xml");
      return parsedtext;
    })
    .then(RSS_Str => {
      chrome.extension.getBackgroundPage().console.log("RSS Feed received to background");
      var items = RSS_Str.querySelectorAll("item");
      if (items.length == 0) { //if there are no items found, search by "entry" instead
        items = RSS_Str.querySelectorAll("entry");
      }
      if(items.length >= 1){
        var latest = items[0].querySelector("title").textContent;
        console.log("Latest feed title,", latest);
        console.log("First post in storage,", old_RSS[0]);
        //compare the titles of most recent RSS posts
        if (latest != old_RSS[0]) {
          newNotifsarray.push(String(RSS_URL));
          console.log("Pushing into newNotifsarray");
          console.log(newNotifsarray);
          newCount = newCount + 1;
          //push latest posts into newRSSarray
          items.forEach(function(userItem) {
            var title = userItem.querySelector('title').textContent;
            // chrome.extension.getBackgroundPage().console.log(title);
            newRSSarray.push(title);
          });
        } else {
          console.log("New posts same as old posts for ", RSS_URL);
          console.log("New count:", newCount);
        }
      }else{
        console.log("items.length is not greater than or equal to 1");
      }
      return newRSSarray;
    })
    .then(latestRSS => {
      if (latestRSS.length <= 0){ //if the newRSSarray is empty
        console.log("newRSSarray is empty");
        counter++;
        // if (counter == Object.keys(result.websiteURLs).length){
        //   setNotifBadge(newCount);
        //   newCount = 0;
        //   chrome.extension.getBackgroundPage().console.log("compareRSS completed in background.js");
        //   counter = 0; //reset counter
        // }
      }else{
        chrome.storage.local.get("websiteURLs", function(result) {
          console.log("Old stored array:");
          for (var key in result.websiteURLs) {
            chrome.extension.getBackgroundPage().console.log(key);
            chrome.extension.getBackgroundPage().console.log(result.websiteURLs[key]);
          }
          result.websiteURLs[RSS_URL] = latestRSS;
          chrome.storage.local.remove("websiteURLs", function() {
            chrome.storage.local.set(result, function() { //chrome.storage.local.set({"websiteURLs": result.websiteURLs}
              if (chrome.extension.lastError) {
                  chrome.extension.getBackgroundPage().console.log('An error occurred: ' + chrome.extension.lastError.message);
              } else {
                chrome.extension.getBackgroundPage().console.log("Website links saved");
                console.log("New stored array:");
                for (var key in result.websiteURLs) {
                  chrome.extension.getBackgroundPage().console.log(key);
                  chrome.extension.getBackgroundPage().console.log(result.websiteURLs[key]);
                }
              }
              counter++;
              //run this at the end
              if (counter == Object.keys(result.websiteURLs).length){
                  setNotifBadge(newCount);
                  newCount = 0;
                  chrome.extension.getBackgroundPage().console.log("compareRSS completed in background.js");
                  counter = 0; //reset counter

                  // console.log("old newNotifs array:");
                  // console.log(result.newNotifs);
                  // for (var i in result.newNotifs) {
                  //   chrome.extension.getBackgroundPage().console.log(i);
                  // }

              }
            });
          });
        });
      }
    })


    .catch(function(error){
      console.log('Error: ', error);
    });

}

function checkForNews(){
  newNotifsarray.length = 0; //empty out the array every minute
  console.log("New notifs array: ", newNotifsarray);
  chrome.storage.local.get("websiteURLs", function(result) {
    //var websiteDict = result.websiteURLs;
    if (isEmpty(result.websiteURLs)) { //website dict is empty
      chrome.extension.getBackgroundPage().console.log("result.websiteURLs (from storage) is empty");
    } else { // website dict is NOT empty
      // for (var key in result.websiteURLs) {
      //   compareRSS(key, result.websiteURLs[key]);
      // }


      Object.keys(result.websiteURLs).forEach(function(key) { //for making sure async processes are completed?
        compareRSS(key, result.websiteURLs[key]);

      });


    }
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  chrome.extension.getBackgroundPage().console.log(alarm.name);
  if (alarm.name === "1minute") {
    checkForNews();

  }
});
