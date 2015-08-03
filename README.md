Smiley Secure Protocol nodejs implementation
=============================================

Introduction
-------------
This library allows you to manipulate bill acceptors and note validators under SSP.
Written by Innovative Technologies SSP manual

Maintained devices:
* NV10
* NV9 //preparing

Installation
-------------

```bash
npm install ssp
```

Usage
-----

```javascript
var ssp = require('ssp');
var notes = {
  1:"200KZT",
  2:"500KZT",
  3:"1000KZT",
  4:"2000KZT",
  5:"5000KZT",
  6:"10000KZT"
};
ssp = new ssp({
  device: '/dev/ttyACM0', //device address
  type: "nv10usb", //device type
  currencies:[0,1,1,1,1,0] //currencies types acceptable. Here all but 200KZT
});

ssp.init(function(){
  ssp.on('ready', function(){
    console.log("Device is ready");
    ssp.enable();
  });
  ssp.on('read_note', function(note){
    if(note>0) {
      console.log("GOT",notes[note]);
      if(note === 3) {
        // suddenly we decided that we don't need 1000 KZT
        ssp.commands.exec("reject_banknote");
      }
    }
  });
  ssp.on('disable', function(){
    console.log("disabled");
  });
  ssp.on('note_cleared_from_front', function(note){
    console.log("note_cleared_from_front");
  });
  ssp.on('note_cleared_to_cashbox', function(note){
    console.log("note_cleared_to_cashbox");
  });
  ssp.on('credit_note', function(note){
    console.log("CREDIT",notes[note]);
  });
  ssp.on("safe_note_jam", function(note){
    console.log("Jammed",note);
    //TODO: some notifiaction, recording, etc.
  });
  ssp.on("unsafe_note_jam", function(note){
    console.log("Jammed inside",note);
    //TODO: some notifiaction, recording, etc.
  });
  ssp.on("fraud_attempt", function(note){
    console.log("Fraud!",note);
    //TODO: some notifiaction, recording, etc.
  });
  ssp.on("stacker_full", function(note){
    console.log("I'm full, do something!");
    ssp.disable();
    //TODO: some notifiaction, recording, etc.
  });
  ssp.on("note_rejected", function(reason){
    console.log("Rejected!",reason);
  });
  ssp.on("error", function(err){
    console.log(err.code, err.message);
  });
});
```

Properties
------------

* **commands** - Generated on creation command-interface for sending command or stack of commands to device

Methods
----------

* **init([enableOnInit],[callback])** - Initializes device, in case of an error emits _error_ event. Can take boolean as a first argument which defines whether enable or not a device on init, second argument is callback, which has possible exception;
* **enable([callback])** - Enables device. Callback may be as an argument to supply asynchrony
* **disable([callback])** - Disables device. Callback may be as an argument to supply asynchrony
* **commands.{command}** - device`s commands binds as a methods to _commands_ interface and can be chained in execution stack like _ssp.commands.enable().display_off().event_ack()_ and then executed via _exec_ method
* **commands.exec([command], [callback])** - executes command stack. Method has optional _command_ parameter which if passed made to the end of command stack, and a callback.

Events
------------------

* **ready** - emits when device is ready for data.
* **close** - emits on device closes. e.g. disconnected
* **error** - emits when error occures. Has error object as an argument of a callback
* other events supported by SSP protocol like **slave_reset**, **read_note**, **credit_note**, **note_rejecting**, **note_stacking**, **disabled** et.c.

Thanks to
-------------------

Contributors:

* [Olexandr Vandalko](https://github.com/Vandalko)
