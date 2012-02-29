/*!
 * twitter-client
 * Copyright(c) 2012 Ben Verhees <ben.verhees@gmail.com>
 * MIT Licensed
 */

var exports = module.exports,
  fs = require('fs'),
  qs = require('querystring'),
  request = require('request'),
  emptyCallback = function() { };

var consumer_key = 'CDzRh9F1gP0Uh6VXdzDFTg',
  consumer_secret = 'fFZqAimtdBJl06hb4CeQ8dn4JzQYxAKO3ff7pAtso0';

module.exports = function(config) {
  var oauth_token;

  function configure(config) {
  }

  function obtainRequestToken(params, callback) {
    var oauth = { callback: 'http://socialboard.dyndns.org:1337/twittercallback',
      consumer_key: consumer_key,
      consumer_secret: consumer_secret
    },
    url = 'https://api.twitter.com/oauth/request_token';
    request.post({url:url, oauth:oauth}, function (e, r, body) {
      var access_token = qs.parse(body);
      oauth_token = 
        { consumer_key: consumer_key,
          consumer_secret: consumer_secret,
          token: access_token.oauth_token,
          token_secret: access_token.oauth_token_secret
        }
      callback(null, access_token.oauth_token);
    })
  }

  function obtainAccessToken(oauth_verifier, callback) {
    var url = 'https://api.twitter.com/oauth/access_token';
    oauth_token.verifier = oauth_verifier;
    request.post({url:url, oauth:oauth_token}, function (e, r, body) {
      var perm_token = qs.parse(body);
      oauth_token = {
        consumer_key: consumer_key,
        consumer_secret: consumer_secret,
        token: perm_token.oauth_token,
        token_secret: perm_token.oauth_token_secret
      }
      callback();
    });
  }

  function getAuthenticateUrl(oauth_token) {
    return 'https://api.twitter.com/oauth/authenticate' + '?oauth_token=' + oauth_token;
  }
  
  var immediate_reconnect_timout = 0;

  var linear_backoff_start = 250;
  var linear_backoff_cap = 16000;
  var linear_backoff_timeout = 0;

  var exponential_backoff_start = 10000;
  var exponential_backoff_cap = 240000;
  var exponential_backoff_timeout = 0;

  function statuses(callback) {
    var req = request.post({
//        url:'https://stream.twitter.com/1/statuses/filter.json?track=RT',
        url:'https://stream.twitter.com/1/statuses/sample.json',
//        url:'http://localhost:8080',
        oauth: oauth_token
      }, function(error, res, body) {
        res.setEncoding(encoding='utf8');
        if (res && res.statusCode > 200) {

          linear_backoff_timeout = 0;

          if (exponential_backoff_timeout == 0) {
            exponential_backoff_timeout += exponential_backoff_start;
          }else if ((exponential_backoff_timeout *= 2) > exponential_backoff_cap) {
            exponential_backoff_timeout = exponential_backoff_cap;
          }
          console.log(res.statusCode + ' reconnecting in ' + exponential_backoff_timeout + ' milliseconds...');
          setTimeout(function(){ statuses(callback) }, exponential_backoff_timeout);
        }else if (res && res.statusCode <= 200) {

          linear_backoff_timeout = 0;
          exponential_backoff_timeout = 0;

          console.log(res.statusCode + ' reconnect...')
          setTimeout(function(){ statuses(callback) }, immediate_reconnect_timout);
        }
      });

      req.on('data', function(buffer){

        linear_backoff_timeout = 0;
        exponential_backoff_timeout = 0;

        callback('tweet', JSON.parse(buffer));

/*
        try {
          var json = JSON.parse(buffer.toString());
          var keys = Object.keys(json);
          if(keys.length == 1){
            callback(keys[0], json[keys[0]]);
          }else{
            callback('tweet', json);
          }
          json = null;
          keys = null;
        }
        catch(error) {
          callback('error', error);
        }
*/
      });

      req.on('error', function(error){

        exponential_backoff_timeout = 0;

        if ((linear_backoff_timeout += linear_backoff_start) > linear_backoff_cap) linear_backoff_timeout = linear_backoff_cap;
        console.log(error + ' retrying in ' + linear_backoff_timeout + ' milliseconds...')
        setTimeout(function(){ statuses(callback) }, linear_backoff_timeout);
      });

      req.on('close', function(error){
        if(error) {
          callback('error', error);
        }
      });
  }

  return {
    'statuses' : statuses,
    'obtainRequestToken' : obtainRequestToken,
    'getAuthenticateUrl' : getAuthenticateUrl,
    'obtainAccessToken' : obtainAccessToken
  }
};