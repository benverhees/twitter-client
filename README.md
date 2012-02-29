twitter-client
==============

This is a work in progress and will evolve into a Twitter API client library for node. It reconnects automatically when it's disconnected, and backs off from failures: none for first disconnect, seconds for repeated network (TCP/IP) level issues, minutes for non-200 HTTP codes.

Example
-------

```js
 var twitter = require('twitter-client')(null);
 var express = require('express');
 
 var app = express.createServer();
 
 //Register a url that will redirect to the Twitter and request user authorization.
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