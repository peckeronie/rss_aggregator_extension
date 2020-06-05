//format the RSS feed posts in this js file

//var popupFile = chrome.extension.getViews({ type: 'popup' });
//var userWebsite = popupFile.websiteToDisplay;
// document.getElementById('switchbackbutton').addEventListener('click', switchPopUp);

document.addEventListener('DOMContentLoaded', function() {
    var button3 = document.getElementById('switchbackbutton');
    button3.addEventListener('click', function() {
        switchPopUp();
    });
});

function switchPopUp() { //switch back to the entering url screen
  chrome.extension.getBackgroundPage().console.log("Switch button pushed");
  chrome.browserAction.setPopup({
    popup: 'popup.html'
  });
}

// Create a "close" button and append it to each list item
var myNodelist = document.getElementsByTagName("LI");
var i;
for (i = 0; i < myNodelist.length; i++) {
  var span = document.createElement("SPAN");
  var txt = document.createTextNode("\u00D7");
  span.className = "close";
  span.appendChild(txt);
  myNodelist[i].appendChild(span);
}

// Click on a close button to hide the current list item
var close = document.getElementsByClassName("close");
var i;
for (i = 0; i < close.length; i++) {
  close[i].onclick = function() {
    var div = this.parentElement;
    div.style.display = "none";
  };
}

//For a specific website, create new items from RSS feed to add to the html list
function renderRSS(RSS_URL) {
  //var domParser = new DOMParser();
  // console.log("Fetching from popup_notifs_list.js");
  chrome.extension.getBackgroundPage().console.log("Rendering RSS feed for popup_notifs_list");
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
      var parsedtext = domParser.parseFromString(str, "application/xhtml+xml");
      return parsedtext;
    })
    .then(RSS_Str => {
      console.log("RSS Feed received to popup_notifs_list");
      var items = RSS_Str.querySelectorAll("item");
      if (items.length == 0) { //if there are no items found, search by "entry" instead
        items = RSS_Str.querySelectorAll("entry");
      }
      items.forEach((item) => {
        var listItem = document.createElement('li');
        //var inputValue = item.querySelector('title').textContent;
        //var t = document.createTextNode(inputValue);
        //listItem.appendChild(t);
        listItem.textContent = item.querySelector('title').textContent;

        var pagelink = document.createElement('a'); //make a hyperlink button
        var itemurl = item.querySelector('link');
        var pattern = /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
        if (itemurl !== null) {
          chrome.extension.getBackgroundPage().console.log("Item url selector: ", itemurl);
          if (pattern.test(String(itemurl))){
            chrome.extension.getBackgroundPage().console.log("Url is valid");
          }else{
              //querying for href that starts and ends with quotations
              itemurl = item.querySelector('link').getAttribute("href");
              chrome.extension.getBackgroundPage().console.log("Item url href: ", itemurl);
              chrome.extension.getBackgroundPage().console.log("Item url href selector: ", itemurl);
              if (itemurl == null || itemurl == ''){
                chrome.extension.getBackgroundPage().console.log("Url href does not exist");
              }

          }
        }
      //   else{
      //     chrome.extension.getBackgroundPage().console.log("Url is invalid");
      //     itemurl = item.querySelector('link[href^="]');
      //     chrome.extension.getBackgroundPage().console.log("Item url: ", itemurl);
      //     //if <link></link> doesn't exist, search for <link href=.../>
      //
      //     var linkRegex = /(?<=<link ).*(?=\/>)/;
      //     var hrefRegex = /(?<=href=").*(?=")/;
      //     var matched = item.exec(linkRegex);
      //     chrome.extension.getBackgroundPage().console.log("Link regex: ", matched);
      //     if(matched === null){
      //       chrome.extension.getBackgroundPage().console.log("Link regex is null");
      //     }else{
      //       chrome.extension.getBackgroundPage().console.log(matched[0].exec(hrefRegex));
      //
      //       // if (pattern.test(itemurl)){
      //       //   chrome.extension.getBackgroundPage().console.log("Searching by link href");
      //       //   chrome.extension.getBackgroundPage().console.log("Item url: ", itemurl);
      //       // }else{
      //       //   chrome.extension.getBackgroundPage().console.log("Cannot parse link href");
      //       // }
      //     }
      // }
        //pagelink.href = item.querySelector('link').textContent;
        pagelink.href = itemurl;
        pagelink.className = "button";
        pagelink.textContent = "Link"; //text on button
        pagelink.target = "_blank"; //open link in new window
        listItem.appendChild(pagelink);
        //pagelink.appendChild(listItem);

        //document.getElementById('newsList').appendChild(pagelink);
        document.getElementById('newsList').appendChild(listItem);

        var span = document.createElement("SPAN"); //add the x button to the link
        var txt = document.createTextNode("\u00D7");
        span.className = "close";
        span.appendChild(txt);
        listItem.appendChild(span);
        for (var i = 0; i < close.length; i++) {
          close[i].onclick = function() {
            var div = this.parentElement;
            div.style.display = "none";
          };
        }
      });
    }).catch(function(error){
      console.log('Request failed', error);
    });
}

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

//render RSS feed for all of the user's websites in storage
// chrome.storage.local.get("websiteURLs", function (result){
//   var websiteDict = result.websiteURLs;
//   if (isEmpty(websiteDict)) { //website dict is empty
//     chrome.extension.getBackgroundPage().console.log("result.websiteURLs (from storage) is empty");
//   } else {
//     // for (var webKey in websiteDict) {
//     //   renderRSS(webKey);
//     // }
//     Object.keys(websiteDict).forEach(function(key) { //for making sure async processes are completed?
//       renderRSS(key);
//     });
//   }
// });

chrome.storage.local.get("webToDisplay", function(result) {
  var userWebsite = String(result.webToDisplay);
  renderRSS(userWebsite);
});

// var list = document.querySelector('ul');
// list.addEventListener('click', function(ev) {
//   if (ev.target.tagName === 'LI') { //make the links clickable
//
//   }
// }, false);


//clear the news badge when you open up the popup
chrome.browserAction.setBadgeText({
  text: ''
});
