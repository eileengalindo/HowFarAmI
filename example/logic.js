const Houndify = require('./public/js/houndify');

//HTML ELEMENTS FOR DISPLAYING RESPONSE AND INFO JSON's
var responseElt = document.getElementById('responseJSON');
var infoElt = document.getElementById('infoJSON');
var statusElt = document.getElementById('status');
var transcriptElt = document.getElementById('query');

var clientID = 'ZZcQgdZ81mNp1DXV9BJoqA==';
var conversationState = null;
var voiceRequest = null;

const fullStackLatitude = 40.7049444;
const fullStackLongitude = -74.0091771;

const origin1 = new google.maps.LatLng(fullStackLatitude, fullStackLongitude);

var xhr = new XMLHttpRequest();

var recorder = new Houndify.AudioRecorder();
recorder.on('start', function() {
  //Initialize VoiceRequest
  voiceRequest = initVoiceRequest(recorder.sampleRate);
  document.getElementById('voiceIcon').className =
    'selected radio icon big red';
});

recorder.on('data', function(data) {
  voiceRequest.write(data);
});

recorder.on('end', function() {
  voiceRequest.end();
  statusElt.innerText = 'Stopped recording. Waiting for response...';
  document.getElementById('voiceIcon').className = 'unmute big icon';
  document.getElementById('textSearchButton').disabled = false;
  document.getElementById('query').readOnly = false;
});

recorder.on('error', function(error) {
  voiceRequest.abort();
  statusElt.innerText = 'Error: ' + error;
  document.getElementById('voiceIcon').className = 'unmute big icon';
  document.getElementById('textSearchButton').disabled = false;
  document.getElementById('query').readOnly = false;
});

function initTextRequest() {
  responseElt.parentNode.hidden = true;
  infoElt.parentNode.hidden = true;

  var queryString = document.getElementById('query').value;
  statusElt.innerText = 'Sending text request...';

  //Initialize TextRequest
  var textRequest = new Houndify.TextRequest({
    //Text query
    query: queryString,

    //Your Houndify Client ID
    clientId: clientID,

    //For testing environment you might want to authenticate on frontend without Node.js server.
    //In that case you may pass in your Houndify Client Key instead of "authURL".
    //clientKey: "YOUR_CLIENT_KEY",

    //Otherwise you need to create an endpoint on your server
    //for handling the authentication.
    //See SDK's server-side method HoundifyExpress.createAuthenticationHandler().
    authURL: '/houndifyAuth',

    //REQUEST INFO JSON
    //See https://houndify.com/reference/RequestInfo
    requestInfo: {
      UserID: 'test_user',
      Latitude: 40.7049444,
      Longitude: -74.0091771,
      ResponseAudioVoice: Sarah,
      ResponseAudioShortOrLong: Short
    },

    //Pass the current ConversationState stored from previous queries
    //See https://www.houndify.com/docs#conversation-state
    conversationState: conversationState,

    //You need to create an endpoint on your server
    //for handling the authentication and proxy``ing
    //text search http requests to Houndify backend
    //See SDK's server-side method HoundifyExpress.createTextProxyHandler().
    proxy: {
      method: 'POST',
      url: '/textSearchProxy'
      // headers: {}
      // ... More proxy options will be added as needed
    },

    //Response and error handlers
    onResponse: onResponse,
    onError: onError
  });
}

function initVoiceRequest(sampleRate) {
  responseElt.parentNode.hidden = true;
  infoElt.parentNode.hidden = true;

  const voiceRequest = new Houndify.VoiceRequest({
    //Your Houndify Client ID
    clientId: clientID,

    //For testing environment you might want to authenticate on frontend without Node.js server.
    //In that case you may pass in your Houndify Client Key instead of "authURL".
    //clientKey: "YOUR_CLIENT_KEY",

    //Otherwise you need to create an endpoint on your server
    //for handling the authentication.
    //See SDK's server-side method HoundifyExpress.createAuthenticationHandler().
    authURL: '/houndifyAuth',

    //REQUEST INFO JSON
    //See https://houndify.com/reference/RequestInfo
    requestInfo: {
      UserID: 'test_user',
      Latitude: fullStackLatitude,
      Longitude: fullStackLatitude
    },

    //Pass the current ConversationState stored from previous queries
    //See https://www.houndify.com/docs#conversation-state
    conversationState: conversationState,

    //Sample rate of input audio
    sampleRate: sampleRate,

    //Enable Voice Activity Detection
    //Default: true
    enableVAD: true,

    //Partial transcript, response and error handlers
    onTranscriptionUpdate: onTranscriptionUpdate,
    onResponse: function(response, info) {
      recorder.stop();
      onResponse(response, info);
    },
    onError: function(err, info) {
      recorder.stop();
      onError(err, info);
    }
  });

  return voiceRequest;
}

function onMicrophoneClick() {
  if (recorder && recorder.isRecording()) {
    recorder.stop();
    return;
  }

  recorder.start();

  statusElt.innerText = 'Streaming voice request...';
  document.getElementById('voiceIcon').className =
    'loading circle notched icon big';
  document.getElementById('textSearchButton').disabled = true;
  document.getElementById('query').readOnly = true;
}

function onFileUpload() {
  var reader = new FileReader();
  reader.onload = function() {
    //In browsers only you can also upload and decode
    //audio file using decodeArrayBuffer() method
    //Stream 8/16 kHz mono 16-bit little-endian PCM samples
    //in Int16Array() chunks to backend
    var arrayBuffer = reader.result;
    Houndify.decodeAudioData(arrayBuffer, function(err, result) {
      if (err) {
        console.error(err.message);
      }
      statusElt.innerText = 'Streaming audio from file...';
      voiceRequest = initVoiceRequest(result.sampleRate);
      voiceRequest.write(result.audioData);
      voiceRequest.end();
    });

    statusElt.innerText = 'Decoding audio from file...';
  };

  var file = document.getElementById('file').files[0];
  reader.readAsArrayBuffer(file);
}

//Fires after server responds with Response JSON
//Info object contains useful information about the completed request
//See https://houndify.com/reference/HoundServer
async function onResponse(response, info) {
  const service = new google.maps.DistanceMatrixService();
  if (response.AllResults && response.AllResults.length) {
    let lat = Number(
      response.AllResults[0].InformationNuggets[0].DestinationMapLocationSpec.Latitude.c.join(
        '.'
      ) *
        Number(
          response.AllResults[0].InformationNuggets[0]
            .DestinationMapLocationSpec.Latitude.s
        )
    );
    let long = Number(
      response.AllResults[0].InformationNuggets[0].DestinationMapLocationSpec.Longitude.c.join(
        '.'
      ) *
        Number(
          response.AllResults[0].InformationNuggets[0]
            .DestinationMapLocationSpec.Longitude.s
        )
    );

    const destinationA = new google.maps.LatLng(lat, long);
    service.getDistanceMatrix(
      {
        origins: [origin1],
        destinations: [destinationA],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.IMPERIAL,
        avoidHighways: false,
        avoidTolls: false
      },
      callback
    );

    function callback(response, status) {
      console.log('response in callback', response);
      if (status == 'OK') {
        var origins = response.originAddresses;
        var destinations = response.destinationAddresses;

        for (var i = 0; i < origins.length; i++) {
          var results = response.rows[i].elements;
          for (var j = 0; j < results.length; j++) {
            var element = results[j];
            var distance = element.distance.text;
            var duration = element.duration.text;
            var from = origins[i];
            var to = destinations[j];
          }
        }
      }
    }

    // fetch(
    //   `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${fullStackLatitude},${fullStackLongitude}&destinations=${lat}%${long}%key=AIzaSyAtoszqCetsFUoTZh1JriuiuM0p5Y3JeGw`
    // )
    //   .then(function(response) {
    //     // The response is a Response instance.
    //     // You parse the data into a useable format using `.json()`
    //     return response.json();
    //   })
    //   .then(function(data) {
    //     // `data` is the parsed version of the JSON returned from the above endpoint.
    //     console.log(data); // { "userId": 1, "id": 1, "title": "...", "body": "..." }
    //   });
    // console.log(
    //   xhr.open(
    //     'GET',
    //     `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${fullStackLatitude},${fullStackLongitude}&destinations=${lat}%${long}%key=AIzaSyAtoszqCetsFUoTZh1JriuiuM0p5Y3JeGw`
    //   )
    // );
    console.log(response, info);
    console.log('in function on response index.html', lat, long);
    //Pick and store appropriate ConversationState from the results.
    //This example takes the default one from the first result.
    conversationState = response.AllResults[0].ConversationState;
  }

  statusElt.innerText = 'Received response.';
  responseElt.parentNode.hidden = false;
  responseElt.value = response.stringify(undefined, 2);
  infoElt.parentNode.hidden = false;
  infoElt.value = JSON.stringify(info, undefined, 2);
}

//Fires if error occurs during the request
function onError(err, info) {
  statusElt.innerText = 'Error: ' + JSON.stringify(err);
  responseElt.parentNode.hidden = true;
  infoElt.parentNode.hidden = false;
  infoElt.value = JSON.stringify(info, undefined, 2);
}

//Fires every time backend sends a speech-to-text
//transcript of a voice query
//See https://houndify.com/reference/HoundPartialTranscript
function onTranscriptionUpdate(transcript) {
  transcriptElt.value = transcript.PartialTranscript;
}
