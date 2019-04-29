import React, { Component } from 'react';
// import Houndify from 'Houndify';
const Houndify = require('./public/js/houndify');

var responseElt = document.getElementById('responseJSON');
var infoElt = document.getElementById('infoJSON');
var statusElt = document.getElementById('status');
var transcriptElt = document.getElementById('query');

var clientID = 'ZZcQgdZ81mNp1DXV9BJoqA==';
var conversationState = null;
var voiceRequest = null;

const fullStackLatitude = 40.7049444;
const fullStackLongitude = -74.0091771;
var recorder = new Houndify.AudioRecorder();

class InputForm extends Component {
  initTextRequest() {
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
        ResponseAudioVoice: 'Sarah',
        ResponseAudioShortOrLong: 'Short'
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

  onMicrophoneClick() {
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

  render() {
    return (
      <form id='form' className='ui form'>
        <div className='ui action big labeled fluid input field'>
          <div
            className='ui icon basic label button'
            onClick={this.onMicrophoneClick}
          >
            <i id='voiceIcon' className='unmute big icon' />
          </div>
          <input
            id='query'
            type='text'
            placeholder='Click on a microphone icon or type in your query'
          />
          <button
            type='submit'
            id='textSearchButton'
            className='ui icon button'
            onClick={this.initTextRequest}
          >
            <i className='search big icon' />
          </button>
        </div>
        {/* 
        <div className='ui field'>
          <label className='ui label' htmlFor='file'>
            Or upload a recorded voice query from a file
          </label>
          <input type='file' id='file' name='file' onChange='onFileUpload()' />
        </div> */}

        <div id='status' className='ui info message'>
          Click on microphone icon or type in the text query.
        </div>

        <div className='ui field' hidden>
          <label>Response object</label>
          <textarea id='responseJSON' />
        </div>
        <div className='ui field' hidden>
          <label>Search info object</label>
          <textarea id='infoJSON' />
        </div>
      </form>
    );
  }
}

export default InputForm;
