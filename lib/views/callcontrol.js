module.exports = require('webrtc-core').bdsft.View(CallControlView, {
  template: require('../../js/templates'), 
  style: require('../../js/styles')
})

var Utils = require('webrtc-core').utils;
var Constants = require('webrtc-core').constants;

function CallControlView(eventbus, callcontrol, sipstack, sound, dialpadView, history) {
  var self = {};

  self.model = callcontrol;
  

  self.elements = ['historyButton', 'destination', 'call', 'dialpadHolder'];

  self.init = function() {
    dialpadView.view.appendTo(self.dialpadHolder);
  };

  self.listeners = function(callcontrolDatabinder, historyDatabinder, settingsDatabinder) {
    self.destination.keypress(function(e) {
      if (e.keyCode === 13) {
        e.preventDefault();
        callcontrol.call(self.destination.val());
      }
    });
    self.historyButton.bind('click', function(e) {
      e.preventDefault();
      sound.playClick();
      history.toggle();
    });
    self.call.bind('click', function(e) {
      e.preventDefault();
      sound.playClick();
      callcontrol.call(self.destination.val());
    });
    callcontrolDatabinder.onModelPropChange('visible', function(visible){
      visible && self.destination.focus();
    });
    settingsDatabinder.onModelPropChange('visible', function(visible){
      visible && self.hide();
    });
    historyDatabinder.onModelPropChange('visible', function(visible){
      if (visible) {
        self.historyButton.removeClass("active");
      } else {
        self.historyButton.addClass("active");
      }
    });
    // Prevent the backspace key from navigating back if callcontrol is shown
    Utils.getElement(document).bind('keydown', function(event) {
      if (self.visible) {
        var doPrevent = false;
        if (event.keyCode === 8) {
          var d = event.srcElement || event.target;
          if ((d.tagName.toUpperCase() === 'INPUT' && (d.type.toUpperCase() === 'TEXT' ||
              d.type.toUpperCase() === 'PASSWORD' || d.type.toUpperCase() === 'FILE' ||
              d.type.toUpperCase() === 'EMAIL')) || d.tagName.toUpperCase() === 'TEXTAREA') {
            doPrevent = d.readOnly || d.disabled;
          } else {
            doPrevent = true;
            var value = self.destination.val();
            if(value) {
              self.destination.val( value.slice(0, value.length - 1));
              self.destination.trigger('change');
            }
          }
        }

        if (doPrevent) {
          event.preventDefault();
          return;
        }
      }

      var digit = String.fromCharCode(event.which);
      eventbus.digit(digit, self.destination.is(event.target));

      // TODO - look how to activate without affecting other inputs
      // var len = self.destination.val().length * 2;
      // self.destination[0].setSelectionRange(len, len);
    });
  };

  return self;
}