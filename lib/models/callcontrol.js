module.exports = require('webrtc-core').bdsft.Model(CallControl, {
  config: require('../../js/config.js')
});

var fs = require('fs');
var C = require('webrtc-core').constants;

function CallControl(eventbus, debug, urlconfig, sipstack, sound, messages) {
  var self = {};

  self.updateDestination = function(value) {
    var valueFormatted = value.replace(/[^a-z0-9()@\.\-\s]+/ig, '');
    if(self.destination !== valueFormatted) {
      debug.log('formatted destination from '+value+' to '+valueFormatted);
      self.destination = valueFormatted;
    }
  };

  self.props = ['destination', 'classes', 'visible'];

  self.bindings = {
    classes: {
        callcontrol: ['visible', 'enableCallControl'],
        sipstack: 'callState',
        urlconfig: 'view'
    },
    enableCallControl: {
      urlconfig: 'enableCallControl'
    },
    destination: {
      callcontrol: 'destination'
    }
  }

  self.listeners = function(databinder, sipstackDatabinder) {
    if (!sipstack.enableConnectLocalMedia && urlconfig.destination) {
      var called = false;
      sipstackDatabinder.onModelPropChange('connected', function(connected){
        if(connected && !called) {
          called = true;
          self.call(urlconfig.destination);
        }
      });
    } else if(urlconfig.destination){
      eventbus.once('userMediaUpdated', function(e) {
        self.call(urlconfig.destination);
      });
    }
    eventbus.on('calling', function(e) {
      self.destination = e.destination.replace('sip:', '').replace('@'+self.domainTo, '');
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
    if (!destination) {
      messages.alert(self.messageEmptyDestination);
      return false;
    }

    if (!self.isValidDestination(destination, self.allowOutside, self.domainTo)) {
      messages.alert(self.messageOutsideDomain);
      return false;
    }

    if (destination.indexOf("sip:") === -1) {
      destination = ("sip:" + destination);
    }

    return self.formatDestination(destination, self.domainTo);
  };

  // URL call
  self.call = function(destinationToValidate) {
    if (sipstack.callState !== C.STATE_CONNECTED) {
      debug.info('Already in call with state : ' + sipstack.callState);
      return;
    }

    var destination = self.validateDestination(destinationToValidate);
    if (!destination) {
      debug.warn("destination is not valid : " + destinationToValidate);
      return;
    }

    debug.log("calling destination : " + destination);

    // Start the Call
    sipstack.call(destination);
  };


  return self;
}