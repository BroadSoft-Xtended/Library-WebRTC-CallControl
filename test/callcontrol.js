test = require('../node_modules/webrtc-sipstack/test/includes/common')(require('../node_modules/webrtc-core/test/includes/common'));
describe('callcontrol', function() {
    before(function() {
        test.setupLocalStorage();
        setupModels();
        core = require('webrtc-core');
    });

    it('click callButton with empty destination', function() {
        callcontrol.destination = '';
        bdsft_client_instances.test.history.history.persistCall(test.historyRtcSession('mydestination'))
        test.connect();
        callcontrolview.call.trigger("click");
        expect(callcontrol.destination).toEqual('mydestination');
        test.disconnect();
    });
    it('with audioOnly', function() {
        urlconfig.view = 'audioOnly';
        expect(callcontrol.classes.indexOf('audioOnly')).toNotEqual(-1);
    });
    it('callcontrol show and hide', function() {
        callcontrol.enableCallControl = true;
        callcontrol.visible = true;
        expect(callcontrol.classes.indexOf('callcontrol-shown')).toNotEqual(-1);
        test.isVisible(callcontrolview.view.find('.classes:first'), true);
        callcontrol.visible = false;
        test.isVisible(callcontrolview.view.find('.classes:first'), false);
    });
    it('call if enter pressed on destination input', function() {
        var called = false;
        test.connect();
        sipstack.ua.isConnected = function() {
            return true;
        };
        var callFun = callcontrol.call;
        callcontrol.call = function() {
            called = true;
        };
        var event = core.utils.createEvent("keypress");
        event.keyCode = 13;
        callcontrolview.destination.trigger(event);
        expect(called).toExist();
        callcontrol.call = callFun;
    });
    it('call and press enter on destination input', function() {
        var called = false;
        test.connectAndStartCall();
        expect(sipstack.getCallState()).toEqual(core.constants.STATE_STARTED);
        sipstack.ua.call = function(destination) {
            called = true;
        };
        var event = core.utils.createEvent("keypress");
        event.keyCode = 13;
        callcontrolview.destination.val("1000@domain.to");
        callcontrolview.destination.trigger(event);
        expect(!called).toExist();
        test.endCall();
        test.disconnect();
    });
    it('hide callcontrol on call started', function() {
        callcontrol.show();
        test.isVisible(callcontrolview.view.find('.classes:first'), true);
        test.connectAndStartCall();
        test.isVisible(callcontrolview.view.find('.classes:first'), false);
        test.endCall();
        test.disconnect();
    });
    it('digit during call and remove on ended', function() {
        callcontrol.destination = '12345';
        var session = test.connectAndStartCall();
        session.sendDTMF = function(){console.log('sendDTMF')};
        eventbus.digit('1', false);
        expect(callcontrol.destination).toEqual('123451');
        test.endCall();
        expect(callcontrol.destination).toEqual('12345');
        test.disconnect();
    });
    it('click callButton twice', function() {
        var called = false;
        test.connect();

        eventbus.on('calling', function(){
            called = true;
            sipstack.callState = 'calling';
        });
        callcontrolview.destination.val("1000@domain.to");
        callcontrolview.call.trigger("click");
        expect(called).toEqual(true);
        called = false;
        callcontrolview.call.trigger("click");
        expect(called).toEqual(false);
        test.disconnect();
    });
    it('destination:', function() {
        sipstack.enableConnectLocalMedia = true;
        callcontrol.allowOutside = true;
        location.search = '?destination=8323303810';
        setupModels();
        var calledDestination = '';
        eventbus.on('calling', function(e){
            calledDestination = e.destination;
        });
        test.connect();
        eventbus.userMediaUpdated();
        expect(calledDestination).toEqual("sip:8323303810@broadsoftlabs.com");
        test.disconnect();
    });
    it('WRTC-15 : strip non alphanumeric characters from destination', function() {
        callcontrol.destination = '1234567890˙';
        expect(callcontrol.destination).toEqual('1234567890');

        test.val(callcontrolview.destination, '234567890˙');
        expect(callcontrolview.destination.val()).toEqual('234567890');
        expect(callcontrol.destination).toEqual('234567890');
    });
    it('WEBRTC-35 : destination with dtmf tones:', function() {
        sipstack.enableConnectLocalMedia = true;
        callcontrol.allowOutside = true;
        location.search = '?destination=8323303810,,123132';
        setupModels();
        var calledDestination = '',
            sentTones = '';
        sipstack.ua.call = function(destination) {
            calledDestination = destination;
            return test.outgoingSession();
        };
        sipstack.sendDTMF = function(tones) {
            sentTones = tones;
        };
        sipstack.ua.getUserMedia = function(options, success, failure, force) {
            success();
        };

        test.connect();
        expect(calledDestination).toEqual("sip:8323303810@broadsoftlabs.com");

        var session = test.startCall();
        expect(sentTones).toEqual(",,123132");

        sentTones = '';

        test.reconnectCall(session);
        expect(sentTones).toEqual("", "Should NOT send the dtmf again");
        test.disconnect();
    });
    it('WEBRTC-35 : destination with dtmf tones and #', function() {
        sipstack.enableConnectLocalMedia = true;
        callcontrol.allowOutside = true;
        location.search = '?destination=8323303810,,123132%23';
        setupModels();
        var calledDestination = '',
            sentTones = '';
        sipstack.ua.call = function(destination) {
            calledDestination = destination;
            return test.outgoingSession();
        };
        sipstack.sendDTMF = function(tones) {
            sentTones = tones;
        };
        sipstack.ua.getUserMedia = function(options, success, failure, force) {
            success();
        };

        test.connect();
        expect(calledDestination).toEqual("sip:8323303810@broadsoftlabs.com");

        test.startCall();
        expect(sentTones).toEqual(",,123132#");
        test.disconnect();
    });
    it('WEBRTC-35 : call with dtmf tones and #', function() {
        sipstack.enableConnectLocalMedia = true;
        callcontrol.allowOutside = true;
        var calledDestination = '',
            sentTones = '';
        sipstack.ua.call = function(destination) {
            calledDestination = destination;
            return test.outgoingSession();
        };
        sipstack.sendDTMF = function(tones) {
            sentTones = tones;
        };
        sipstack.ua.getUserMedia = function(options, success, failure, force) {
            success();
        };

        test.connect();
        callcontrol.call('8323303810,,123132#');
        expect(calledDestination).toEqual("sip:8323303810@broadsoftlabs.com");

        test.startCall();
        expect(sentTones).toEqual(",,123132#");
        test.disconnect();
    });
    it('WEBRTC-35 : destination with dtmf tones and domain', function() {
        sipstack.enableConnectLocalMedia = true;
        callcontrol.allowOutside = true;
        location.search = '?destination=8323303810,,123132@some.domain';
        setupModels();
        var calledDestination = '',
            sentTones = '';
        sipstack.ua.call = function(destination) {
            calledDestination = destination;
            return test.outgoingSession();
        };
        sipstack.sendDTMF = function(tones) {
            sentTones = tones;
        };
        sipstack.ua.getUserMedia = function(options, success, failure, force) {
            success();
        };

        test.connect();
        expect(calledDestination).toEqual("sip:8323303810@some.domain");

        test.startCall();
        expect(sentTones).toEqual(",,123132");
        test.endCall();
        test.disconnect();
    });
    it('validateDestination', function() {
        callcontrol.allowOutside = true;
        expect(callcontrol.validateDestination("1000")).toEqual("sip:1000@broadsoftlabs.com");
        expect(callcontrol.validateDestination("1000@webrtc")).toEqual("sip:1000@webrtc.broadsoftlabs.com");
        expect(callcontrol.validateDestination("1000@webrtc.domain.to")).toEqual("sip:1000@webrtc.domain.to");
        expect(callcontrol.validateDestination("1000@domain.to")).toEqual("sip:1000@domain.to");
    });
    it('validateDestination with allowOutside = false', function() {
        callcontrol.allowOutside = false;
        expect(callcontrol.validateDestination("1000")).toEqual(false);
        expect(callcontrol.validateDestination("1000@webrtc")).toEqual(false);
        expect(callcontrol.validateDestination("1000@webrtc.broadsoftlabs.com")).toEqual("sip:1000@webrtc.broadsoftlabs.com");
        expect(callcontrol.validateDestination("1000@broadsoftlabs.com")).toEqual("sip:1000@broadsoftlabs.com");
        expect(callcontrol.validateDestination("1000@anotherdomain.to")).toEqual(false);
    });
    it('hangup on failed', function() {
        sipstack.ua.isConnected = function() {
            return true;
        }
        test.connect();
        callcontrol.visible = true;
        test.failCall();
        expect(sipstack.getCallState()).toEqual("connected");
        test.isVisible(callcontrolview.call, true);
        test.disconnect();
    });
    it('hangup on calling', function() {
        sipstack.ua.isConnected = function() {
            return true;
        }
        callcontrol.visible = true;
        callcontrol.call("1000@webrtc.domain.to");
        test.newCall();
        expect(sipstack.getCallState()).toEqual("calling");
        test.isVisible(callcontrolview.call, false);
        test.disconnect();
    });
    it('destination configuration and enableConnectLocalMedia = false', function() {
        var destinationCalled = '';
        urlconfig.destination = '12345';
        sipstack.enableConnectLocalMedia = false;
        createCallControl();
        callcontrol.call = function(destination) {
            destinationCalled = destination;
        };
        test.connectAndStartCall();
        sipstack.ua.isConnected = function() {
            return true;
        };
        expect(destinationCalled).toEqual('12345');
        test.endCall();

        // trigger connect again to verify destination is only called once
        destinationCalled = '';
        test.connect();
        expect(destinationCalled).toEqual('');
        test.disconnect();
    });
    it('destination configuration and enableConnectLocalMedia = true', function() {
        var destinationCalled = '';
        urlconfig.destination = '12345';
        sipstack.enableConnectLocalMedia = true;
        createCallControl();
        callcontrol.call = function(destination) {
            destinationCalled = destination;
        };
        test.connectAndStartCall();
        sipstack.ua.isConnected = function() {
            return true;
        };
        expect(destinationCalled).toEqual('12345');
        test.endCall();

        // trigger connect again to verify destination is only called once
        destinationCalled = '';
        test.connect();
        expect(destinationCalled).toEqual('');
        test.disconnect();
    });
});

function setupModels() {
    test.createCore('urlconfig');
    test.createModelAndView('sipstack', {
        sipstack: require('webrtc-sipstack')
    });
    eventbus = bdsft_client_instances.test.core.eventbus;

    createCallControl();
}

function createCallControl() {
    return test.createModelAndView('callcontrol', {
        callcontrol: require('../'),
        dialpad: require('webrtc-dialpad'),
        history: require('webrtc-history'),
        stats: require('webrtc-stats'),
        messages: require('webrtc-messages'),
        sipstack: require('webrtc-sipstack'),
        sound: require('webrtc-sound')
    });
}