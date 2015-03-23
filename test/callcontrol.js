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
        eventbus.toggleView(core.constants.VIEW_CALLCONTROL);
        expect(callcontrol.classes.indexOf('callcontrol-shown')).toNotEqual(-1);
        testUA.isVisible(callcontrolview.callControl, true);
        eventbus.toggleView(core.constants.VIEW_CALLCONTROL);
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