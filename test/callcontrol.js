var jsdom = require('mocha-jsdom');
expect = require('expect');
jsdom({});

describe('callcontrol', function() {

    before(function() {
        core = require('webrtc-core');
        testUA = core.testUA;
        setupModels();
        testUA.mockWebRTC();
    });

    it('with audioOnly', function() {
        configuration.view = 'audioOnly';
        expect(callcontrol.classes.indexOf('audioOnly')).toNotEqual(-1);
    });
    it('callcontrol show and hide', function() {
        configuration.enableCallControl = true;
        callcontrol.visible = true;
        expect(callcontrol.classes.indexOf('callcontrol-shown')).toNotEqual(-1);
        testUA.isVisible(callcontrolview.callControl, true);
        callcontrol.visible = false;
        testUA.isVisible(callcontrolview.callControl, false);
    });
    it('call if enter pressed on destination input', function() {
        var called = false;
        testUA.connect();
        sipstack.ua.isConnected = function() {
            return true;
        };
        var callUriFun = callcontrol.callUri;
        callcontrol.callUri = function() {
            called = true;
        };
        var event = core.utils.createEvent("keypress");
        event.keyCode = 13;
        callcontrolview.destination.trigger(event);
        expect(called).toExist();
        callcontrol.callUri = callUriFun;
    });
    it('call and press enter on destination input', function() {
        var called = false;
        testUA.connectAndStartCall();
        expect(sipstack.getCallState()).toEqual(core.constants.STATE_STARTED);
        sipstack.ua.call = function(destination) {
            called = true;
            return testUA.outgoingSession();
        };
        var event = core.utils.createEvent("keypress");
        event.keyCode = 13;
        callcontrolview.destination.val("1000@domain.to");
        callcontrolview.destination.trigger(event);
        expect(!called).toExist();
        testUA.endCall();
    });
    it('click callButton twice', function() {
        var called = false;
        testUA.connect();

        sipstack.ua.call = function(destination) {
            called = true;
            var session = testUA.outgoingSession();
            sipstack.ua.emit('newRTCSession', sipstack.ua, {
                session: session
            });
            return session;
        };
        callcontrolview.destination.val("1000@domain.to");
        callcontrolview.call.trigger("click");
        expect(called).toExist();
        called = false;
        callcontrolview.call.trigger("click");
        expect(!called).toExist();
    });
    it('destination:', function() {
        configuration.enableConnectLocalMedia = true;
        configuration.allowOutside = true;
        location.search = '?destination=8323303810';
        setupModels();
        var calledDestination = '';
        sipstack.ua.call = function(destination) {
            calledDestination = destination;
            return testUA.outgoingSession();
        };
        sipstack.ua.getUserMedia = function(options, success, failure, force) {
            success();
        };

        testUA.connect();
        expect(calledDestination).toEqual("sip:8323303810@broadsoftlabs.com");
    });
    it('WEBRTC-35 : destination with dtmf tones:', function() {
        configuration.enableConnectLocalMedia = true;
        configuration.allowOutside = true;
        location.search = '?destination=8323303810,,123132';
        setupModels();
        var calledDestination = '',
            sentTones = '';
        sipstack.ua.call = function(destination) {
            calledDestination = destination;
            return testUA.outgoingSession();
        };
        sipstack.sendDTMF = function(tones) {
            sentTones = tones;
        };
        sipstack.ua.getUserMedia = function(options, success, failure, force) {
            success();
        };

        testUA.connect();
        expect(calledDestination).toEqual("sip:8323303810@broadsoftlabs.com");

        var session = testUA.startCall();
        expect(sentTones).toEqual(",,123132");

        sentTones = '';

        testUA.reconnectCall(session);
        expect(sentTones).toEqual("", "Should NOT send the dtmf again");
    });
    it('WEBRTC-35 : destination with dtmf tones and #', function() {
        configuration.enableConnectLocalMedia = true;
        configuration.allowOutside = true;
        location.search = '?destination=8323303810,,123132%23';
        setupModels();
        var calledDestination = '',
            sentTones = '';
        sipstack.ua.call = function(destination) {
            calledDestination = destination;
            return testUA.outgoingSession();
        };
        sipstack.sendDTMF = function(tones) {
            sentTones = tones;
        };
        sipstack.ua.getUserMedia = function(options, success, failure, force) {
            success();
        };

        testUA.connect();
        expect(calledDestination).toEqual("sip:8323303810@broadsoftlabs.com");

        testUA.startCall();
        expect(sentTones).toEqual(",,123132#");
    });
    it('WEBRTC-35 : destination with dtmf tones and domain', function() {
        configuration.enableConnectLocalMedia = true;
        configuration.allowOutside = true;
        location.search = '?destination=8323303810,,123132@some.domain';
        setupModels();
        var calledDestination = '',
            sentTones = '';
        sipstack.ua.call = function(destination) {
            calledDestination = destination;
            return testUA.outgoingSession();
        };
        sipstack.sendDTMF = function(tones) {
            sentTones = tones;
        };
        sipstack.ua.getUserMedia = function(options, success, failure, force) {
            success();
        };

        testUA.connect();
        expect(calledDestination).toEqual("sip:8323303810@some.domain");

        testUA.startCall();
        expect(sentTones).toEqual(",,123132");
        testUA.endCall();
    });
    it('validateDestination', function() {
        configuration.allowOutside = true;
        expect(callcontrol.validateDestination("1000")).toEqual("sip:1000@broadsoftlabs.com");
        expect(callcontrol.validateDestination("1000@webrtc")).toEqual("sip:1000@webrtc.broadsoftlabs.com");
        expect(callcontrol.validateDestination("1000@webrtc.domain.to")).toEqual("sip:1000@webrtc.domain.to");
        expect(callcontrol.validateDestination("1000@domain.to")).toEqual("sip:1000@domain.to");
    });
    it('validateDestination with allowOutside = false', function() {
        configuration.allowOutside = false;
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
        testUA.connect();
        callcontrol.visible = true;
        testUA.failCall();
        expect(sipstack.getCallState()).toEqual("connected");
        testUA.isVisible(callcontrolview.call, true);
    });
    it('hangup on calling', function() {
        sipstack.ua.isConnected = function() {
            return true;
        }
        callcontrol.visible = true;
        callcontrol.callUri("1000@webrtc.domain.to");
        testUA.newCall();
        expect(sipstack.getCallState()).toEqual("calling");
        testUA.isVisible(callcontrolview.call, false);
        testUA.disconnect();
    });
    it('destination configuration and enableConnectLocalMedia = false', function() {
        var destinationCalled = '';
        configuration.destination = '12345';
        configuration.enableConnectLocalMedia = false;
        createCallControl();
        callcontrol.callUri = function(destination) {
            destinationCalled = destination;
        };
        testUA.connectAndStartCall();
        sipstack.ua.isConnected = function() {
            return true;
        };
        expect(destinationCalled).toEqual('12345');
        testUA.endCall();

        // trigger connect again to verify destination is only called once
        destinationCalled = '';
        testUA.connect();
        expect(destinationCalled).toEqual('');
    });
    it('destination configuration and enableConnectLocalMedia = true', function() {
        var destinationCalled = '';
        configuration.destination = '12345';
        configuration.enableConnectLocalMedia = true;
        createCallControl();
        callcontrol.callUri = function(destination) {
            destinationCalled = destination;
        };
        testUA.connectAndStartCall();
        sipstack.ua.isConnected = function() {
            return true;
        };
        expect(destinationCalled).toEqual('12345');
        testUA.endCall();

        // trigger connect again to verify destination is only called once
        destinationCalled = '';
        testUA.connect();
        expect(destinationCalled).toEqual('');
    });
});

function setupModels() {
    testUA.createCore('configuration');
    testUA.createCore('sipstack');
    createCallControl();
    eventbus = bdsft_client_instances.eventbus_test;
}

function createCallControl() {
    return testUA.createModelAndView('callcontrol', {
        callcontrol: require('../'),
        dialpad: require('webrtc-dialpad')
    });
}