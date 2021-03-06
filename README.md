# Call Control

Handles DMTF and outgoing call control.

Namespace : bdsft_webrtc.default.callcontrol

Dependencies : [DialPad](https://github.com/BroadSoft-Xtended/Library-WebRTC-DialPad), [History](https://github.com/BroadSoft-Xtended/Library-WebRTC-History), [Messages](https://github.com/BroadSoft-Xtended/Library-WebRTC-Messages), [SIP Stack](https://github.com/BroadSoft-Xtended/Library-WebRTC-SIPStack), [Sound](https://github.com/BroadSoft-Xtended/Library-WebRTC-Sound), [Stats](https://github.com/BroadSoft-Xtended/Library-WebRTC-Stats)

## Elements
<a name="elements"></a>

Element        |Type    |Description
---------------|--------|-----------------------------------
call           |div     |Holds the link to trigger a video call.
callAudio      |div     |Holds the link to trigger an audio call.
destination    |input   |Input for the destination
dialpadHolder  |div     |Div to hold the dialpad.
historyButton  |button  |Button to show the history.

## Properties
<a name="properties"></a>

Property     |Type    |Description
-------------|--------|----------------------------------------------------
destination  |string  |The destination to be called or currently calling.

## Configuration
<a name="configuration"></a>

Property                 |Type     |Default              |Description
-------------------------|---------|---------------------|-----------------------------------------------------------------------------------
allowOutside             |boolean  |true                 |True if calls outside of the domainTo is allowed.
domainTo                 |string   |broadsoftlabs.com    |Appends to the destination if no domain was specified on the destination. Used to validate the destination if allowOutside is set to false.
enableCallControl        |boolean  |true                 |True if call control is enabled.
messageEmptyDestination  |string   |Invalid Destination  |Message when the called destination is empty.
messageOutsideDomain     |string   |Invalid Destination  |Message when allowOutside is false and the called destination does not contain @domainTo.

## Methods
<a name="methods"></a>

Method             |Parameters                     |Description
-------------------|-------------------------------|--------------------------------------------------------------------------------------------------
call(destination)  |destination : SIP URI or PSTN eg. 13019779440 |Starts a new video call to destination if destination is valid and if no call is active.
callAudio(destination)  |destination : SIP URI or PSTN eg. 13019779440 |Starts a new audio call to destination if destination is valid and if no call is active.
pressDTMF(digit)   |digit : 0-9                    |Sends the digit as DTMF if the call is started and appends the digit to the destination property
