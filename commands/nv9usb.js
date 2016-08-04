"use strict";

module.exports = {
    "reset":0x01,
    "set_channel_inhibits":0x02,
    "display_on":0x03,
    "display_off":0x04,
    "setup_request":0x05,
    "host_protocol_version":0x06,
    "poll":0x07,
    "reject_banknote":0x08,
    "disable":0x09,
    "enable":0x0a,
    "get_serial_number":0x0c,
    "unit_data":0x0d,
    "channel_value_request":0x0e,
    "channel_security_data":0x0f,
    "channel_reteach_data":0x10,
    "sync":function(){
      this.sequence = 0x80;
      return 0x11;
    },
    "enable_higher_protocol":0x13,
    "last_reject_code":0x17,
    "hold":0x18,
    "get_firmware_version":0x20,
    "get_dataset_version":0x21,
    "set_generator":0x4a,
    "set_modulus":0x4b,
    "request_key_exchange":0x4c,
    "poll_with_ack":0x56,
    "event_ack":0x57
  };