"use strict";

var ssp = require('../');
var notes = {
  1:"200KZT",
  2:"500KZT",
  3:"1000KZT",
  4:"2000KZT",
  5:"5000KZT",
  6:"10000KZT"
};
ssp = new ssp({
//  device: '/dev/ttyACM0', //device address
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

process.on('SIGINT', function () {
  process.exit(0);
});

process.on('uncaughtException', function (err) {
  console.log(err.stack);
  setTimeout(function () {
    process.exit(1);
  }, 500);
});

process.on('exit', function () {
  ssp.disable();
});