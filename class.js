"use strict";

/*
 * Create rule center
 * @def - default rule
 * */
var _constructor_ = function () {
  this.initialize.apply(this, arguments);
};

_constructor_.prototype.initialize = function (options) {
};

_constructor_.extend = function (obj) {
  var _class = this.clone();
  for (var i in obj) {
    _class.prototype[i] = obj[i];
  }

  return _class;
};

_constructor_.clone = function () {
  var temp,
    _this = this;

  temp = eval("(function(){ return " + _this.toString() + "}());");

  function extend (dest, src) {
    if (src.prototype && Object.keys(src.prototype).length > 0) {
      dest.prototype = extend(dest.prototype || {}, src.prototype);
    }
    for (var i in src) {
      dest[i] = src[i];
    }
    return dest;
  }

  temp = extend(temp, _this);
  return temp;
};



module.exports = _constructor_;