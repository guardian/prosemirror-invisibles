function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor)
      descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps)
    _defineProperties(Constructor.prototype, protoProps);
  if (staticProps)
    _defineProperties(Constructor, staticProps);
  return Constructor;
}
function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value;
  }
  return obj;
}
var IdleScheduler = /* @__PURE__ */ function() {
  function IdleScheduler2() {
    _classCallCheck(this, IdleScheduler2);
    _defineProperty(this, "task", void 0);
  }
  _createClass(IdleScheduler2, [{
    key: "request",
    value: function request() {
      this.cancel();
      var request2 = window.requestIdleCallback || window.requestAnimationFrame;
      return new Promise(function(resolve) {
        return request2(resolve);
      });
    }
  }, {
    key: "cancel",
    value: function cancel() {
      var cancel2 = window.cancelIdleCallack || window.cancelAnimationFrame;
      if (this.task) {
        cancel2(this.task);
      }
    }
  }]);
  return IdleScheduler2;
}();
export { IdleScheduler as I };
