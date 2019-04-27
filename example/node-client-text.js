//"houndify" module contains both client-side ("HoundifyClient") and server-side ("HoundifyExpress") parts of SDK
var Houndify = require('houndify');
var path = require('path');

//parse arguments
var argv = require('minimist')(process.argv.slice(2));

//config file
var configFile = argv.config || './config.json';
var config = require(path.join(__dirname, configFile));

//Initialize TextRequest
var textRequest = new Houndify.TextRequest({
  query: argv.query || 'What is the weather like?',

  clientId: 'ZZcQgdZ81mNp1DXV9BJoqA==',
  clientKey:
    'vqAxy0k4xAZKnxhnYQHyY_BU_EQQrTduYzKjOKl5nUCDgKKGtzkRTur9TLrTPSXiGQTOAj1EcuWvCyuHOKirVQ==',

  //REQUEST INFO JSON
  //see https://houndify.com/reference/RequestInfo
  requestInfo: {
    UserID: 'test_user',
    Latitude: 37.388309,
    Longitude: -121.973968
  },

  onResponse: function(response, info) {
    console.log('in response', response);
  },

  onError: function(err, info) {
    console.log(err);
  }
});
