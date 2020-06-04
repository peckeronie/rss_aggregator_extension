//show RSS notifications in a new popup, or save the user's urls, based on what button is clicked
var websiteToDisplay = "";
// document.getElementById('notifbutton').addEventListener('click', showNews);
// document.getElementById("setbutton").addEventListener("click", checkUserInput);

//add on-click event listener to each website button
function PopupNews(website){
  website.addEventListener('click', function() {
    chrome.extension.getBackgroundPage().console.log("Website button clicked");
    chrome.browserAction.setPopup({popup: 'popup_notifs_list.html'}, function(){
      websiteToDisplay = String(website.innerHTML);
      chrome.extension.getBackgroundPage().console.log("Website clicked,", websiteToDisplay);
      chrome.storage.local.remove("webToDisplay", function() {
        chrome.storage.local.set({'webToDisplay': websiteToDisplay}, function() {
          chrome.extension.getBackgroundPage().console.log(websiteToDisplay, " set into storage");
        });
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
    //var button1 = document.getElementById('notifbutton');
    var button2 = document.getElementById('setbutton');
    var button3 = document.getElementById('deletebutton');
    var allWebsiteButtons = document.getElementsByClassName("urlBtn");
    // button1.addEventListener('click', function() {
    //     showNews();
    // });
    button2.addEventListener('click', function() {
        checkUserInput();
    });
    button3.addEventListener('click', function() {
        removeURL();
    });
    for (var i = 0; i < allWebsiteButtons.length; i++) {
      PopupNews(allWebsiteButtons[i]);
    }
});



function removeURL(){
  var URLtoRemove = String(document.getElementById("userinput1").value);
  chrome.storage.local.get("websiteURLs", function(result) {
    chrome.extension.getBackgroundPage().console.log("Old keys in storage:");
    for (var key in result.websiteURLs) {
      chrome.extension.getBackgroundPage().console.log(key);
    }
    delete result.websiteURLs[URLtoRemove];
    chrome.storage.local.remove("websiteURLs", function() {
      chrome.storage.local.set(result, function() {
        if (chrome.extension.lastError) {
            chrome.extension.getBackgroundPage().console.log('An error occurred: ' + chrome.extension.lastError.message);
        } else {
          chrome.extension.getBackgroundPage().console.log("Website links saved");
          chrome.extension.getBackgroundPage().console.log("New keys in storage after removal:");
          for (var key in result.websiteURLs) {
            chrome.extension.getBackgroundPage().console.log(key);
          }
          document.getElementById(URLtoRemove).remove();
        }

      });
    });
  });
}

// function showNews(){
//   chrome.extension.getBackgroundPage().console.log("Switch to notifs button pressed");
//   chrome.browserAction.setPopup({popup: 'popup_notifs_list.html'});
//
// }

function generateWebsiteButton(websiteURL){
  var para = document.createElement("P");
  var newButton = document.createElement('button');
  newButton.innerHTML = websiteURL;
  newButton.id = String(websiteURL);
  newButton.className = "urlBtn";
  para.appendChild(newButton);
  document.body.appendChild(newButton);
  var allWebsiteButtons = document.getElementsByClassName("urlBtn");
  for (var i = 0; i < allWebsiteButtons.length; i++) {
    PopupNews(allWebsiteButtons[i]);
  }
}

function generateWebsiteButtons(){
  chrome.extension.getBackgroundPage().console.log("Generating buttons on popup");
  chrome.storage.local.get("websiteURLs", function(result) {
    // console.log("Old keys in storage:");
    for (var key in result.websiteURLs) {
      generateWebsiteButton(key);
    }
    var allWebsiteButtons = document.getElementsByClassName("urlBtn");
    for (var i = 0; i < allWebsiteButtons.length; i++) {
      PopupNews(allWebsiteButtons[i]);
    }
  });
}

//make an array of [title1, title2...] for the new RSS posts from a website
function getRSS(RSS_URL,stored) {
  var newRSSarray = [];
  //var domParser = new DOMParser();
  chrome.extension.getBackgroundPage().console.log("Fetching from popup.js");
  var urlText = String(RSS_URL);
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
      chrome.extension.getBackgroundPage().console.log("RSS Feed received");
      var items = RSS_Str.querySelectorAll("item");
      if (items.length == 0) { //if there are no items found, search by "entry" instead
        items = RSS_Str.querySelectorAll("entry");
      }
      items.forEach(function(userItem) {
        var title = userItem.querySelector('title').textContent;
        // chrome.extension.getBackgroundPage().console.log(title);
        newRSSarray.push(title);

      });
      return newRSSarray;
    })
    .then(latestRSS => {
      chrome.extension.getBackgroundPage().console.log("Printing array");
      chrome.extension.getBackgroundPage().console.log(latestRSS);
      stored.websiteURLs[RSS_URL] = latestRSS; //modify the object in storage
      chrome.extension.getBackgroundPage().console.log("Printing website keys");
      for (var key in stored.websiteURLs) {
        chrome.extension.getBackgroundPage().console.log(key);
      }
      return stored;
    })
    .then(resultcopy => {
      chrome.storage.local.remove("websiteURLs", function() {
        chrome.storage.local.set(resultcopy, function() { //chrome.storage.local.set({"websiteURLs": result.websiteURLs}
          if (chrome.extension.lastError) {
              chrome.extension.getBackgroundPage().console.log('An error occurred: ' + chrome.extension.lastError.message);
          } else {
            chrome.extension.getBackgroundPage().console.log("Website links saved");

          }
        });
      });

    }).catch(function(error){
      console.log('Request failed', error);
    });

}



//when the user enters a url and clicks the button, save the urls into a dict in storage
function checkUserInput() {
  chrome.extension.getBackgroundPage().console.log("Set button clicked");
  var newURL = String(document.getElementById("userinput1").value);
  if (newURL == '') {
    chrome.extension.getBackgroundPage().console.log("No URL entered");
  } else {
    chrome.extension.getBackgroundPage().console.log("URL entered:");
    chrome.extension.getBackgroundPage().console.log(newURL);
    generateWebsiteButton(newURL);

    // var latestRSS = getRSS(newURL); //get an array of latest RSS results for that website
    chrome.storage.local.get("websiteURLs", function(result) {
      getRSS(newURL,result);
      //var latestRSS = getRSS(newURL);



    });
  }
}

generateWebsiteButtons();




//clear the news badge when you open up the popup
chrome.browserAction.setBadgeText({
  text: ''
});
