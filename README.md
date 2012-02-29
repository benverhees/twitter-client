twitter-client
==============

This is a Twitter client for node. It reconnects automatically when it's disconnected, and backs off from failures: none for first disconnect, seconds for repeated network (TCP/IP) level issues, minutes for non-200 HTTP codes.

Example
-------

`
var twitter = require('twitter-client')(null);
var express = require('express');

var app = express.createServer();

app.get('/twitterlogin', function(req, res) {
  twitter.obtainRequestToken(null, function(error, oauth_token) {
    res.writeHead(302, { 'location': twitter.getAuthenticateUrl(oauth_token) });
    res.end();
  });
});

app.get('/twittercallback', function (req, res) {
  twitter.obtainAccessToken(req.param('oauth_verifier'), function(error, access_token) {
    twitter.statuses(function(event, data){
      switch(event){
        case 'tweet':
          console.log(data.text);
          break;
        case 'delete':
          console.log(event + ':');
          console.log(data);
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
`
