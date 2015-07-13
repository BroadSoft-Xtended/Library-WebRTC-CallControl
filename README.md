# Call Control

Handles DMTF and outgoing call control.

Model : bdsft_webrtc.default.callcontrol
View : bdsft_webrtc.default.callcontrolview
Dependencies : [Dial Pad](../dialpad), [History](../history), [Messages](../messages), [SIP Stack](../sipstack), [Sound](../sound), [Stats](../stats)

## Elements
<a name="elements"></a>

Element        |Type    |Description
---------------|--------|-----------------------------------
call           |div     |Holds the link to trigger a call.
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
call(destination)  |destination : SIP URI or PSTN eg. 13019779440 |Starts a new call to destination if destination is valid and if no call is active.
pressDTMF(digit)   |digit : 0-9                    |Sends the digit as DTMF if the call is started and appends the digit to the destination property
