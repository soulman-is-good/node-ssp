"use strict";
var serialport = require('serialport'),
  fs = require('fs'),
  Commands = require('./commands'),
  Class = require('./class');

var SSPInstance = function SSP (opts) {
  var sspID = 0;
  var seq = 0x80;
  var options = {
    device: opts.device || "/dev/ttyUSB0",
    baudrate: opts.baudrate || 9600,
    databits: opts.databits || 8,
    stopbits: opts.stopbits || 2,
    parity: opts.parity && ['even', 'mark', 'odd', 'space'].indexOf(opts.parity.toString().toLowerCase()) > -1 ? opts.parity : 'none',
    currencies: opts.currencies || [1, 0, 1],
    type: opts.type || "nv10usb",
    sspID: opts.sspID || 0,
    seqence: opts.sequence || 0x80
  };
  var port = new serialport.SerialPort(options.device, {
    baudrate: options.baudrate,
    databits: options.databits,
    stopbits: options.stopbits,
    parity: options.parity,
    parser: serialport.parsers.raw
  }, false);

  if(fs.readdirSync('./commands').map(function(item){return item.replace(/\..+$/,'');}).indexOf(options.type) === -1) {
    throw new Error("Unknown device type '" + options.type + "'");
  }

  var commands = port.commands = new Commands(port, options.type, options.sspID, options.sequence);

  port.open(function (err) {
    if (err) {
      port.emit('error', err);
    } else {
      commands.sync().enable_higher_protocol()
        .set_channel_inhibits(easy_inhibit(options.currencies), 0x00)
        .enable().exec(function(){
          wait();
        });
      var wait = function () {
        setTimeout(function () {
          commands.exec("poll",wait);
        }, 500);
      };
      port.on('data', function (buffer) {
        if(buffer[0] === 0x7F) {
          var data = buffer.toJSON().splice(3,buffer[2]);
          var error = new Error("New error");
          error.code = data[0];
          switch (data[0]) {
            case 0xF2:
              error.message = "Command not known";
              break;
            case 0xF3:
              error.message = "Wrong no parameters";
              break;
            case 0xF4:
              error.message = "Parameter out of range";
              break;
            case 0xF5:
              error.message = "Command cannot be processed";
              break;
            case 0xF6:
              error.message = "Software error";
              break;
            case 0xF8:
              error.message = "Fail";
              break;
            case 0xFA:
              error.message = "Key not set";
              break;
            case 0xF0:
              break;
            default:
              error.message = "Unknown error";
          }
          if(error.code !== 0xF0) {
            port.emit("error", error);
          } else if(data.length > 1) {
            var event;
            switch (data[1]) {
              case 0xF1: //all
                event=["slave_reset"];
                break;
              case 0xEF: //bv20|bv50|bv100|nv9usb|nv10usb|nv200|SMART Payout|nv11
                event=["read_note", data[2]];
                break;
              case 0xEE: //bv20|bv50|bv100|nv9usb|nv10usb|nv200|SMART Payout|nv11
                event=["credit_note",data[2]];
                break;
              case 0xED: //bv20|bv50|bv100|nv9usb|nv10usb|nv200|SMART Payout|nv11
                event=["note_rejecting"];
                break;
              case 0xEC: //bv20|bv50|bv100|nv9usb|nv10usb|nv200|SMART Payout|nv11
                event=["note_rejected"];
                break;
              case 0xCC: //bv20|bv50|bv100|nv9usb|nv10usb|nv200|SMART Payout|nv11
                event=["note_stacking"];
                break;
              case 0xEB: //bv20|bv50|bv100|nv9usb|nv10usb|nv200|SMART Payout|nv11
                event=["note_stacked"];
                break;
              case 0xEA: //bv20|bv50|bv100|nv9usb|nv10usb|nv200|SMART Payout|nv11
                event=["safe_note_jam"];
                break;
              case 0xE9: //bv20|bv50|bv100|nv9usb|nv10usb|nv200|SMART Payout|nv11
                event=["unsafe_note_jam"];
                break;
              case 0xE8: //all
                event=["disabled"];
                break;
              case 0xE6: //bv20|bv50|bv100|nv9usb|nv10usb|nv200|nv201|SMART Payout|nv11|SMART Hopper
                event=["fraud_attempt", data[2]];
                break;
              case 0xE7: //bv20|bv50|bv100|nv9usb|nv10usb|nv200|SMART Payout|nv11
                event=["stacker_full"];
                break;
              case 0xE1: //bv20|bv50|bv100|nv9usb|nv10usb|nv200|nv201|SMART Payout|nv11
                event=["note_cleared_from_front", data[2]];
                break;
              case 0xE2: //bv20|bv50|bv100|nv9usb|nv10usb|nv200|nv201|SMART Payout|nv11
                event=["note_cleared_to_cashbox", data[2]];
                break;
              case 0xE3: //bv50|bv100|nv200|SMART Payout|nv11
                event=["cashbox_removed"];
                break;
              case 0xE4: //bv50|bv100|nv200|SMART Payout|nv11
                event=["cashbox_replaced"];
                break;
              case 0xE5: //nv200|nv201
                event=["barcode_ticket_validated"];
                break;
              case 0xD1: //nv200|nv201
                event=["barcode_ticket_acknowledge"];
                break;
              case 0xE0: //nv200
                event=["note_path_open"];
                break;
              case 0xB5: //bv20|bv50|bv100|nv9usb|nv10usb|nv200|SMART Payout|nv11
                event=["channel_disable"];
                break;
              case 0xB6: //bv20|bv50|bv100|nv9usb|nv10usb|nv200|nv201|SMART Payout|nv11|SMART Hopper
                event=["initialing"];
                break;
              case 0xDA: //SMART payout|SMART Hopper|nv11
                event=["dispensing",data[2]];
                break;
              case 0xD2: //SMART payout|SMART Hopper|nv11
                event=["dispensed",data[2]];
                break;
              case 0xD2: //SMART payout|SMART Hopper|nv11
                event=["jammed",data[2]];
                break;
              case 0xD6: //SMART payout|SMART Hopper|nv11
                event=["halted",data[2]];
                break;
              case 0xD7: //SMART payout|SMART Hopper
                event=["floating",data[2]];
                break;
              case 0xD8: //SMART payout|SMART Hopper
                event=["floated",data[2]];
                break;
              case 0xD9: //SMART payout|SMART Hopper|nv11
                event=["timeout",data[2]];
                break;
              case 0xDC: //SMART payout|SMART Hopper|nv11
                event=["incomplete_payout",data[2]];
                break;
              case 0xDD: //SMART payout|SMART Hopper|nv11
                event=["incomplete_payout",data[2]];
                break;
              case 0xDE: //SMART Hopper
                event=["cashbox_paid",data[2]];
                break;
              case 0xDF: //SMART Hopper
                event=["coin_credit",data[2]];
                break;
              case 0xC4: //SMART Hopper
                event=["coin_mech_jammed"];
                break;
              case 0xC5: //SMART Hopper
                event=["coin_mech_return_pressed"];
                break;
              case 0xB7: //SMART Hopper
                event=["coin_mech_error"];
                break;
              case 0xC2: //SMART payout|SMART Hopper|nv11
                event=["emptying"];
                break;
              case 0xC3: //SMART payout|SMART Hopper|nv11
                event=["emptied"];
                break;
              case 0xB3: //SMART payout|SMART Hopper|nv11
                event=["smart_emptying", data[0]];
                break;
              case 0xB4: //SMART payout|SMART Hopper|nv11
                event=["smart_emptied", data[0]];
                break;
              case 0xDB: //SMART payout|nv11
                event=["note_stored_in_payout", data[0]];
                break;
              case 0xC6: //SMART payout|nv11
                event=["payout_out_of_service"];
                break;
              case 0xB0: //SMART payout
                event=["jam_recovery"];
                break;
              case 0xB1: //SMART payout
                event=["error_during_payout"];
                break;
              case 0xC9: //SMART payout|nv11
                event=["note_transfered to stacker", data[2]];
                break;
              case 0xCE: //SMART payout|nv11
                event=["note_held_in_bezel", data[0]];
                break;
              case 0xCB: //SMART payout|nv11
                event=["note_paid_into_store_at_powerup", data[0]];
                break;
              case 0xCB: //SMART payout|nv11
                event=["note_paid_into_stacker_at_powerup", data[0]];
                break;
              case 0xCD: //nv11
                event=["note_dispensed_at_powerup", data[0]];
                break;
              case 0xC7: //nv11
                event=["note_float_removed"];
                break;
              case 0xC8: //nv11
                event=["note_float_attached"];
                break;
              case 0xC9: //nv11
                event=["device_full"];
                break;
            }
            port.emit.apply(port, event);
          }
        }
      });
    }
  });
  port.send = function (command, cb) {
    var data = [0x7F].concat(command, crc16Calc(command));
    var buf = new Buffer(data);
    port.write(buf, function () {
      cb && port.drain(cb);
    });
  };

  var getSeq = function getSeq () {
    return sspID | (seq = (seq === 0x80 ? 0x00 : 0x80));
  };
  var crc16Calc = function (command) {
    var length = command.length,
      seed = 0xFFFF,
      poly = 0x8005,
      crc = seed;


    for (var i = 0; i < length; i++) {
      crc ^= (command[i] << 8);

      for (var j = 0; j < 8; j++) {

        if (crc & 0x8000) {
          crc = ((crc << 1) & 0xffff) ^ poly;
        } else {
          crc <<= 1;
        }

      }
    }
    return [(crc & 0xFF), ((crc >> 8) & 0xFF)];
  };
  var easy_inhibit = function (acceptmask) {
    var channelmask = [1, 2, 4, 8, 16, 32, 64, 128], bitmask = 0;
    for (var i = 0; i < acceptmask.length; i++) {
      if (acceptmask[i] === 1) {
        bitmask = bitmask + channelmask[i];
      }
    }
    return bitmask;
  };
  //COMMANDS:
  var sync = function sync (cb) {
    seq = 0x00;
    port.send([getSeq(), 0x01, 0x11], cb);
  };
  var enable_higher_protocol = function enable_higher_protocol (cb) {
    port.send([getSeq(), 0x01, 0x19], cb);
  };
  var enable = function enable (cb) {
    port.send([getSeq(), 0x01, 0x0a], cb);
  };
  var disable = function disable (cb) {
    port.send([getSeq(), 0x01, 0x09], cb);
  };
  var set_inhibits = function set_inhibits (lch, hch, cb) {
    port.send([getSeq(), 0x03, 0x02, lch, hch], cb);
  };
  var reset = function reset (cb) {
    port.send([getSeq(), 0x01, 0x01], cb);
  };
  var poll = function poll (cb) {
    port.send([getSeq(), 0x01, 0x07], cb);
  };
  var blink = function blink (cb) {
    port.send([getSeq(), 0x01, 0x03], cb);
  };
  return port;
};

module.exports = SSPInstance;