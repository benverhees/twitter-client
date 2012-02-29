twitter-client
==============
This is a work in progress and will evolve into a Twitter API client library for node. It reconnects automatically when it's disconnected, and backs off from failures by configurable steps, honoring the reconnection rules set by Twitter.

See: https://dev.twitter.com/docs/streaming-api/concepts#connecting

_Currently adheres to the following rules_

* When a network error (TCP/IP level) is encountered, back off linearly. Perhaps start at 250 milliseconds and cap at 16 seconds.
* When a HTTP error (> 200) is returned, back off exponentially. Perhaps start with a 10 second wait, double on each subsequent failure, and finally cap the wait at 240 seconds.

Example
-------
```js
 var twitter = require('twitter-client')(null);
 var express = require('express');
 
 var app = express.createServer();
 
 //Register a url that will redirect to Twitter to request user authorization.
 app.get('/twitterlogin', function(req, res) {
   twitter.obtainRequestToken(null, function(error, oauth_token) {
     res.writeHead(302, { 'location': twitter.getAuthenticateUrl(oauth_token) });
     res.end();
   });
 });
 
 //Register a url that will respond to the callback coming from Twitter
 //after the user has completed the appropriate authorization flow
 app.get('/twittercallback', function (req, res) {
   twitter.obtainAccessToken(req.param('oauth_verifier'), function(error, access_token) {
     twitter.statuses(function(event, data){
       switch(event){
         case 'tweet':
           console.log(data.text);
           break;
         default:
           console.log(event + ':');
           console.log(data);
       }
     });
     res.end('done.');
   });
 });
 
 app.listen(1337);
```
