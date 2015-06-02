module.exports = require('webrtc-core').bdsft.Model(CallControl, {
  config: require('../../js/config.js')
});

var fs = require('fs');
var C = require('webrtc-core').constants;

function CallControl(eventbus, debug, urlconfig, sipstack, sound) {
  var self = {};

  self.props = ['destination', 'classes', 'visible'];

  self.bindings = {
    'classes': {
        callcontrol: ['visible', 'enableCallControl'],
        sipstack: 'callState',
        urlconfig: 'view'
    }
  }

  self.init = function() {
    self.enableCallControl = urlconfig.enableCallControl || self.enableCallControl;
  };

  self.listeners = function() {
    if (!sipstack.enableConnectLocalMedia && urlconfig.destination) {
      eventbus.once("connected", function(e) {
        self.callUri(urlconfig.destination);
      });
    } else if(urlconfig.destination){
      eventbus.once('userMediaUpdated', function(e) {
        self.callUri(urlconfig.destination);
      });
    }
    eventbus.on('call', function(e) {
      self.callUri(e.destination);
    });
    eventbus.on('calling', function(e) {
      self.destination = e.destination.replace('sip:', '').replace('@'+sipstack.domainTo, '');
    });
    eventbus.on('digit', function(e) {
      self.processDigitInput(e.digit, e.isFromDestination);
    });
  };

  var appendDigit = function(digit){
    self.destination = (self.destination || '') + digit;
  };

  self.pressDTMF = function(digit) {
    if (digit.length !== 1) {
      return;
    }
    if (sipstack.isStarted()) {
      appendDigit(digit);
      sound.playClick();
      sipstack.sendDTMF(digit);
    }
  };

  self.processDigitInput = function(digit, isFromDestination) {
    if (!sipstack.isStarted() && self.visible) {
      if(isFromDestination) {
        return;
      }
      appendDigit(digit);
    } else if (digit.match(/^[0-9A-D#*,]+$/i)) {
      self.pressDTMF(digit);
    }
  };

  self.formatDestination = function(destination, domainTo) {
    if (destination.indexOf("@") === -1) {
      destination = (destination + "@" + domainTo);
    }

    var domain = destination.substring(destination.indexOf("@"));
    if (domain.indexOf(".") === -1) {
      destination = destination + "." + domainTo;
    }

    // WEBRTC-35 : filter out dtmf tones from destination
    return destination.replace(/,[0-9A-D#*,]+/, '');
  };

  self.isValidDestination = function(destination, allowOutside, domainTo) {
    if (!allowOutside && !new RegExp("[.||@]" + domainTo).test(destination)) {
      return false;
    }
    return true;
  };


  // Make sure destination allowed and in proper format
  self.validateDestination = function(destination) {
    if (!self.isValidDestination(destination, self.allowOutside, sipstack.domainTo)) {
      eventbus.invalidDestination();
      return false;
    }

    if (destination.indexOf("sip:") === -1) {
      destination = ("sip:" + destination);
    }

    return self.formatDestination(destination, sipstack.domainTo);
  };

  // URL call
  self.callUri = function(destinationToValidate) {
    if (sipstack.getCallState() !== C.STATE_CONNECTED) {
      debug('Already in call with state : ' + sipstack.getCallState());
      return;
    }
    if (destinationToValidate === "") {
      eventbus.emptyDestination();
      return;
    }

    var destination = self.validateDestination(destinationToValidate);
    if (!destination) {
      debug("destination is not valid : " + destinationToValidate);
      return;
    }

    debug("calling destination : " + destination);

    // Start the Call
    sipstack.call(destination);
  };


  return self;
}