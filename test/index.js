"use strict";

var ssp = require('../');
var notes = {
  1:"200KZT",
  2:"500KZT",
  3:"1000KZT",
  4:"2000KZT",
  5:"5000KZT"
};
ssp = ssp({device: '/dev/ttyACM0', type: "nv10usb",currencies:[1,1,1,1,1]});
ssp.on('read_note', function(note){
  if(note>0) {
    console.log("GOT",notes[note]);
  }
});
ssp.on('disable', function(){
  console.log("disabled");
});
ssp.on('credit_note', function(note){
  console.log("CREDIT",notes[note]);
  ssp.commands.disable().exec();
});

ssp.on("error", function(err){
  console.log(err.code, err.message);
});