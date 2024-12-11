var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// <stdin>
import __import_BUFFER from "node:buffer";
import __import_CRYPTO from "node:crypto";
import __import_UTIL from "node:util";
import __import_STREAM from "node:stream";
import __import_ZLIB from "node:zlib";
import __import_EVENTS from "node:events";
import __import_PATH from "node:path";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require2 = /* @__PURE__ */ ((x) => typeof __require !== "undefined" ? __require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof __require !== "undefined" ? __require : a)[b]
}) : x)(function(x) {
  if (typeof __require !== "undefined") return __require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require22() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var require_utils = __commonJS({
  "node_modules/avsc/lib/utils.js"(exports, module) {
    "use strict";
    var buffer = __import_BUFFER;
    var crypto = __import_CRYPTO;
    var util = __import_UTIL;
    var Buffer2 = buffer.Buffer;
    var POOL = new BufferPool(4096);
    var NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
    var f = util.format;
    function newBuffer(size) {
      if (typeof Buffer2.alloc == "function") {
        return Buffer2.alloc(size);
      } else {
        return new Buffer2(size);
      }
    }
    function bufferFrom(data, enc) {
      if (typeof Buffer2.from == "function") {
        return Buffer2.from(data, enc);
      } else {
        return new Buffer2(data, enc);
      }
    }
    function capitalize(s) {
      return s.charAt(0).toUpperCase() + s.slice(1);
    }
    function compare(n1, n2) {
      return n1 === n2 ? 0 : n1 < n2 ? -1 : 1;
    }
    function getOption(opts, key, def) {
      var value = opts[key];
      return value === void 0 ? def : value;
    }
    function getHash(str, algorithm) {
      algorithm = algorithm || "md5";
      var hash = crypto.createHash(algorithm);
      hash.end(str);
      return hash.read();
    }
    function singleIndexOf(arr, v) {
      var pos = -1;
      var i, l;
      if (!arr) {
        return -1;
      }
      for (i = 0, l = arr.length; i < l; i++) {
        if (arr[i] === v) {
          if (pos >= 0) {
            return -2;
          }
          pos = i;
        }
      }
      return pos;
    }
    function toMap(arr, fn) {
      var obj = {};
      var i, elem;
      for (i = 0; i < arr.length; i++) {
        elem = arr[i];
        obj[fn(elem)] = elem;
      }
      return obj;
    }
    function objectValues(obj) {
      return Object.keys(obj).map(function(key) {
        return obj[key];
      });
    }
    function hasDuplicates(arr, fn) {
      var obj = /* @__PURE__ */ Object.create(null);
      var i, l, elem;
      for (i = 0, l = arr.length; i < l; i++) {
        elem = arr[i];
        if (fn) {
          elem = fn(elem);
        }
        if (obj[elem]) {
          return true;
        }
        obj[elem] = true;
      }
      return false;
    }
    function copyOwnProperties(src, dst, overwrite) {
      var names = Object.getOwnPropertyNames(src);
      var i, l, name;
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (!dst.hasOwnProperty(name) || overwrite) {
          var descriptor = Object.getOwnPropertyDescriptor(src, name);
          Object.defineProperty(dst, name, descriptor);
        }
      }
      return dst;
    }
    function isValidName(str) {
      return NAME_PATTERN.test(str);
    }
    function qualify(name, namespace) {
      if (~name.indexOf(".")) {
        name = name.replace(/^\./, "");
      } else if (namespace) {
        name = namespace + "." + name;
      }
      name.split(".").forEach(function(part) {
        if (!isValidName(part)) {
          throw new Error(f("invalid name: %j", name));
        }
      });
      return name;
    }
    function unqualify(name) {
      var parts = name.split(".");
      return parts[parts.length - 1];
    }
    function impliedNamespace(name) {
      var match = /^(.*)\.[^.]+$/.exec(name);
      return match ? match[1] : void 0;
    }
    function jsonEnd(str, pos) {
      pos = pos | 0;
      var c = str.charAt(pos++);
      if (/[\d-]/.test(c)) {
        while (/[eE\d.+-]/.test(str.charAt(pos))) {
          pos++;
        }
        return pos;
      } else if (/true|null/.test(str.slice(pos - 1, pos + 3))) {
        return pos + 3;
      } else if (/false/.test(str.slice(pos - 1, pos + 4))) {
        return pos + 4;
      }
      var depth = 0;
      var literal = false;
      do {
        switch (c) {
          case "{":
          case "[":
            if (!literal) {
              depth++;
            }
            break;
          case "}":
          case "]":
            if (!literal && !--depth) {
              return pos;
            }
            break;
          case '"':
            literal = !literal;
            if (!depth && !literal) {
              return pos;
            }
            break;
          case "\\":
            pos++;
        }
      } while (c = str.charAt(pos++));
      return -1;
    }
    function abstractFunction() {
      throw new Error("abstract");
    }
    function addDeprecatedGetters(obj, props) {
      var proto = obj.prototype;
      var i, l, prop, getter;
      for (i = 0, l = props.length; i < l; i++) {
        prop = props[i];
        getter = "get" + capitalize(prop);
        proto[getter] = util.deprecate(
          createGetter(prop),
          "use `." + prop + "` instead of `." + getter + "()`"
        );
      }
      function createGetter(prop2) {
        return function() {
          var delegate = this[prop2];
          return typeof delegate == "function" ? delegate.apply(this, arguments) : delegate;
        };
      }
    }
    function BufferPool(len) {
      this._len = len | 0;
      this._pos = 0;
      this._slab = newBuffer(this._len);
    }
    BufferPool.prototype.alloc = function(len) {
      if (len < 0) {
        throw new Error("negative length");
      }
      var maxLen = this._len;
      if (len > maxLen) {
        return newBuffer(len);
      }
      if (this._pos + len > maxLen) {
        this._slab = newBuffer(maxLen);
        this._pos = 0;
      }
      return this._slab.slice(this._pos, this._pos += len);
    };
    function Lcg(seed) {
      var a = 1103515245;
      var c = 12345;
      var m = Math.pow(2, 31);
      var state = Math.floor(seed || Math.random() * (m - 1));
      this._max = m;
      this._nextInt = function() {
        return state = (a * state + c) % m;
      };
    }
    Lcg.prototype.nextBoolean = function() {
      return !!(this._nextInt() % 2);
    };
    Lcg.prototype.nextInt = function(start, end) {
      if (end === void 0) {
        end = start;
        start = 0;
      }
      end = end === void 0 ? this._max : end;
      return start + Math.floor(this.nextFloat() * (end - start));
    };
    Lcg.prototype.nextFloat = function(start, end) {
      if (end === void 0) {
        end = start;
        start = 0;
      }
      end = end === void 0 ? 1 : end;
      return start + (end - start) * this._nextInt() / this._max;
    };
    Lcg.prototype.nextString = function(len, flags) {
      len |= 0;
      flags = flags || "aA";
      var mask = "";
      if (flags.indexOf("a") > -1) {
        mask += "abcdefghijklmnopqrstuvwxyz";
      }
      if (flags.indexOf("A") > -1) {
        mask += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      }
      if (flags.indexOf("#") > -1) {
        mask += "0123456789";
      }
      if (flags.indexOf("!") > -1) {
        mask += "~`!@#$%^&*()_+-={}[]:\";'<>?,./|\\";
      }
      var result = [];
      for (var i = 0; i < len; i++) {
        result.push(this.choice(mask));
      }
      return result.join("");
    };
    Lcg.prototype.nextBuffer = function(len) {
      var arr = [];
      var i;
      for (i = 0; i < len; i++) {
        arr.push(this.nextInt(256));
      }
      return bufferFrom(arr);
    };
    Lcg.prototype.choice = function(arr) {
      var len = arr.length;
      if (!len) {
        throw new Error("choosing from empty array");
      }
      return arr[this.nextInt(len)];
    };
    function OrderedQueue() {
      this._index = 0;
      this._items = [];
    }
    OrderedQueue.prototype.push = function(item) {
      var items = this._items;
      var i = items.length | 0;
      var j;
      items.push(item);
      while (i > 0 && items[i].index < items[j = i - 1 >> 1].index) {
        item = items[i];
        items[i] = items[j];
        items[j] = item;
        i = j;
      }
    };
    OrderedQueue.prototype.pop = function() {
      var items = this._items;
      var len = items.length - 1 | 0;
      var first = items[0];
      if (!first || first.index > this._index) {
        return null;
      }
      this._index++;
      if (!len) {
        items.pop();
        return first;
      }
      items[0] = items.pop();
      var mid = len >> 1;
      var i = 0;
      var i1, i2, j, item, c, c1, c2;
      while (i < mid) {
        item = items[i];
        i1 = (i << 1) + 1;
        i2 = i + 1 << 1;
        c1 = items[i1];
        c2 = items[i2];
        if (!c2 || c1.index <= c2.index) {
          c = c1;
          j = i1;
        } else {
          c = c2;
          j = i2;
        }
        if (c.index >= item.index) {
          break;
        }
        items[j] = item;
        items[i] = c;
        i = j;
      }
      return first;
    };
    function Tap(buf, pos) {
      this.buf = buf;
      this.pos = pos | 0;
      if (this.pos < 0) {
        throw new Error("negative offset");
      }
    }
    Tap.prototype.isValid = function() {
      return this.pos <= this.buf.length;
    };
    Tap.prototype._invalidate = function() {
      this.pos = this.buf.length + 1;
    };
    Tap.prototype.readBoolean = function() {
      return !!this.buf[this.pos++];
    };
    Tap.prototype.skipBoolean = function() {
      this.pos++;
    };
    Tap.prototype.writeBoolean = function(b) {
      this.buf[this.pos++] = !!b;
    };
    Tap.prototype.readInt = Tap.prototype.readLong = function() {
      var n = 0;
      var k = 0;
      var buf = this.buf;
      var b, h, f2, fk;
      do {
        b = buf[this.pos++];
        h = b & 128;
        n |= (b & 127) << k;
        k += 7;
      } while (h && k < 28);
      if (h) {
        f2 = n;
        fk = 268435456;
        do {
          b = buf[this.pos++];
          f2 += (b & 127) * fk;
          fk *= 128;
        } while (b & 128);
        return (f2 % 2 ? -(f2 + 1) : f2) / 2;
      }
      return n >> 1 ^ -(n & 1);
    };
    Tap.prototype.skipInt = Tap.prototype.skipLong = function() {
      var buf = this.buf;
      while (buf[this.pos++] & 128) {
      }
    };
    Tap.prototype.writeInt = Tap.prototype.writeLong = function(n) {
      var buf = this.buf;
      var f2, m;
      if (n >= -1073741824 && n < 1073741824) {
        m = n >= 0 ? n << 1 : ~n << 1 | 1;
        do {
          buf[this.pos] = m & 127;
          m >>= 7;
        } while (m && (buf[this.pos++] |= 128));
      } else {
        f2 = n >= 0 ? n * 2 : -n * 2 - 1;
        do {
          buf[this.pos] = f2 & 127;
          f2 /= 128;
        } while (f2 >= 1 && (buf[this.pos++] |= 128));
      }
      this.pos++;
    };
    Tap.prototype.readFloat = function() {
      var buf = this.buf;
      var pos = this.pos;
      this.pos += 4;
      if (this.pos > buf.length) {
        return 0;
      }
      return this.buf.readFloatLE(pos);
    };
    Tap.prototype.skipFloat = function() {
      this.pos += 4;
    };
    Tap.prototype.writeFloat = function(f2) {
      var buf = this.buf;
      var pos = this.pos;
      this.pos += 4;
      if (this.pos > buf.length) {
        return;
      }
      return this.buf.writeFloatLE(f2, pos);
    };
    Tap.prototype.readDouble = function() {
      var buf = this.buf;
      var pos = this.pos;
      this.pos += 8;
      if (this.pos > buf.length) {
        return 0;
      }
      return this.buf.readDoubleLE(pos);
    };
    Tap.prototype.skipDouble = function() {
      this.pos += 8;
    };
    Tap.prototype.writeDouble = function(d) {
      var buf = this.buf;
      var pos = this.pos;
      this.pos += 8;
      if (this.pos > buf.length) {
        return;
      }
      return this.buf.writeDoubleLE(d, pos);
    };
    Tap.prototype.readFixed = function(len) {
      var pos = this.pos;
      this.pos += len;
      if (this.pos > this.buf.length) {
        return;
      }
      var fixed = POOL.alloc(len);
      this.buf.copy(fixed, 0, pos, pos + len);
      return fixed;
    };
    Tap.prototype.skipFixed = function(len) {
      this.pos += len;
    };
    Tap.prototype.writeFixed = function(buf, len) {
      len = len || buf.length;
      var pos = this.pos;
      this.pos += len;
      if (this.pos > this.buf.length) {
        return;
      }
      buf.copy(this.buf, pos, 0, len);
    };
    Tap.prototype.readBytes = function() {
      var len = this.readLong();
      if (len < 0) {
        this._invalidate();
        return;
      }
      return this.readFixed(len);
    };
    Tap.prototype.skipBytes = function() {
      var len = this.readLong();
      if (len < 0) {
        this._invalidate();
        return;
      }
      this.pos += len;
    };
    Tap.prototype.writeBytes = function(buf) {
      var len = buf.length;
      this.writeLong(len);
      this.writeFixed(buf, len);
    };
    if (typeof Buffer2.prototype.utf8Slice == "function") {
      Tap.prototype.readString = function() {
        var len = this.readLong();
        if (len < 0) {
          this._invalidate();
          return "";
        }
        var pos = this.pos;
        var buf = this.buf;
        this.pos += len;
        if (this.pos > buf.length) {
          return;
        }
        return this.buf.utf8Slice(pos, pos + len);
      };
    } else {
      Tap.prototype.readString = function() {
        var len = this.readLong();
        if (len < 0) {
          this._invalidate();
          return "";
        }
        var pos = this.pos;
        var buf = this.buf;
        this.pos += len;
        if (this.pos > buf.length) {
          return;
        }
        return this.buf.slice(pos, pos + len).toString();
      };
    }
    Tap.prototype.skipString = function() {
      var len = this.readLong();
      if (len < 0) {
        this._invalidate();
        return;
      }
      this.pos += len;
    };
    Tap.prototype.writeString = function(s) {
      var len = Buffer2.byteLength(s);
      var buf = this.buf;
      this.writeLong(len);
      var pos = this.pos;
      this.pos += len;
      if (this.pos > buf.length) {
        return;
      }
      if (len > 64 && typeof Buffer2.prototype.utf8Write == "function") {
        buf.utf8Write(s, pos, len);
      } else {
        var i, l, c1, c2;
        for (i = 0, l = len; i < l; i++) {
          c1 = s.charCodeAt(i);
          if (c1 < 128) {
            buf[pos++] = c1;
          } else if (c1 < 2048) {
            buf[pos++] = c1 >> 6 | 192;
            buf[pos++] = c1 & 63 | 128;
          } else if ((c1 & 64512) === 55296 && ((c2 = s.charCodeAt(i + 1)) & 64512) === 56320) {
            c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
            i++;
            buf[pos++] = c1 >> 18 | 240;
            buf[pos++] = c1 >> 12 & 63 | 128;
            buf[pos++] = c1 >> 6 & 63 | 128;
            buf[pos++] = c1 & 63 | 128;
          } else {
            buf[pos++] = c1 >> 12 | 224;
            buf[pos++] = c1 >> 6 & 63 | 128;
            buf[pos++] = c1 & 63 | 128;
          }
        }
      }
    };
    if (typeof Buffer2.prototype.latin1Write == "function") {
      Tap.prototype.writeBinary = function(str, len) {
        var pos = this.pos;
        this.pos += len;
        if (this.pos > this.buf.length) {
          return;
        }
        this.buf.latin1Write(str, pos, len);
      };
    } else if (typeof Buffer2.prototype.binaryWrite == "function") {
      Tap.prototype.writeBinary = function(str, len) {
        var pos = this.pos;
        this.pos += len;
        if (this.pos > this.buf.length) {
          return;
        }
        this.buf.binaryWrite(str, pos, len);
      };
    } else {
      Tap.prototype.writeBinary = function(s, len) {
        var pos = this.pos;
        this.pos += len;
        if (this.pos > this.buf.length) {
          return;
        }
        this.buf.write(s, pos, len, "binary");
      };
    }
    Tap.prototype.matchBoolean = function(tap) {
      return this.buf[this.pos++] - tap.buf[tap.pos++];
    };
    Tap.prototype.matchInt = Tap.prototype.matchLong = function(tap) {
      var n1 = this.readLong();
      var n2 = tap.readLong();
      return n1 === n2 ? 0 : n1 < n2 ? -1 : 1;
    };
    Tap.prototype.matchFloat = function(tap) {
      var n1 = this.readFloat();
      var n2 = tap.readFloat();
      return n1 === n2 ? 0 : n1 < n2 ? -1 : 1;
    };
    Tap.prototype.matchDouble = function(tap) {
      var n1 = this.readDouble();
      var n2 = tap.readDouble();
      return n1 === n2 ? 0 : n1 < n2 ? -1 : 1;
    };
    Tap.prototype.matchFixed = function(tap, len) {
      return this.readFixed(len).compare(tap.readFixed(len));
    };
    Tap.prototype.matchBytes = Tap.prototype.matchString = function(tap) {
      var l1 = this.readLong();
      var p1 = this.pos;
      this.pos += l1;
      var l2 = tap.readLong();
      var p2 = tap.pos;
      tap.pos += l2;
      var b1 = this.buf.slice(p1, this.pos);
      var b2 = tap.buf.slice(p2, tap.pos);
      return b1.compare(b2);
    };
    Tap.prototype.unpackLongBytes = function() {
      var res = newBuffer(8);
      var n = 0;
      var i = 0;
      var j = 6;
      var buf = this.buf;
      var b, neg;
      b = buf[this.pos++];
      neg = b & 1;
      res.fill(0);
      n |= (b & 127) >> 1;
      while (b & 128) {
        b = buf[this.pos++];
        n |= (b & 127) << j;
        j += 7;
        if (j >= 8) {
          j -= 8;
          res[i++] = n;
          n >>= 8;
        }
      }
      res[i] = n;
      if (neg) {
        invert(res, 8);
      }
      return res;
    };
    Tap.prototype.packLongBytes = function(buf) {
      var neg = (buf[7] & 128) >> 7;
      var res = this.buf;
      var j = 1;
      var k = 0;
      var m = 3;
      var n;
      if (neg) {
        invert(buf, 8);
        n = 1;
      } else {
        n = 0;
      }
      var parts = [
        buf.readUIntLE(0, 3),
        buf.readUIntLE(3, 3),
        buf.readUIntLE(6, 2)
      ];
      while (m && !parts[--m]) {
      }
      while (k < m) {
        n |= parts[k++] << j;
        j += 24;
        while (j > 7) {
          res[this.pos++] = n & 127 | 128;
          n >>= 7;
          j -= 7;
        }
      }
      n |= parts[m] << j;
      do {
        res[this.pos] = n & 127;
        n >>= 7;
      } while (n && (res[this.pos++] |= 128));
      this.pos++;
      if (neg) {
        invert(buf, 8);
      }
    };
    function invert(buf, len) {
      while (len--) {
        buf[len] = ~buf[len];
      }
    }
    module.exports = {
      abstractFunction,
      addDeprecatedGetters,
      bufferFrom,
      capitalize,
      copyOwnProperties,
      getHash,
      compare,
      getOption,
      impliedNamespace,
      isValidName,
      jsonEnd,
      newBuffer,
      objectValues,
      qualify,
      toMap,
      singleIndexOf,
      hasDuplicates,
      unqualify,
      BufferPool,
      Lcg,
      OrderedQueue,
      Tap
    };
  }
});
var require_types = __commonJS({
  "node_modules/avsc/lib/types.js"(exports, module) {
    "use strict";
    var utils = require_utils();
    var buffer = __import_BUFFER;
    var util = __import_UTIL;
    var Buffer2 = buffer.Buffer;
    var SlowBuffer = buffer.SlowBuffer;
    var Tap = utils.Tap;
    var debug = util.debuglog("avsc:types");
    var f = util.format;
    var TYPES = {
      "array": ArrayType,
      "boolean": BooleanType,
      "bytes": BytesType,
      "double": DoubleType,
      "enum": EnumType,
      "error": RecordType,
      "fixed": FixedType,
      "float": FloatType,
      "int": IntType,
      "long": LongType,
      "map": MapType,
      "null": NullType,
      "record": RecordType,
      "string": StringType
    };
    var RANDOM = new utils.Lcg();
    var TAP = new Tap(new SlowBuffer(1024));
    var LOGICAL_TYPE = null;
    var UNDERLYING_TYPES = [];
    function Type2(schema, opts) {
      var type2;
      if (LOGICAL_TYPE) {
        type2 = LOGICAL_TYPE;
        UNDERLYING_TYPES.push([LOGICAL_TYPE, this]);
        LOGICAL_TYPE = null;
      } else {
        type2 = this;
      }
      this._hash = new Hash();
      this.name = void 0;
      this.aliases = void 0;
      this.doc = schema && schema.doc ? "" + schema.doc : void 0;
      if (schema) {
        var name = schema.name;
        var namespace = schema.namespace === void 0 ? opts && opts.namespace : schema.namespace;
        if (name !== void 0) {
          name = maybeQualify(name, namespace);
          if (isPrimitive(name)) {
            throw new Error(f("cannot rename primitive type: %j", name));
          }
          var registry = opts && opts.registry;
          if (registry) {
            if (registry[name] !== void 0) {
              throw new Error(f("duplicate type name: %s", name));
            }
            registry[name] = type2;
          }
        } else if (opts && opts.noAnonymousTypes) {
          throw new Error(f("missing name property in schema: %j", schema));
        }
        this.name = name;
        this.aliases = schema.aliases ? schema.aliases.map(function(s) {
          return maybeQualify(s, namespace);
        }) : [];
      }
    }
    Type2.forSchema = function(schema, opts) {
      opts = opts || {};
      opts.registry = opts.registry || {};
      var UnionType2 = function(wrapUnions) {
        if (wrapUnions === true) {
          wrapUnions = "always";
        } else if (wrapUnions === false) {
          wrapUnions = "never";
        } else if (wrapUnions === void 0) {
          wrapUnions = "auto";
        } else if (typeof wrapUnions == "string") {
          wrapUnions = wrapUnions.toLowerCase();
        }
        switch (wrapUnions) {
          case "always":
            return WrappedUnionType;
          case "never":
            return UnwrappedUnionType;
          case "auto":
            return void 0;
          default:
            throw new Error(f("invalid wrap unions option: %j", wrapUnions));
        }
      }(opts.wrapUnions);
      if (schema === null) {
        throw new Error('invalid type: null (did you mean "null"?)');
      }
      if (Type2.isType(schema)) {
        return schema;
      }
      var type2;
      if (opts.typeHook && (type2 = opts.typeHook(schema, opts))) {
        if (!Type2.isType(type2)) {
          throw new Error(f("invalid typehook return value: %j", type2));
        }
        return type2;
      }
      if (typeof schema == "string") {
        schema = maybeQualify(schema, opts.namespace);
        type2 = opts.registry[schema];
        if (type2) {
          return type2;
        }
        if (isPrimitive(schema)) {
          return opts.registry[schema] = Type2.forSchema({ type: schema }, opts);
        }
        throw new Error(f("undefined type name: %s", schema));
      }
      if (schema.logicalType && opts.logicalTypes && !LOGICAL_TYPE) {
        var DerivedType = opts.logicalTypes[schema.logicalType];
        if (DerivedType) {
          var namespace = opts.namespace;
          var registry = {};
          Object.keys(opts.registry).forEach(function(key) {
            registry[key] = opts.registry[key];
          });
          try {
            debug("instantiating logical type for %s", schema.logicalType);
            return new DerivedType(schema, opts);
          } catch (err) {
            debug("failed to instantiate logical type for %s", schema.logicalType);
            if (opts.assertLogicalTypes) {
              throw err;
            }
            LOGICAL_TYPE = null;
            opts.namespace = namespace;
            opts.registry = registry;
          }
        }
      }
      if (Array.isArray(schema)) {
        var logicalType = LOGICAL_TYPE;
        LOGICAL_TYPE = null;
        var types = schema.map(function(obj) {
          return Type2.forSchema(obj, opts);
        });
        if (!UnionType2) {
          UnionType2 = isAmbiguous(types) ? WrappedUnionType : UnwrappedUnionType;
        }
        LOGICAL_TYPE = logicalType;
        type2 = new UnionType2(types, opts);
      } else {
        type2 = function(typeName) {
          var Type3 = TYPES[typeName];
          if (Type3 === void 0) {
            throw new Error(f("unknown type: %j", typeName));
          }
          return new Type3(schema, opts);
        }(schema.type);
      }
      return type2;
    };
    Type2.forValue = function(val, opts) {
      opts = opts || {};
      opts.emptyArrayType = opts.emptyArrayType || Type2.forSchema({
        type: "array",
        items: "null"
      });
      if (opts.valueHook) {
        var type2 = opts.valueHook(val, opts);
        if (type2 !== void 0) {
          if (!Type2.isType(type2)) {
            throw new Error(f("invalid value hook return value: %j", type2));
          }
          return type2;
        }
      }
      switch (typeof val) {
        case "string":
          return Type2.forSchema("string", opts);
        case "boolean":
          return Type2.forSchema("boolean", opts);
        case "number":
          if ((val | 0) === val) {
            return Type2.forSchema("int", opts);
          } else if (Math.abs(val) < 9007199254740991) {
            return Type2.forSchema("float", opts);
          }
          return Type2.forSchema("double", opts);
        case "object":
          if (val === null) {
            return Type2.forSchema("null", opts);
          } else if (Array.isArray(val)) {
            if (!val.length) {
              return opts.emptyArrayType;
            }
            return Type2.forSchema({
              type: "array",
              items: Type2.forTypes(
                val.map(function(v) {
                  return Type2.forValue(v, opts);
                }),
                opts
              )
            }, opts);
          } else if (Buffer2.isBuffer(val)) {
            return Type2.forSchema("bytes", opts);
          }
          var fieldNames = Object.keys(val);
          if (fieldNames.some(function(s) {
            return !utils.isValidName(s);
          })) {
            return Type2.forSchema({
              type: "map",
              values: Type2.forTypes(fieldNames.map(function(s) {
                return Type2.forValue(val[s], opts);
              }), opts)
            }, opts);
          }
          return Type2.forSchema({
            type: "record",
            fields: fieldNames.map(function(s) {
              return { name: s, type: Type2.forValue(val[s], opts) };
            })
          }, opts);
        default:
          throw new Error(f("cannot infer type from: %j", val));
      }
    };
    Type2.forTypes = function(types, opts) {
      if (!types.length) {
        throw new Error("no types to combine");
      }
      if (types.length === 1) {
        return types[0];
      }
      opts = opts || {};
      var expanded = [];
      var numWrappedUnions = 0;
      var isValidWrappedUnion = true;
      types.forEach(function(type2) {
        switch (type2.typeName) {
          case "union:unwrapped":
            isValidWrappedUnion = false;
            expanded = expanded.concat(type2.types);
            break;
          case "union:wrapped":
            numWrappedUnions++;
            expanded = expanded.concat(type2.types);
            break;
          case "null":
            expanded.push(type2);
            break;
          default:
            isValidWrappedUnion = false;
            expanded.push(type2);
        }
      });
      if (numWrappedUnions) {
        if (!isValidWrappedUnion) {
          throw new Error("cannot combine wrapped union");
        }
        var branchTypes = {};
        expanded.forEach(function(type2) {
          var name = type2.branchName;
          var branchType = branchTypes[name];
          if (!branchType) {
            branchTypes[name] = type2;
          } else if (!type2.equals(branchType)) {
            throw new Error("inconsistent branch type");
          }
        });
        var wrapUnions = opts.wrapUnions;
        var unionType;
        opts.wrapUnions = true;
        try {
          unionType = Type2.forSchema(Object.keys(branchTypes).map(function(name) {
            return branchTypes[name];
          }), opts);
        } catch (err) {
          opts.wrapUnions = wrapUnions;
          throw err;
        }
        opts.wrapUnions = wrapUnions;
        return unionType;
      }
      var bucketized = {};
      expanded.forEach(function(type2) {
        var bucket = getTypeBucket(type2);
        var bucketTypes = bucketized[bucket];
        if (!bucketTypes) {
          bucketized[bucket] = bucketTypes = [];
        }
        bucketTypes.push(type2);
      });
      var buckets = Object.keys(bucketized);
      var augmented = buckets.map(function(bucket) {
        var bucketTypes = bucketized[bucket];
        if (bucketTypes.length === 1) {
          return bucketTypes[0];
        } else {
          switch (bucket) {
            case "null":
            case "boolean":
              return bucketTypes[0];
            case "number":
              return combineNumbers(bucketTypes);
            case "string":
              return combineStrings(bucketTypes, opts);
            case "buffer":
              return combineBuffers(bucketTypes, opts);
            case "array":
              bucketTypes = bucketTypes.filter(function(t) {
                return t !== opts.emptyArrayType;
              });
              if (!bucketTypes.length) {
                return opts.emptyArrayType;
              }
              return Type2.forSchema({
                type: "array",
                items: Type2.forTypes(bucketTypes.map(function(t) {
                  return t.itemsType;
                }), opts)
              }, opts);
            default:
              return combineObjects(bucketTypes, opts);
          }
        }
      });
      if (augmented.length === 1) {
        return augmented[0];
      } else {
        return Type2.forSchema(augmented, opts);
      }
    };
    Type2.isType = function() {
      var l = arguments.length;
      if (!l) {
        return false;
      }
      var any = arguments[0];
      if (!any || typeof any._update != "function" || typeof any.fingerprint != "function") {
        return false;
      }
      if (l === 1) {
        return true;
      }
      var typeName = any.typeName;
      var i;
      for (i = 1; i < l; i++) {
        if (typeName.indexOf(arguments[i]) === 0) {
          return true;
        }
      }
      return false;
    };
    Type2.__reset = function(size) {
      debug("resetting type buffer to %d", size);
      TAP.buf = new SlowBuffer(size);
    };
    Object.defineProperty(Type2.prototype, "branchName", {
      enumerable: true,
      get: function() {
        var type2 = Type2.isType(this, "logical") ? this.underlyingType : this;
        if (type2.name) {
          return type2.name;
        }
        if (Type2.isType(type2, "abstract")) {
          return type2._concreteTypeName;
        }
        return Type2.isType(type2, "union") ? void 0 : type2.typeName;
      }
    });
    Type2.prototype.clone = function(val, opts) {
      if (opts) {
        opts = {
          coerce: !!opts.coerceBuffers | 0,
          // Coerce JSON to Buffer.
          fieldHook: opts.fieldHook,
          qualifyNames: !!opts.qualifyNames,
          skip: !!opts.skipMissingFields,
          wrap: !!opts.wrapUnions | 0
          // Wrap first match into union.
        };
        return this._copy(val, opts);
      } else {
        return this.fromBuffer(this.toBuffer(val));
      }
    };
    Type2.prototype.compare = utils.abstractFunction;
    Type2.prototype.compareBuffers = function(buf1, buf2) {
      return this._match(new Tap(buf1), new Tap(buf2));
    };
    Type2.prototype.createResolver = function(type2, opts) {
      if (!Type2.isType(type2)) {
        throw new Error(f("not a type: %j", type2));
      }
      if (!Type2.isType(this, "union", "logical") && Type2.isType(type2, "logical")) {
        return this.createResolver(type2.underlyingType, opts);
      }
      opts = opts || {};
      opts.registry = opts.registry || {};
      var resolver, key;
      if (Type2.isType(this, "record", "error") && Type2.isType(type2, "record", "error")) {
        key = this.name + ":" + type2.name;
        resolver = opts.registry[key];
        if (resolver) {
          return resolver;
        }
      }
      resolver = new Resolver(this);
      if (key) {
        opts.registry[key] = resolver;
      }
      if (Type2.isType(type2, "union")) {
        var resolvers = type2.types.map(function(t) {
          return this.createResolver(t, opts);
        }, this);
        resolver._read = function(tap) {
          var index = tap.readLong();
          var resolver2 = resolvers[index];
          if (resolver2 === void 0) {
            throw new Error(f("invalid union index: %s", index));
          }
          return resolvers[index]._read(tap);
        };
      } else {
        this._update(resolver, type2, opts);
      }
      if (!resolver._read) {
        throw new Error(f("cannot read %s as %s", type2, this));
      }
      return Object.freeze(resolver);
    };
    Type2.prototype.decode = function(buf, pos, resolver) {
      var tap = new Tap(buf, pos);
      var val = readValue(this, tap, resolver);
      if (!tap.isValid()) {
        return { value: void 0, offset: -1 };
      }
      return { value: val, offset: tap.pos };
    };
    Type2.prototype.encode = function(val, buf, pos) {
      var tap = new Tap(buf, pos);
      this._write(tap, val);
      if (!tap.isValid()) {
        return buf.length - tap.pos;
      }
      return tap.pos;
    };
    Type2.prototype.equals = function(type2, opts) {
      var canon = (
        // Canonical equality.
        Type2.isType(type2) && this.fingerprint().equals(type2.fingerprint())
      );
      if (!canon || !(opts && opts.strict)) {
        return canon;
      }
      return JSON.stringify(this.schema({ exportAttrs: true })) === JSON.stringify(type2.schema({ exportAttrs: true }));
    };
    Type2.prototype.fingerprint = function(algorithm) {
      if (!algorithm) {
        if (!this._hash.str) {
          var schemaStr = JSON.stringify(this.schema());
          this._hash.str = utils.getHash(schemaStr).toString("binary");
        }
        return utils.bufferFrom(this._hash.str, "binary");
      } else {
        return utils.getHash(JSON.stringify(this.schema()), algorithm);
      }
    };
    Type2.prototype.fromBuffer = function(buf, resolver, noCheck) {
      var tap = new Tap(buf);
      var val = readValue(this, tap, resolver, noCheck);
      if (!tap.isValid()) {
        throw new Error("truncated buffer");
      }
      if (!noCheck && tap.pos < buf.length) {
        throw new Error("trailing data");
      }
      return val;
    };
    Type2.prototype.fromString = function(str) {
      return this._copy(JSON.parse(str), { coerce: 2 });
    };
    Type2.prototype.inspect = function() {
      var typeName = this.typeName;
      var className = getClassName(typeName);
      if (isPrimitive(typeName)) {
        return f("<%s>", className);
      } else {
        var obj = this.schema({ exportAttrs: true, noDeref: true });
        if (typeof obj == "object" && !Type2.isType(this, "logical")) {
          obj.type = void 0;
        }
        return f("<%s %j>", className, obj);
      }
    };
    Type2.prototype.isValid = function(val, opts) {
      var flags = (opts && opts.noUndeclaredFields) | 0;
      var errorHook = opts && opts.errorHook;
      var hook, path;
      if (errorHook) {
        path = [];
        hook = function(any, type2) {
          errorHook.call(this, path.slice(), any, type2, val);
        };
      }
      return this._check(val, flags, hook, path);
    };
    Type2.prototype.random = utils.abstractFunction;
    Type2.prototype.schema = function(opts) {
      return this._attrs({
        exportAttrs: !!(opts && opts.exportAttrs),
        noDeref: !!(opts && opts.noDeref)
      });
    };
    Type2.prototype.toBuffer = function(val) {
      TAP.pos = 0;
      this._write(TAP, val);
      var buf = utils.newBuffer(TAP.pos);
      if (TAP.isValid()) {
        TAP.buf.copy(buf, 0, 0, TAP.pos);
      } else {
        this._write(new Tap(buf), val);
      }
      return buf;
    };
    Type2.prototype.toJSON = function() {
      return this.schema({ exportAttrs: true });
    };
    Type2.prototype.toString = function(val) {
      if (val === void 0) {
        return JSON.stringify(this.schema({ noDeref: true }));
      }
      return JSON.stringify(this._copy(val, { coerce: 3 }));
    };
    Type2.prototype.wrap = function(val) {
      var Branch = this._branchConstructor;
      return Branch === null ? null : new Branch(val);
    };
    Type2.prototype._attrs = function(opts) {
      opts.derefed = opts.derefed || {};
      var name = this.name;
      if (name !== void 0) {
        if (opts.noDeref || opts.derefed[name]) {
          return name;
        }
        opts.derefed[name] = true;
      }
      var schema = {};
      if (this.name !== void 0) {
        schema.name = name;
      }
      schema.type = this.typeName;
      var derefedSchema = this._deref(schema, opts);
      if (derefedSchema !== void 0) {
        schema = derefedSchema;
      }
      if (opts.exportAttrs) {
        if (this.aliases && this.aliases.length) {
          schema.aliases = this.aliases;
        }
        if (this.doc !== void 0) {
          schema.doc = this.doc;
        }
      }
      return schema;
    };
    Type2.prototype._createBranchConstructor = function() {
      var name = this.branchName;
      if (name === "null") {
        return null;
      }
      var attr = ~name.indexOf(".") ? "this['" + name + "']" : "this." + name;
      var body = "return function Branch$(val) { " + attr + " = val; };";
      var Branch = new Function(body)();
      Branch.type = this;
      Branch.prototype.unwrap = new Function("return " + attr + ";");
      Branch.prototype.unwrapped = Branch.prototype.unwrap;
      return Branch;
    };
    Type2.prototype._peek = function(tap) {
      var pos = tap.pos;
      var val = this._read(tap);
      tap.pos = pos;
      return val;
    };
    Type2.prototype._check = utils.abstractFunction;
    Type2.prototype._copy = utils.abstractFunction;
    Type2.prototype._deref = utils.abstractFunction;
    Type2.prototype._match = utils.abstractFunction;
    Type2.prototype._read = utils.abstractFunction;
    Type2.prototype._skip = utils.abstractFunction;
    Type2.prototype._update = utils.abstractFunction;
    Type2.prototype._write = utils.abstractFunction;
    Type2.prototype.getAliases = function() {
      return this.aliases;
    };
    Type2.prototype.getFingerprint = Type2.prototype.fingerprint;
    Type2.prototype.getName = function(asBranch) {
      return this.name || !asBranch ? this.name : this.branchName;
    };
    Type2.prototype.getSchema = Type2.prototype.schema;
    Type2.prototype.getTypeName = function() {
      return this.typeName;
    };
    function PrimitiveType(noFreeze) {
      Type2.call(this);
      this._branchConstructor = this._createBranchConstructor();
      if (!noFreeze) {
        Object.freeze(this);
      }
    }
    util.inherits(PrimitiveType, Type2);
    PrimitiveType.prototype._update = function(resolver, type2) {
      if (type2.typeName === this.typeName) {
        resolver._read = this._read;
      }
    };
    PrimitiveType.prototype._copy = function(val) {
      this._check(val, void 0, throwInvalidError);
      return val;
    };
    PrimitiveType.prototype._deref = function() {
      return this.typeName;
    };
    PrimitiveType.prototype.compare = utils.compare;
    function NullType() {
      PrimitiveType.call(this);
    }
    util.inherits(NullType, PrimitiveType);
    NullType.prototype._check = function(val, flags, hook) {
      var b = val === null;
      if (!b && hook) {
        hook(val, this);
      }
      return b;
    };
    NullType.prototype._read = function() {
      return null;
    };
    NullType.prototype._skip = function() {
    };
    NullType.prototype._write = function(tap, val) {
      if (val !== null) {
        throwInvalidError(val, this);
      }
    };
    NullType.prototype._match = function() {
      return 0;
    };
    NullType.prototype.compare = NullType.prototype._match;
    NullType.prototype.typeName = "null";
    NullType.prototype.random = NullType.prototype._read;
    function BooleanType() {
      PrimitiveType.call(this);
    }
    util.inherits(BooleanType, PrimitiveType);
    BooleanType.prototype._check = function(val, flags, hook) {
      var b = typeof val == "boolean";
      if (!b && hook) {
        hook(val, this);
      }
      return b;
    };
    BooleanType.prototype._read = function(tap) {
      return tap.readBoolean();
    };
    BooleanType.prototype._skip = function(tap) {
      tap.skipBoolean();
    };
    BooleanType.prototype._write = function(tap, val) {
      if (typeof val != "boolean") {
        throwInvalidError(val, this);
      }
      tap.writeBoolean(val);
    };
    BooleanType.prototype._match = function(tap1, tap2) {
      return tap1.matchBoolean(tap2);
    };
    BooleanType.prototype.typeName = "boolean";
    BooleanType.prototype.random = function() {
      return RANDOM.nextBoolean();
    };
    function IntType() {
      PrimitiveType.call(this);
    }
    util.inherits(IntType, PrimitiveType);
    IntType.prototype._check = function(val, flags, hook) {
      var b = val === (val | 0);
      if (!b && hook) {
        hook(val, this);
      }
      return b;
    };
    IntType.prototype._read = function(tap) {
      return tap.readInt();
    };
    IntType.prototype._skip = function(tap) {
      tap.skipInt();
    };
    IntType.prototype._write = function(tap, val) {
      if (val !== (val | 0)) {
        throwInvalidError(val, this);
      }
      tap.writeInt(val);
    };
    IntType.prototype._match = function(tap1, tap2) {
      return tap1.matchInt(tap2);
    };
    IntType.prototype.typeName = "int";
    IntType.prototype.random = function() {
      return RANDOM.nextInt(1e3) | 0;
    };
    function LongType() {
      PrimitiveType.call(this);
    }
    util.inherits(LongType, PrimitiveType);
    LongType.prototype._check = function(val, flags, hook) {
      var b = typeof val == "number" && val % 1 === 0 && isSafeLong(val);
      if (!b && hook) {
        hook(val, this);
      }
      return b;
    };
    LongType.prototype._read = function(tap) {
      var n = tap.readLong();
      if (!isSafeLong(n)) {
        throw new Error("potential precision loss");
      }
      return n;
    };
    LongType.prototype._skip = function(tap) {
      tap.skipLong();
    };
    LongType.prototype._write = function(tap, val) {
      if (typeof val != "number" || val % 1 || !isSafeLong(val)) {
        throwInvalidError(val, this);
      }
      tap.writeLong(val);
    };
    LongType.prototype._match = function(tap1, tap2) {
      return tap1.matchLong(tap2);
    };
    LongType.prototype._update = function(resolver, type2) {
      switch (type2.typeName) {
        case "int":
          resolver._read = type2._read;
          break;
        case "abstract:long":
        case "long":
          resolver._read = this._read;
      }
    };
    LongType.prototype.typeName = "long";
    LongType.prototype.random = function() {
      return RANDOM.nextInt();
    };
    LongType.__with = function(methods, noUnpack) {
      methods = methods || {};
      var mapping = {
        toBuffer: "_toBuffer",
        fromBuffer: "_fromBuffer",
        fromJSON: "_fromJSON",
        toJSON: "_toJSON",
        isValid: "_isValid",
        compare: "compare"
      };
      var type2 = new AbstractLongType(noUnpack);
      Object.keys(mapping).forEach(function(name) {
        if (methods[name] === void 0) {
          throw new Error(f("missing method implementation: %s", name));
        }
        type2[mapping[name]] = methods[name];
      });
      return Object.freeze(type2);
    };
    function FloatType() {
      PrimitiveType.call(this);
    }
    util.inherits(FloatType, PrimitiveType);
    FloatType.prototype._check = function(val, flags, hook) {
      var b = typeof val == "number";
      if (!b && hook) {
        hook(val, this);
      }
      return b;
    };
    FloatType.prototype._read = function(tap) {
      return tap.readFloat();
    };
    FloatType.prototype._skip = function(tap) {
      tap.skipFloat();
    };
    FloatType.prototype._write = function(tap, val) {
      if (typeof val != "number") {
        throwInvalidError(val, this);
      }
      tap.writeFloat(val);
    };
    FloatType.prototype._match = function(tap1, tap2) {
      return tap1.matchFloat(tap2);
    };
    FloatType.prototype._update = function(resolver, type2) {
      switch (type2.typeName) {
        case "float":
        case "int":
          resolver._read = type2._read;
          break;
        case "abstract:long":
        case "long":
          resolver._read = function(tap) {
            return tap.readLong();
          };
      }
    };
    FloatType.prototype.typeName = "float";
    FloatType.prototype.random = function() {
      return RANDOM.nextFloat(1e3);
    };
    function DoubleType() {
      PrimitiveType.call(this);
    }
    util.inherits(DoubleType, PrimitiveType);
    DoubleType.prototype._check = function(val, flags, hook) {
      var b = typeof val == "number";
      if (!b && hook) {
        hook(val, this);
      }
      return b;
    };
    DoubleType.prototype._read = function(tap) {
      return tap.readDouble();
    };
    DoubleType.prototype._skip = function(tap) {
      tap.skipDouble();
    };
    DoubleType.prototype._write = function(tap, val) {
      if (typeof val != "number") {
        throwInvalidError(val, this);
      }
      tap.writeDouble(val);
    };
    DoubleType.prototype._match = function(tap1, tap2) {
      return tap1.matchDouble(tap2);
    };
    DoubleType.prototype._update = function(resolver, type2) {
      switch (type2.typeName) {
        case "double":
        case "float":
        case "int":
          resolver._read = type2._read;
          break;
        case "abstract:long":
        case "long":
          resolver._read = function(tap) {
            return tap.readLong();
          };
      }
    };
    DoubleType.prototype.typeName = "double";
    DoubleType.prototype.random = function() {
      return RANDOM.nextFloat();
    };
    function StringType() {
      PrimitiveType.call(this);
    }
    util.inherits(StringType, PrimitiveType);
    StringType.prototype._check = function(val, flags, hook) {
      var b = typeof val == "string";
      if (!b && hook) {
        hook(val, this);
      }
      return b;
    };
    StringType.prototype._read = function(tap) {
      return tap.readString();
    };
    StringType.prototype._skip = function(tap) {
      tap.skipString();
    };
    StringType.prototype._write = function(tap, val) {
      if (typeof val != "string") {
        throwInvalidError(val, this);
      }
      tap.writeString(val);
    };
    StringType.prototype._match = function(tap1, tap2) {
      return tap1.matchString(tap2);
    };
    StringType.prototype._update = function(resolver, type2) {
      switch (type2.typeName) {
        case "bytes":
        case "string":
          resolver._read = this._read;
      }
    };
    StringType.prototype.typeName = "string";
    StringType.prototype.random = function() {
      return RANDOM.nextString(RANDOM.nextInt(32));
    };
    function BytesType() {
      PrimitiveType.call(this);
    }
    util.inherits(BytesType, PrimitiveType);
    BytesType.prototype._check = function(val, flags, hook) {
      var b = Buffer2.isBuffer(val);
      if (!b && hook) {
        hook(val, this);
      }
      return b;
    };
    BytesType.prototype._read = function(tap) {
      return tap.readBytes();
    };
    BytesType.prototype._skip = function(tap) {
      tap.skipBytes();
    };
    BytesType.prototype._write = function(tap, val) {
      if (!Buffer2.isBuffer(val)) {
        throwInvalidError(val, this);
      }
      tap.writeBytes(val);
    };
    BytesType.prototype._match = function(tap1, tap2) {
      return tap1.matchBytes(tap2);
    };
    BytesType.prototype._update = StringType.prototype._update;
    BytesType.prototype._copy = function(obj, opts) {
      var buf;
      switch ((opts && opts.coerce) | 0) {
        case 3:
          this._check(obj, void 0, throwInvalidError);
          return obj.toString("binary");
        case 2:
          if (typeof obj != "string") {
            throw new Error(f("cannot coerce to buffer: %j", obj));
          }
          buf = utils.bufferFrom(obj, "binary");
          this._check(buf, void 0, throwInvalidError);
          return buf;
        case 1:
          if (!isJsonBuffer(obj)) {
            throw new Error(f("cannot coerce to buffer: %j", obj));
          }
          buf = utils.bufferFrom(obj.data);
          this._check(buf, void 0, throwInvalidError);
          return buf;
        default:
          this._check(obj, void 0, throwInvalidError);
          return utils.bufferFrom(obj);
      }
    };
    BytesType.prototype.compare = Buffer2.compare;
    BytesType.prototype.typeName = "bytes";
    BytesType.prototype.random = function() {
      return RANDOM.nextBuffer(RANDOM.nextInt(32));
    };
    function UnionType(schema, opts) {
      Type2.call(this);
      if (!Array.isArray(schema)) {
        throw new Error(f("non-array union schema: %j", schema));
      }
      if (!schema.length) {
        throw new Error("empty union");
      }
      this.types = Object.freeze(schema.map(function(obj) {
        return Type2.forSchema(obj, opts);
      }));
      this._branchIndices = {};
      this.types.forEach(function(type2, i) {
        if (Type2.isType(type2, "union")) {
          throw new Error("unions cannot be directly nested");
        }
        var branch = type2.branchName;
        if (this._branchIndices[branch] !== void 0) {
          throw new Error(f("duplicate union branch name: %j", branch));
        }
        this._branchIndices[branch] = i;
      }, this);
    }
    util.inherits(UnionType, Type2);
    UnionType.prototype._branchConstructor = function() {
      throw new Error("unions cannot be directly wrapped");
    };
    UnionType.prototype._skip = function(tap) {
      this.types[tap.readLong()]._skip(tap);
    };
    UnionType.prototype._match = function(tap1, tap2) {
      var n1 = tap1.readLong();
      var n2 = tap2.readLong();
      if (n1 === n2) {
        return this.types[n1]._match(tap1, tap2);
      } else {
        return n1 < n2 ? -1 : 1;
      }
    };
    UnionType.prototype._deref = function(schema, opts) {
      return this.types.map(function(t) {
        return t._attrs(opts);
      });
    };
    UnionType.prototype.getTypes = function() {
      return this.types;
    };
    function UnwrappedUnionType(schema, opts) {
      UnionType.call(this, schema, opts);
      this._dynamicBranches = null;
      this._bucketIndices = {};
      this.types.forEach(function(type2, index) {
        if (Type2.isType(type2, "abstract", "logical")) {
          if (!this._dynamicBranches) {
            this._dynamicBranches = [];
          }
          this._dynamicBranches.push({ index, type: type2 });
        } else {
          var bucket = getTypeBucket(type2);
          if (this._bucketIndices[bucket] !== void 0) {
            throw new Error(f("ambiguous unwrapped union: %j", this));
          }
          this._bucketIndices[bucket] = index;
        }
      }, this);
      Object.freeze(this);
    }
    util.inherits(UnwrappedUnionType, UnionType);
    UnwrappedUnionType.prototype._getIndex = function(val) {
      var index = this._bucketIndices[getValueBucket(val)];
      if (this._dynamicBranches) {
        index = this._getBranchIndex(val, index);
      }
      return index;
    };
    UnwrappedUnionType.prototype._getBranchIndex = function(any, index) {
      var logicalBranches = this._dynamicBranches;
      var i, l, branch;
      for (i = 0, l = logicalBranches.length; i < l; i++) {
        branch = logicalBranches[i];
        if (branch.type._check(any)) {
          if (index === void 0) {
            index = branch.index;
          } else {
            throw new Error("ambiguous conversion");
          }
        }
      }
      return index;
    };
    UnwrappedUnionType.prototype._check = function(val, flags, hook, path) {
      var index = this._getIndex(val);
      var b = index !== void 0;
      if (b) {
        return this.types[index]._check(val, flags, hook, path);
      }
      if (hook) {
        hook(val, this);
      }
      return b;
    };
    UnwrappedUnionType.prototype._read = function(tap) {
      var index = tap.readLong();
      var branchType = this.types[index];
      if (branchType) {
        return branchType._read(tap);
      } else {
        throw new Error(f("invalid union index: %s", index));
      }
    };
    UnwrappedUnionType.prototype._write = function(tap, val) {
      var index = this._getIndex(val);
      if (index === void 0) {
        throwInvalidError(val, this);
      }
      tap.writeLong(index);
      if (val !== null) {
        this.types[index]._write(tap, val);
      }
    };
    UnwrappedUnionType.prototype._update = function(resolver, type2, opts) {
      var i, l, typeResolver;
      for (i = 0, l = this.types.length; i < l; i++) {
        try {
          typeResolver = this.types[i].createResolver(type2, opts);
        } catch (err) {
          continue;
        }
        resolver._read = function(tap) {
          return typeResolver._read(tap);
        };
        return;
      }
    };
    UnwrappedUnionType.prototype._copy = function(val, opts) {
      var coerce = opts && opts.coerce | 0;
      var wrap = opts && opts.wrap | 0;
      var index;
      if (wrap === 2) {
        index = 0;
      } else {
        switch (coerce) {
          case 1:
            if (isJsonBuffer(val) && this._bucketIndices.buffer !== void 0) {
              index = this._bucketIndices.buffer;
            } else {
              index = this._getIndex(val);
            }
            break;
          case 2:
            if (val === null) {
              index = this._bucketIndices["null"];
            } else if (typeof val === "object") {
              var keys = Object.keys(val);
              if (keys.length === 1) {
                index = this._branchIndices[keys[0]];
                val = val[keys[0]];
              }
            }
            break;
          default:
            index = this._getIndex(val);
        }
        if (index === void 0) {
          throwInvalidError(val, this);
        }
      }
      var type2 = this.types[index];
      if (val === null || wrap === 3) {
        return type2._copy(val, opts);
      } else {
        switch (coerce) {
          case 3:
            var obj = {};
            obj[type2.branchName] = type2._copy(val, opts);
            return obj;
          default:
            return type2._copy(val, opts);
        }
      }
    };
    UnwrappedUnionType.prototype.compare = function(val1, val2) {
      var index1 = this._getIndex(val1);
      var index2 = this._getIndex(val2);
      if (index1 === void 0) {
        throwInvalidError(val1, this);
      } else if (index2 === void 0) {
        throwInvalidError(val2, this);
      } else if (index1 === index2) {
        return this.types[index1].compare(val1, val2);
      } else {
        return utils.compare(index1, index2);
      }
    };
    UnwrappedUnionType.prototype.typeName = "union:unwrapped";
    UnwrappedUnionType.prototype.random = function() {
      var index = RANDOM.nextInt(this.types.length);
      return this.types[index].random();
    };
    function WrappedUnionType(schema, opts) {
      UnionType.call(this, schema, opts);
      Object.freeze(this);
    }
    util.inherits(WrappedUnionType, UnionType);
    WrappedUnionType.prototype._check = function(val, flags, hook, path) {
      var b = false;
      if (val === null) {
        b = this._branchIndices["null"] !== void 0;
      } else if (typeof val == "object") {
        var keys = Object.keys(val);
        if (keys.length === 1) {
          var name = keys[0];
          var index = this._branchIndices[name];
          if (index !== void 0) {
            if (hook) {
              path.push(name);
              b = this.types[index]._check(val[name], flags, hook, path);
              path.pop();
              return b;
            } else {
              return this.types[index]._check(val[name], flags);
            }
          }
        }
      }
      if (!b && hook) {
        hook(val, this);
      }
      return b;
    };
    WrappedUnionType.prototype._read = function(tap) {
      var type2 = this.types[tap.readLong()];
      if (!type2) {
        throw new Error(f("invalid union index"));
      }
      var Branch = type2._branchConstructor;
      if (Branch === null) {
        return null;
      } else {
        return new Branch(type2._read(tap));
      }
    };
    WrappedUnionType.prototype._write = function(tap, val) {
      var index, keys, name;
      if (val === null) {
        index = this._branchIndices["null"];
        if (index === void 0) {
          throwInvalidError(val, this);
        }
        tap.writeLong(index);
      } else {
        keys = Object.keys(val);
        if (keys.length === 1) {
          name = keys[0];
          index = this._branchIndices[name];
        }
        if (index === void 0) {
          throwInvalidError(val, this);
        }
        tap.writeLong(index);
        this.types[index]._write(tap, val[name]);
      }
    };
    WrappedUnionType.prototype._update = function(resolver, type2, opts) {
      var i, l, typeResolver, Branch;
      for (i = 0, l = this.types.length; i < l; i++) {
        try {
          typeResolver = this.types[i].createResolver(type2, opts);
        } catch (err) {
          continue;
        }
        Branch = this.types[i]._branchConstructor;
        if (Branch) {
          resolver._read = function(tap) {
            return new Branch(typeResolver._read(tap));
          };
        } else {
          resolver._read = function() {
            return null;
          };
        }
        return;
      }
    };
    WrappedUnionType.prototype._copy = function(val, opts) {
      var wrap = opts && opts.wrap | 0;
      if (wrap === 2) {
        var firstType = this.types[0];
        if (val === null && firstType.typeName === "null") {
          return null;
        }
        return new firstType._branchConstructor(firstType._copy(val, opts));
      }
      if (val === null && this._branchIndices["null"] !== void 0) {
        return null;
      }
      var i, l, obj;
      if (typeof val == "object") {
        var keys = Object.keys(val);
        if (keys.length === 1) {
          var name = keys[0];
          i = this._branchIndices[name];
          if (i === void 0 && opts.qualifyNames) {
            var j, type2;
            for (j = 0, l = this.types.length; j < l; j++) {
              type2 = this.types[j];
              if (type2.name && name === utils.unqualify(type2.name)) {
                i = j;
                break;
              }
            }
          }
          if (i !== void 0) {
            obj = this.types[i]._copy(val[name], opts);
          }
        }
      }
      if (wrap === 1 && obj === void 0) {
        i = 0;
        l = this.types.length;
        while (i < l && obj === void 0) {
          try {
            obj = this.types[i]._copy(val, opts);
          } catch (err) {
            i++;
          }
        }
      }
      if (obj !== void 0) {
        return wrap === 3 ? obj : new this.types[i]._branchConstructor(obj);
      }
      throwInvalidError(val, this);
    };
    WrappedUnionType.prototype.compare = function(val1, val2) {
      var name1 = val1 === null ? "null" : Object.keys(val1)[0];
      var name2 = val2 === null ? "null" : Object.keys(val2)[0];
      var index = this._branchIndices[name1];
      if (name1 === name2) {
        return name1 === "null" ? 0 : this.types[index].compare(val1[name1], val2[name1]);
      } else {
        return utils.compare(index, this._branchIndices[name2]);
      }
    };
    WrappedUnionType.prototype.typeName = "union:wrapped";
    WrappedUnionType.prototype.random = function() {
      var index = RANDOM.nextInt(this.types.length);
      var type2 = this.types[index];
      var Branch = type2._branchConstructor;
      if (!Branch) {
        return null;
      }
      return new Branch(type2.random());
    };
    function EnumType(schema, opts) {
      Type2.call(this, schema, opts);
      if (!Array.isArray(schema.symbols) || !schema.symbols.length) {
        throw new Error(f("invalid enum symbols: %j", schema.symbols));
      }
      this.symbols = Object.freeze(schema.symbols.slice());
      this._indices = {};
      this.symbols.forEach(function(symbol, i) {
        if (!utils.isValidName(symbol)) {
          throw new Error(f("invalid %s symbol: %j", this, symbol));
        }
        if (this._indices[symbol] !== void 0) {
          throw new Error(f("duplicate %s symbol: %j", this, symbol));
        }
        this._indices[symbol] = i;
      }, this);
      this.default = schema.default;
      if (this.default !== void 0 && this._indices[this.default] === void 0) {
        throw new Error(f("invalid %s default: %j", this, this.default));
      }
      this._branchConstructor = this._createBranchConstructor();
      Object.freeze(this);
    }
    util.inherits(EnumType, Type2);
    EnumType.prototype._check = function(val, flags, hook) {
      var b = this._indices[val] !== void 0;
      if (!b && hook) {
        hook(val, this);
      }
      return b;
    };
    EnumType.prototype._read = function(tap) {
      var index = tap.readLong();
      var symbol = this.symbols[index];
      if (symbol === void 0) {
        throw new Error(f("invalid %s enum index: %s", this.name, index));
      }
      return symbol;
    };
    EnumType.prototype._skip = function(tap) {
      tap.skipLong();
    };
    EnumType.prototype._write = function(tap, val) {
      var index = this._indices[val];
      if (index === void 0) {
        throwInvalidError(val, this);
      }
      tap.writeLong(index);
    };
    EnumType.prototype._match = function(tap1, tap2) {
      return tap1.matchLong(tap2);
    };
    EnumType.prototype.compare = function(val1, val2) {
      return utils.compare(this._indices[val1], this._indices[val2]);
    };
    EnumType.prototype._update = function(resolver, type2, opts) {
      var symbols = this.symbols;
      if (type2.typeName === "enum" && hasCompatibleName(this, type2, !opts.ignoreNamespaces) && (type2.symbols.every(function(s) {
        return ~symbols.indexOf(s);
      }) || this.default !== void 0)) {
        resolver.symbols = type2.symbols.map(function(s) {
          return this._indices[s] === void 0 ? this.default : s;
        }, this);
        resolver._read = type2._read;
      }
    };
    EnumType.prototype._copy = function(val) {
      this._check(val, void 0, throwInvalidError);
      return val;
    };
    EnumType.prototype._deref = function(schema) {
      schema.symbols = this.symbols;
    };
    EnumType.prototype.getSymbols = function() {
      return this.symbols;
    };
    EnumType.prototype.typeName = "enum";
    EnumType.prototype.random = function() {
      return RANDOM.choice(this.symbols);
    };
    function FixedType(schema, opts) {
      Type2.call(this, schema, opts);
      if (schema.size !== (schema.size | 0) || schema.size < 0) {
        throw new Error(f("invalid %s size", this.branchName));
      }
      this.size = schema.size | 0;
      this._branchConstructor = this._createBranchConstructor();
      Object.freeze(this);
    }
    util.inherits(FixedType, Type2);
    FixedType.prototype._check = function(val, flags, hook) {
      var b = Buffer2.isBuffer(val) && val.length === this.size;
      if (!b && hook) {
        hook(val, this);
      }
      return b;
    };
    FixedType.prototype._read = function(tap) {
      return tap.readFixed(this.size);
    };
    FixedType.prototype._skip = function(tap) {
      tap.skipFixed(this.size);
    };
    FixedType.prototype._write = function(tap, val) {
      if (!Buffer2.isBuffer(val) || val.length !== this.size) {
        throwInvalidError(val, this);
      }
      tap.writeFixed(val, this.size);
    };
    FixedType.prototype._match = function(tap1, tap2) {
      return tap1.matchFixed(tap2, this.size);
    };
    FixedType.prototype.compare = Buffer2.compare;
    FixedType.prototype._update = function(resolver, type2, opts) {
      if (type2.typeName === "fixed" && this.size === type2.size && hasCompatibleName(this, type2, !opts.ignoreNamespaces)) {
        resolver.size = this.size;
        resolver._read = this._read;
      }
    };
    FixedType.prototype._copy = BytesType.prototype._copy;
    FixedType.prototype._deref = function(schema) {
      schema.size = this.size;
    };
    FixedType.prototype.getSize = function() {
      return this.size;
    };
    FixedType.prototype.typeName = "fixed";
    FixedType.prototype.random = function() {
      return RANDOM.nextBuffer(this.size);
    };
    function MapType(schema, opts) {
      Type2.call(this);
      if (!schema.values) {
        throw new Error(f("missing map values: %j", schema));
      }
      this.valuesType = Type2.forSchema(schema.values, opts);
      this._branchConstructor = this._createBranchConstructor();
      Object.freeze(this);
    }
    util.inherits(MapType, Type2);
    MapType.prototype._check = function(val, flags, hook, path) {
      if (!val || typeof val != "object" || Array.isArray(val)) {
        if (hook) {
          hook(val, this);
        }
        return false;
      }
      var keys = Object.keys(val);
      var b = true;
      var i, l, j, key;
      if (hook) {
        j = path.length;
        path.push("");
        for (i = 0, l = keys.length; i < l; i++) {
          key = path[j] = keys[i];
          if (!this.valuesType._check(val[key], flags, hook, path)) {
            b = false;
          }
        }
        path.pop();
      } else {
        for (i = 0, l = keys.length; i < l; i++) {
          if (!this.valuesType._check(val[keys[i]], flags)) {
            return false;
          }
        }
      }
      return b;
    };
    MapType.prototype._read = function(tap) {
      var values = this.valuesType;
      var val = {};
      var n;
      while (n = readArraySize(tap)) {
        while (n--) {
          var key = tap.readString();
          val[key] = values._read(tap);
        }
      }
      return val;
    };
    MapType.prototype._skip = function(tap) {
      var values = this.valuesType;
      var len, n;
      while (n = tap.readLong()) {
        if (n < 0) {
          len = tap.readLong();
          tap.pos += len;
        } else {
          while (n--) {
            tap.skipString();
            values._skip(tap);
          }
        }
      }
    };
    MapType.prototype._write = function(tap, val) {
      if (!val || typeof val != "object" || Array.isArray(val)) {
        throwInvalidError(val, this);
      }
      var values = this.valuesType;
      var keys = Object.keys(val);
      var n = keys.length;
      var i, key;
      if (n) {
        tap.writeLong(n);
        for (i = 0; i < n; i++) {
          key = keys[i];
          tap.writeString(key);
          values._write(tap, val[key]);
        }
      }
      tap.writeLong(0);
    };
    MapType.prototype._match = function() {
      throw new Error("maps cannot be compared");
    };
    MapType.prototype._update = function(rsv, type2, opts) {
      if (type2.typeName === "map") {
        rsv.valuesType = this.valuesType.createResolver(type2.valuesType, opts);
        rsv._read = this._read;
      }
    };
    MapType.prototype._copy = function(val, opts) {
      if (val && typeof val == "object" && !Array.isArray(val)) {
        var values = this.valuesType;
        var keys = Object.keys(val);
        var i, l, key;
        var copy = {};
        for (i = 0, l = keys.length; i < l; i++) {
          key = keys[i];
          copy[key] = values._copy(val[key], opts);
        }
        return copy;
      }
      throwInvalidError(val, this);
    };
    MapType.prototype.compare = MapType.prototype._match;
    MapType.prototype.typeName = "map";
    MapType.prototype.getValuesType = function() {
      return this.valuesType;
    };
    MapType.prototype.random = function() {
      var val = {};
      var i, l;
      for (i = 0, l = RANDOM.nextInt(10); i < l; i++) {
        val[RANDOM.nextString(RANDOM.nextInt(20))] = this.valuesType.random();
      }
      return val;
    };
    MapType.prototype._deref = function(schema, opts) {
      schema.values = this.valuesType._attrs(opts);
    };
    function ArrayType(schema, opts) {
      Type2.call(this);
      if (!schema.items) {
        throw new Error(f("missing array items: %j", schema));
      }
      this.itemsType = Type2.forSchema(schema.items, opts);
      this._branchConstructor = this._createBranchConstructor();
      Object.freeze(this);
    }
    util.inherits(ArrayType, Type2);
    ArrayType.prototype._check = function(val, flags, hook, path) {
      if (!Array.isArray(val)) {
        if (hook) {
          hook(val, this);
        }
        return false;
      }
      var items = this.itemsType;
      var b = true;
      var i, l, j;
      if (hook) {
        j = path.length;
        path.push("");
        for (i = 0, l = val.length; i < l; i++) {
          path[j] = "" + i;
          if (!items._check(val[i], flags, hook, path)) {
            b = false;
          }
        }
        path.pop();
      } else {
        for (i = 0, l = val.length; i < l; i++) {
          if (!items._check(val[i], flags)) {
            return false;
          }
        }
      }
      return b;
    };
    ArrayType.prototype._read = function(tap) {
      var items = this.itemsType;
      var i = 0;
      var val, n;
      while (n = tap.readLong()) {
        if (n < 0) {
          n = -n;
          tap.skipLong();
        }
        val = val || new Array(n);
        while (n--) {
          val[i++] = items._read(tap);
        }
      }
      return val || [];
    };
    ArrayType.prototype._skip = function(tap) {
      var items = this.itemsType;
      var len, n;
      while (n = tap.readLong()) {
        if (n < 0) {
          len = tap.readLong();
          tap.pos += len;
        } else {
          while (n--) {
            items._skip(tap);
          }
        }
      }
    };
    ArrayType.prototype._write = function(tap, val) {
      if (!Array.isArray(val)) {
        throwInvalidError(val, this);
      }
      var items = this.itemsType;
      var n = val.length;
      var i;
      if (n) {
        tap.writeLong(n);
        for (i = 0; i < n; i++) {
          items._write(tap, val[i]);
        }
      }
      tap.writeLong(0);
    };
    ArrayType.prototype._match = function(tap1, tap2) {
      var n1 = tap1.readLong();
      var n2 = tap2.readLong();
      var f2;
      while (n1 && n2) {
        f2 = this.itemsType._match(tap1, tap2);
        if (f2) {
          return f2;
        }
        if (!--n1) {
          n1 = readArraySize(tap1);
        }
        if (!--n2) {
          n2 = readArraySize(tap2);
        }
      }
      return utils.compare(n1, n2);
    };
    ArrayType.prototype._update = function(resolver, type2, opts) {
      if (type2.typeName === "array") {
        resolver.itemsType = this.itemsType.createResolver(type2.itemsType, opts);
        resolver._read = this._read;
      }
    };
    ArrayType.prototype._copy = function(val, opts) {
      if (!Array.isArray(val)) {
        throwInvalidError(val, this);
      }
      var items = new Array(val.length);
      var i, l;
      for (i = 0, l = val.length; i < l; i++) {
        items[i] = this.itemsType._copy(val[i], opts);
      }
      return items;
    };
    ArrayType.prototype._deref = function(schema, opts) {
      schema.items = this.itemsType._attrs(opts);
    };
    ArrayType.prototype.compare = function(val1, val2) {
      var n1 = val1.length;
      var n2 = val2.length;
      var i, l, f2;
      for (i = 0, l = Math.min(n1, n2); i < l; i++) {
        if (f2 = this.itemsType.compare(val1[i], val2[i])) {
          return f2;
        }
      }
      return utils.compare(n1, n2);
    };
    ArrayType.prototype.getItemsType = function() {
      return this.itemsType;
    };
    ArrayType.prototype.typeName = "array";
    ArrayType.prototype.random = function() {
      var arr = [];
      var i, l;
      for (i = 0, l = RANDOM.nextInt(10); i < l; i++) {
        arr.push(this.itemsType.random());
      }
      return arr;
    };
    function RecordType(schema, opts) {
      opts = opts || {};
      var namespace = opts.namespace;
      if (schema.namespace !== void 0) {
        opts.namespace = schema.namespace;
      } else if (schema.name) {
        var ns = utils.impliedNamespace(schema.name);
        if (ns !== void 0) {
          opts.namespace = ns;
        }
      }
      Type2.call(this, schema, opts);
      if (!Array.isArray(schema.fields)) {
        throw new Error(f("non-array record fields: %j", schema.fields));
      }
      if (utils.hasDuplicates(schema.fields, function(f2) {
        return f2.name;
      })) {
        throw new Error(f("duplicate field name: %j", schema.fields));
      }
      this._fieldsByName = {};
      this.fields = Object.freeze(schema.fields.map(function(f2) {
        var field = new Field(f2, opts);
        this._fieldsByName[field.name] = field;
        return field;
      }, this));
      this._branchConstructor = this._createBranchConstructor();
      this._isError = schema.type === "error";
      this.recordConstructor = this._createConstructor(
        opts.errorStackTraces,
        opts.omitRecordMethods
      );
      this._read = this._createReader();
      this._skip = this._createSkipper();
      this._write = this._createWriter();
      this._check = this._createChecker();
      opts.namespace = namespace;
      Object.freeze(this);
    }
    util.inherits(RecordType, Type2);
    RecordType.prototype._getConstructorName = function() {
      return this.name ? utils.capitalize(utils.unqualify(this.name)) : this._isError ? "Error$" : "Record$";
    };
    RecordType.prototype._createConstructor = function(errorStack, plainRecords) {
      var outerArgs = [];
      var innerArgs = [];
      var ds = [];
      var innerBody = "";
      var i, l, field, name, defaultValue, hasDefault, stackField;
      for (i = 0, l = this.fields.length; i < l; i++) {
        field = this.fields[i];
        defaultValue = field.defaultValue;
        hasDefault = defaultValue() !== void 0;
        name = field.name;
        if (errorStack && this._isError && name === "stack" && Type2.isType(field.type, "string") && !hasDefault) {
          stackField = field;
        }
        innerArgs.push("v" + i);
        innerBody += "  ";
        if (!hasDefault) {
          innerBody += "this." + name + " = v" + i + ";\n";
        } else {
          innerBody += "if (v" + i + " === undefined) { ";
          innerBody += "this." + name + " = d" + ds.length + "(); ";
          innerBody += "} else { this." + name + " = v" + i + "; }\n";
          outerArgs.push("d" + ds.length);
          ds.push(defaultValue);
        }
      }
      if (stackField) {
        innerBody += "  if (this.stack === undefined) { ";
        if (typeof Error.captureStackTrace == "function") {
          innerBody += "Error.captureStackTrace(this, this.constructor);";
        } else {
          innerBody += "this.stack = Error().stack;";
        }
        innerBody += " }\n";
      }
      var outerBody = "return function " + this._getConstructorName() + "(";
      outerBody += innerArgs.join() + ") {\n" + innerBody + "};";
      var Record = new Function(outerArgs.join(), outerBody).apply(void 0, ds);
      if (plainRecords) {
        return Record;
      }
      var self = this;
      Record.getType = function() {
        return self;
      };
      Record.type = self;
      if (this._isError) {
        util.inherits(Record, Error);
        Record.prototype.name = this._getConstructorName();
      }
      Record.prototype.clone = function(o) {
        return self.clone(this, o);
      };
      Record.prototype.compare = function(v) {
        return self.compare(this, v);
      };
      Record.prototype.isValid = function(o) {
        return self.isValid(this, o);
      };
      Record.prototype.toBuffer = function() {
        return self.toBuffer(this);
      };
      Record.prototype.toString = function() {
        return self.toString(this);
      };
      Record.prototype.wrap = function() {
        return self.wrap(this);
      };
      Record.prototype.wrapped = Record.prototype.wrap;
      return Record;
    };
    RecordType.prototype._createChecker = function() {
      var names = [];
      var values = [];
      var name = this._getConstructorName();
      var body = "return function check" + name + "(v, f, h, p) {\n";
      body += "  if (\n";
      body += "    v === null ||\n";
      body += "    typeof v != 'object' ||\n";
      body += "    (f && !this._checkFields(v))\n";
      body += "  ) {\n";
      body += "    if (h) { h(v, this); }\n";
      body += "    return false;\n";
      body += "  }\n";
      if (!this.fields.length) {
        body += "  return true;\n";
      } else {
        for (i = 0, l = this.fields.length; i < l; i++) {
          field = this.fields[i];
          names.push("t" + i);
          values.push(field.type);
          if (field.defaultValue() !== void 0) {
            body += "  var v" + i + " = v." + field.name + ";\n";
          }
        }
        body += "  if (h) {\n";
        body += "    var b = 1;\n";
        body += "    var j = p.length;\n";
        body += "    p.push('');\n";
        var i, l, field;
        for (i = 0, l = this.fields.length; i < l; i++) {
          field = this.fields[i];
          body += "    p[j] = '" + field.name + "';\n";
          body += "    b &= ";
          if (field.defaultValue() === void 0) {
            body += "t" + i + "._check(v." + field.name + ", f, h, p);\n";
          } else {
            body += "v" + i + " === undefined || ";
            body += "t" + i + "._check(v" + i + ", f, h, p);\n";
          }
        }
        body += "    p.pop();\n";
        body += "    return !!b;\n";
        body += "  } else {\n    return (\n      ";
        body += this.fields.map(function(field2, i2) {
          return field2.defaultValue() === void 0 ? "t" + i2 + "._check(v." + field2.name + ", f)" : "(v" + i2 + " === undefined || t" + i2 + "._check(v" + i2 + ", f))";
        }).join(" &&\n      ");
        body += "\n    );\n  }\n";
      }
      body += "};";
      return new Function(names.join(), body).apply(void 0, values);
    };
    RecordType.prototype._createReader = function() {
      var names = [];
      var values = [this.recordConstructor];
      var i, l;
      for (i = 0, l = this.fields.length; i < l; i++) {
        names.push("t" + i);
        values.push(this.fields[i].type);
      }
      var name = this._getConstructorName();
      var body = "return function read" + name + "(t) {\n";
      body += "  return new " + name + "(\n    ";
      body += names.map(function(s) {
        return s + "._read(t)";
      }).join(",\n    ");
      body += "\n  );\n};";
      names.unshift(name);
      return new Function(names.join(), body).apply(void 0, values);
    };
    RecordType.prototype._createSkipper = function() {
      var args = [];
      var body = "return function skip" + this._getConstructorName() + "(t) {\n";
      var values = [];
      var i, l;
      for (i = 0, l = this.fields.length; i < l; i++) {
        args.push("t" + i);
        values.push(this.fields[i].type);
        body += "  t" + i + "._skip(t);\n";
      }
      body += "}";
      return new Function(args.join(), body).apply(void 0, values);
    };
    RecordType.prototype._createWriter = function() {
      var args = [];
      var name = this._getConstructorName();
      var body = "return function write" + name + "(t, v) {\n";
      var values = [];
      var i, l, field, value;
      for (i = 0, l = this.fields.length; i < l; i++) {
        field = this.fields[i];
        args.push("t" + i);
        values.push(field.type);
        body += "  ";
        if (field.defaultValue() === void 0) {
          body += "t" + i + "._write(t, v." + field.name + ");\n";
        } else {
          value = field.type.toBuffer(field.defaultValue()).toString("binary");
          args.push("d" + i);
          values.push(value);
          body += "var v" + i + " = v." + field.name + ";\n";
          body += "if (v" + i + " === undefined) {\n";
          body += "    t.writeBinary(d" + i + ", " + value.length + ");\n";
          body += "  } else {\n    t" + i + "._write(t, v" + i + ");\n  }\n";
        }
      }
      body += "}";
      return new Function(args.join(), body).apply(void 0, values);
    };
    RecordType.prototype._update = function(resolver, type2, opts) {
      if (!hasCompatibleName(this, type2, !opts.ignoreNamespaces)) {
        throw new Error(f("no alias found for %s", type2.name));
      }
      var rFields = this.fields;
      var wFields = type2.fields;
      var wFieldsMap = utils.toMap(wFields, function(f2) {
        return f2.name;
      });
      var innerArgs = [];
      var resolvers = {};
      var i, j, field, name, names, matches, fieldResolver;
      for (i = 0; i < rFields.length; i++) {
        field = rFields[i];
        names = getAliases(field);
        matches = [];
        for (j = 0; j < names.length; j++) {
          name = names[j];
          if (wFieldsMap[name]) {
            matches.push(name);
          }
        }
        if (matches.length > 1) {
          throw new Error(
            f("ambiguous aliasing for %s.%s (%s)", type2.name, field.name, matches)
          );
        }
        if (!matches.length) {
          if (field.defaultValue() === void 0) {
            throw new Error(
              f("no matching field for default-less %s.%s", type2.name, field.name)
            );
          }
          innerArgs.push("undefined");
        } else {
          name = matches[0];
          fieldResolver = {
            resolver: field.type.createResolver(wFieldsMap[name].type, opts),
            name: "_" + field.name
            // Reader field name.
          };
          if (!resolvers[name]) {
            resolvers[name] = [fieldResolver];
          } else {
            resolvers[name].push(fieldResolver);
          }
          innerArgs.push(fieldResolver.name);
        }
      }
      var lazyIndex = -1;
      i = wFields.length;
      while (i && resolvers[wFields[--i].name] === void 0) {
        lazyIndex = i;
      }
      var uname = this._getConstructorName();
      var args = [uname];
      var values = [this.recordConstructor];
      var body = "  return function read" + uname + "(t, b) {\n";
      for (i = 0; i < wFields.length; i++) {
        if (i === lazyIndex) {
          body += "  if (!b) {\n";
        }
        field = type2.fields[i];
        name = field.name;
        if (resolvers[name] === void 0) {
          body += ~lazyIndex && i >= lazyIndex ? "    " : "  ";
          args.push("r" + i);
          values.push(field.type);
          body += "r" + i + "._skip(t);\n";
        } else {
          j = resolvers[name].length;
          while (j--) {
            body += ~lazyIndex && i >= lazyIndex ? "    " : "  ";
            args.push("r" + i + "f" + j);
            fieldResolver = resolvers[name][j];
            values.push(fieldResolver.resolver);
            body += "var " + fieldResolver.name + " = ";
            body += "r" + i + "f" + j + "._" + (j ? "peek" : "read") + "(t);\n";
          }
        }
      }
      if (~lazyIndex) {
        body += "  }\n";
      }
      body += "  return new " + uname + "(" + innerArgs.join() + ");\n};";
      resolver._read = new Function(args.join(), body).apply(void 0, values);
    };
    RecordType.prototype._match = function(tap1, tap2) {
      var fields = this.fields;
      var i, l, field, order, type2;
      for (i = 0, l = fields.length; i < l; i++) {
        field = fields[i];
        order = field._order;
        type2 = field.type;
        if (order) {
          order *= type2._match(tap1, tap2);
          if (order) {
            return order;
          }
        } else {
          type2._skip(tap1);
          type2._skip(tap2);
        }
      }
      return 0;
    };
    RecordType.prototype._checkFields = function(obj) {
      var keys = Object.keys(obj);
      var i, l;
      for (i = 0, l = keys.length; i < l; i++) {
        if (!this._fieldsByName[keys[i]]) {
          return false;
        }
      }
      return true;
    };
    RecordType.prototype._copy = function(val, opts) {
      var hook = opts && opts.fieldHook;
      var values = [void 0];
      var i, l, field, value;
      for (i = 0, l = this.fields.length; i < l; i++) {
        field = this.fields[i];
        value = val[field.name];
        if (value === void 0 && field.hasOwnProperty("defaultValue")) {
          value = field.defaultValue();
        }
        if (opts && !opts.skip || value !== void 0) {
          value = field.type._copy(value, opts);
        }
        if (hook) {
          value = hook(field, value, this);
        }
        values.push(value);
      }
      var Record = this.recordConstructor;
      return new (Record.bind.apply(Record, values))();
    };
    RecordType.prototype._deref = function(schema, opts) {
      schema.fields = this.fields.map(function(field) {
        var fieldType = field.type;
        var fieldSchema = {
          name: field.name,
          type: fieldType._attrs(opts)
        };
        if (opts.exportAttrs) {
          var val = field.defaultValue();
          if (val !== void 0) {
            fieldSchema["default"] = fieldType._copy(val, { coerce: 3, wrap: 3 });
          }
          var fieldOrder = field.order;
          if (fieldOrder !== "ascending") {
            fieldSchema.order = fieldOrder;
          }
          var fieldAliases = field.aliases;
          if (fieldAliases.length) {
            fieldSchema.aliases = fieldAliases;
          }
          var fieldDoc = field.doc;
          if (fieldDoc !== void 0) {
            fieldSchema.doc = fieldDoc;
          }
        }
        return fieldSchema;
      });
    };
    RecordType.prototype.compare = function(val1, val2) {
      var fields = this.fields;
      var i, l, field, name, order, type2;
      for (i = 0, l = fields.length; i < l; i++) {
        field = fields[i];
        name = field.name;
        order = field._order;
        type2 = field.type;
        if (order) {
          order *= type2.compare(val1[name], val2[name]);
          if (order) {
            return order;
          }
        }
      }
      return 0;
    };
    RecordType.prototype.random = function() {
      var fields = this.fields.map(function(f2) {
        return f2.type.random();
      });
      fields.unshift(void 0);
      var Record = this.recordConstructor;
      return new (Record.bind.apply(Record, fields))();
    };
    RecordType.prototype.field = function(name) {
      return this._fieldsByName[name];
    };
    RecordType.prototype.getField = RecordType.prototype.field;
    RecordType.prototype.getFields = function() {
      return this.fields;
    };
    RecordType.prototype.getRecordConstructor = function() {
      return this.recordConstructor;
    };
    Object.defineProperty(RecordType.prototype, "typeName", {
      enumerable: true,
      get: function() {
        return this._isError ? "error" : "record";
      }
    });
    function LogicalType(schema, opts) {
      this._logicalTypeName = schema.logicalType;
      Type2.call(this);
      LOGICAL_TYPE = this;
      try {
        this._underlyingType = Type2.forSchema(schema, opts);
      } finally {
        LOGICAL_TYPE = null;
        var l = UNDERLYING_TYPES.length;
        if (l && UNDERLYING_TYPES[l - 1][0] === this) {
          UNDERLYING_TYPES.pop();
        }
      }
      if (Type2.isType(this.underlyingType, "union")) {
        this._branchConstructor = this.underlyingType._branchConstructor;
      } else {
        this._branchConstructor = this.underlyingType._createBranchConstructor();
      }
    }
    util.inherits(LogicalType, Type2);
    Object.defineProperty(LogicalType.prototype, "typeName", {
      enumerable: true,
      get: function() {
        return "logical:" + this._logicalTypeName;
      }
    });
    Object.defineProperty(LogicalType.prototype, "underlyingType", {
      enumerable: true,
      get: function() {
        if (this._underlyingType) {
          return this._underlyingType;
        }
        var i, l, arr;
        for (i = 0, l = UNDERLYING_TYPES.length; i < l; i++) {
          arr = UNDERLYING_TYPES[i];
          if (arr[0] === this) {
            return arr[1];
          }
        }
      }
    });
    LogicalType.prototype.getUnderlyingType = function() {
      return this.underlyingType;
    };
    LogicalType.prototype._read = function(tap) {
      return this._fromValue(this.underlyingType._read(tap));
    };
    LogicalType.prototype._write = function(tap, any) {
      this.underlyingType._write(tap, this._toValue(any));
    };
    LogicalType.prototype._check = function(any, flags, hook, path) {
      try {
        var val = this._toValue(any);
      } catch (err) {
      }
      if (val === void 0) {
        if (hook) {
          hook(any, this);
        }
        return false;
      }
      return this.underlyingType._check(val, flags, hook, path);
    };
    LogicalType.prototype._copy = function(any, opts) {
      var type2 = this.underlyingType;
      switch (opts && opts.coerce) {
        case 3:
          return type2._copy(this._toValue(any), opts);
        case 2:
          return this._fromValue(type2._copy(any, opts));
        default:
          return this._fromValue(type2._copy(this._toValue(any), opts));
      }
    };
    LogicalType.prototype._update = function(resolver, type2, opts) {
      var _fromValue = this._resolve(type2, opts);
      if (_fromValue) {
        resolver._read = function(tap) {
          return _fromValue(type2._read(tap));
        };
      }
    };
    LogicalType.prototype.compare = function(obj1, obj2) {
      var val1 = this._toValue(obj1);
      var val2 = this._toValue(obj2);
      return this.underlyingType.compare(val1, val2);
    };
    LogicalType.prototype.random = function() {
      return this._fromValue(this.underlyingType.random());
    };
    LogicalType.prototype._deref = function(schema, opts) {
      var type2 = this.underlyingType;
      var isVisited = type2.name !== void 0 && opts.derefed[type2.name];
      schema = type2._attrs(opts);
      if (!isVisited && opts.exportAttrs) {
        if (typeof schema == "string") {
          schema = { type: schema };
        }
        schema.logicalType = this._logicalTypeName;
        this._export(schema);
      }
      return schema;
    };
    LogicalType.prototype._skip = function(tap) {
      this.underlyingType._skip(tap);
    };
    LogicalType.prototype._export = function() {
    };
    LogicalType.prototype._fromValue = utils.abstractFunction;
    LogicalType.prototype._toValue = utils.abstractFunction;
    LogicalType.prototype._resolve = utils.abstractFunction;
    function AbstractLongType(noUnpack) {
      this._concreteTypeName = "long";
      PrimitiveType.call(this, true);
      this._noUnpack = !!noUnpack;
    }
    util.inherits(AbstractLongType, LongType);
    AbstractLongType.prototype.typeName = "abstract:long";
    AbstractLongType.prototype._check = function(val, flags, hook) {
      var b = this._isValid(val);
      if (!b && hook) {
        hook(val, this);
      }
      return b;
    };
    AbstractLongType.prototype._read = function(tap) {
      var buf, pos;
      if (this._noUnpack) {
        pos = tap.pos;
        tap.skipLong();
        buf = tap.buf.slice(pos, tap.pos);
      } else {
        buf = tap.unpackLongBytes(tap);
      }
      if (tap.isValid()) {
        return this._fromBuffer(buf);
      }
    };
    AbstractLongType.prototype._write = function(tap, val) {
      if (!this._isValid(val)) {
        throwInvalidError(val, this);
      }
      var buf = this._toBuffer(val);
      if (this._noUnpack) {
        tap.writeFixed(buf);
      } else {
        tap.packLongBytes(buf);
      }
    };
    AbstractLongType.prototype._copy = function(val, opts) {
      switch (opts && opts.coerce) {
        case 3:
          return this._toJSON(val);
        case 2:
          return this._fromJSON(val);
        default:
          return this._fromJSON(this._toJSON(val));
      }
    };
    AbstractLongType.prototype._deref = function() {
      return "long";
    };
    AbstractLongType.prototype._update = function(resolver, type2) {
      var self = this;
      switch (type2.typeName) {
        case "int":
          resolver._read = function(tap) {
            return self._fromJSON(type2._read(tap));
          };
          break;
        case "abstract:long":
        case "long":
          resolver._read = function(tap) {
            return self._read(tap);
          };
      }
    };
    AbstractLongType.prototype.random = function() {
      return this._fromJSON(LongType.prototype.random());
    };
    AbstractLongType.prototype._fromBuffer = utils.abstractFunction;
    AbstractLongType.prototype._toBuffer = utils.abstractFunction;
    AbstractLongType.prototype._fromJSON = utils.abstractFunction;
    AbstractLongType.prototype._toJSON = utils.abstractFunction;
    AbstractLongType.prototype._isValid = utils.abstractFunction;
    AbstractLongType.prototype.compare = utils.abstractFunction;
    function Field(schema, opts) {
      var name = schema.name;
      if (typeof name != "string" || !utils.isValidName(name)) {
        throw new Error(f("invalid field name: %s", name));
      }
      this.name = name;
      this.type = Type2.forSchema(schema.type, opts);
      this.aliases = schema.aliases || [];
      this.doc = schema.doc !== void 0 ? "" + schema.doc : void 0;
      this._order = function(order) {
        switch (order) {
          case "ascending":
            return 1;
          case "descending":
            return -1;
          case "ignore":
            return 0;
          default:
            throw new Error(f("invalid order: %j", order));
        }
      }(schema.order === void 0 ? "ascending" : schema.order);
      var value = schema["default"];
      if (value !== void 0) {
        var type2 = this.type;
        var val;
        try {
          val = type2._copy(value, { coerce: 2, wrap: 2 });
        } catch (err) {
          var msg = f("incompatible field default %j (%s)", value, err.message);
          if (Type2.isType(type2, "union")) {
            msg += f(
              ", union defaults must match the first branch's type (%j)",
              type2.types[0]
            );
          }
          throw new Error(msg);
        }
        if (isPrimitive(type2.typeName) && type2.typeName !== "bytes") {
          this.defaultValue = function() {
            return val;
          };
        } else {
          this.defaultValue = function() {
            return type2._copy(val);
          };
        }
      }
      Object.freeze(this);
    }
    Field.prototype.defaultValue = function() {
    };
    Object.defineProperty(Field.prototype, "order", {
      enumerable: true,
      get: function() {
        return ["descending", "ignore", "ascending"][this._order + 1];
      }
    });
    Field.prototype.getAliases = function() {
      return this.aliases;
    };
    Field.prototype.getDefault = Field.prototype.defaultValue;
    Field.prototype.getName = function() {
      return this.name;
    };
    Field.prototype.getOrder = function() {
      return this.order;
    };
    Field.prototype.getType = function() {
      return this.type;
    };
    function Resolver(readerType) {
      this._readerType = readerType;
      this._read = null;
      this.itemsType = null;
      this.size = 0;
      this.symbols = null;
      this.valuesType = null;
    }
    Resolver.prototype._peek = Type2.prototype._peek;
    Resolver.prototype.inspect = function() {
      return "<Resolver>";
    };
    function Hash() {
      this.str = void 0;
    }
    function readValue(type2, tap, resolver, lazy) {
      if (resolver) {
        if (resolver._readerType !== type2) {
          throw new Error("invalid resolver");
        }
        return resolver._read(tap, lazy);
      } else {
        return type2._read(tap);
      }
    }
    function getAliases(obj) {
      var names = {};
      if (obj.name) {
        names[obj.name] = true;
      }
      var aliases = obj.aliases;
      var i, l;
      for (i = 0, l = aliases.length; i < l; i++) {
        names[aliases[i]] = true;
      }
      return Object.keys(names);
    }
    function hasCompatibleName(reader, writer, strict) {
      if (!writer.name) {
        return true;
      }
      var name = strict ? writer.name : utils.unqualify(writer.name);
      var aliases = getAliases(reader);
      var i, l, alias;
      for (i = 0, l = aliases.length; i < l; i++) {
        alias = aliases[i];
        if (!strict) {
          alias = utils.unqualify(alias);
        }
        if (alias === name) {
          return true;
        }
      }
      return false;
    }
    function isPrimitive(typeName) {
      var type2 = TYPES[typeName];
      return type2 && type2.prototype instanceof PrimitiveType;
    }
    function getClassName(typeName) {
      if (typeName === "error") {
        typeName = "record";
      } else {
        var match = /^([^:]+):(.*)$/.exec(typeName);
        if (match) {
          if (match[1] === "union") {
            typeName = match[2] + "Union";
          } else {
            typeName = match[1];
          }
        }
      }
      return utils.capitalize(typeName) + "Type";
    }
    function readArraySize(tap) {
      var n = tap.readLong();
      if (n < 0) {
        n = -n;
        tap.skipLong();
      }
      return n;
    }
    function isSafeLong(n) {
      return n >= -9007199254740990 && n <= 9007199254740990;
    }
    function isJsonBuffer(obj) {
      return obj && obj.type === "Buffer" && Array.isArray(obj.data);
    }
    function throwInvalidError(val, type2) {
      throw new Error(f("invalid %j: %j", type2.schema(), val));
    }
    function maybeQualify(name, ns) {
      var unqualified = utils.unqualify(name);
      return isPrimitive(unqualified) ? unqualified : utils.qualify(name, ns);
    }
    function getTypeBucket(type2) {
      var typeName = type2.typeName;
      switch (typeName) {
        case "double":
        case "float":
        case "int":
        case "long":
          return "number";
        case "bytes":
        case "fixed":
          return "buffer";
        case "enum":
          return "string";
        case "map":
        case "error":
        case "record":
          return "object";
        default:
          return typeName;
      }
    }
    function getValueBucket(val) {
      if (val === null) {
        return "null";
      }
      var bucket = typeof val;
      if (bucket === "object") {
        if (Array.isArray(val)) {
          return "array";
        } else if (Buffer2.isBuffer(val)) {
          return "buffer";
        }
      }
      return bucket;
    }
    function isAmbiguous(types) {
      var buckets = {};
      var i, l, bucket, type2;
      for (i = 0, l = types.length; i < l; i++) {
        type2 = types[i];
        if (!Type2.isType(type2, "logical")) {
          bucket = getTypeBucket(type2);
          if (buckets[bucket]) {
            return true;
          }
          buckets[bucket] = true;
        }
      }
      return false;
    }
    function combineNumbers(types) {
      var typeNames = ["int", "long", "float", "double"];
      var superIndex = -1;
      var superType = null;
      var i, l, type2, index;
      for (i = 0, l = types.length; i < l; i++) {
        type2 = types[i];
        index = typeNames.indexOf(type2.typeName);
        if (index > superIndex) {
          superIndex = index;
          superType = type2;
        }
      }
      return superType;
    }
    function combineStrings(types, opts) {
      var symbols = {};
      var i, l, type2, typeSymbols;
      for (i = 0, l = types.length; i < l; i++) {
        type2 = types[i];
        if (type2.typeName === "string") {
          return type2;
        }
        typeSymbols = type2.symbols;
        var j, m;
        for (j = 0, m = typeSymbols.length; j < m; j++) {
          symbols[typeSymbols[j]] = true;
        }
      }
      return Type2.forSchema({ type: "enum", symbols: Object.keys(symbols) }, opts);
    }
    function combineBuffers(types, opts) {
      var size = -1;
      var i, l, type2;
      for (i = 0, l = types.length; i < l; i++) {
        type2 = types[i];
        if (type2.typeName === "bytes") {
          return type2;
        }
        if (size === -1) {
          size = type2.size;
        } else if (type2.size !== size) {
          size = -2;
        }
      }
      return size < 0 ? Type2.forSchema("bytes", opts) : types[0];
    }
    function combineObjects(types, opts) {
      var allTypes = [];
      var fieldTypes = {};
      var fieldDefaults = {};
      var isValidRecord = true;
      var i, l, type2, fields;
      for (i = 0, l = types.length; i < l; i++) {
        type2 = types[i];
        if (type2.typeName === "map") {
          isValidRecord = false;
          allTypes.push(type2.valuesType);
        } else {
          fields = type2.fields;
          var j, m, field, fieldDefault, fieldName, fieldType;
          for (j = 0, m = fields.length; j < m; j++) {
            field = fields[j];
            fieldName = field.name;
            fieldType = field.type;
            allTypes.push(fieldType);
            if (isValidRecord) {
              if (!fieldTypes[fieldName]) {
                fieldTypes[fieldName] = [];
              }
              fieldTypes[fieldName].push(fieldType);
              fieldDefault = field.defaultValue();
              if (fieldDefault !== void 0) {
                fieldDefaults[fieldName] = fieldDefault;
              }
            }
          }
        }
      }
      if (isValidRecord) {
        var fieldNames = Object.keys(fieldTypes);
        for (i = 0, l = fieldNames.length; i < l; i++) {
          fieldName = fieldNames[i];
          if (fieldTypes[fieldName].length < types.length && fieldDefaults[fieldName] === void 0) {
            if (opts && opts.strictDefaults) {
              isValidRecord = false;
            } else {
              fieldTypes[fieldName].unshift(Type2.forSchema("null", opts));
              fieldDefaults[fieldName] = null;
            }
          }
        }
      }
      var schema;
      if (isValidRecord) {
        schema = {
          type: "record",
          fields: fieldNames.map(function(s) {
            var fieldType2 = Type2.forTypes(fieldTypes[s], opts);
            var fieldDefault2 = fieldDefaults[s];
            if (fieldDefault2 !== void 0 && ~fieldType2.typeName.indexOf("union")) {
              var unionTypes = fieldType2.types.slice();
              var i2, l2;
              for (i2 = 0, l2 = unionTypes.length; i2 < l2; i2++) {
                if (unionTypes[i2].isValid(fieldDefault2)) {
                  break;
                }
              }
              if (i2 > 0) {
                var unionType = unionTypes[0];
                unionTypes[0] = unionTypes[i2];
                unionTypes[i2] = unionType;
                fieldType2 = Type2.forSchema(unionTypes, opts);
              }
            }
            return {
              name: s,
              type: fieldType2,
              "default": fieldDefaults[s]
            };
          })
        };
      } else {
        schema = {
          type: "map",
          values: Type2.forTypes(allTypes, opts)
        };
      }
      return Type2.forSchema(schema, opts);
    }
    module.exports = {
      Type: Type2,
      getTypeBucket,
      getValueBucket,
      isPrimitive,
      builtins: function() {
        var types = {
          LogicalType,
          UnwrappedUnionType,
          WrappedUnionType
        };
        var typeNames = Object.keys(TYPES);
        var i, l, typeName;
        for (i = 0, l = typeNames.length; i < l; i++) {
          typeName = typeNames[i];
          types[getClassName(typeName)] = TYPES[typeName];
        }
        return types;
      }()
    };
  }
});
var require_containers = __commonJS({
  "node_modules/avsc/lib/containers.js"(exports, module) {
    "use strict";
    var types = require_types();
    var utils = require_utils();
    var buffer = __import_BUFFER;
    var stream = __import_STREAM;
    var util = __import_UTIL;
    var zlib = __import_ZLIB;
    var Buffer2 = buffer.Buffer;
    var OPTS = { namespace: "org.apache.avro.file" };
    var LONG_TYPE = types.Type.forSchema("long", OPTS);
    var MAP_BYTES_TYPE = types.Type.forSchema({ type: "map", values: "bytes" }, OPTS);
    var HEADER_TYPE = types.Type.forSchema({
      name: "Header",
      type: "record",
      fields: [
        { name: "magic", type: { type: "fixed", name: "Magic", size: 4 } },
        { name: "meta", type: MAP_BYTES_TYPE },
        { name: "sync", type: { type: "fixed", name: "Sync", size: 16 } }
      ]
    }, OPTS);
    var BLOCK_TYPE = types.Type.forSchema({
      name: "Block",
      type: "record",
      fields: [
        { name: "count", type: "long" },
        { name: "data", type: "bytes" },
        { name: "sync", type: "Sync" }
      ]
    }, OPTS);
    var MAGIC_BYTES = utils.bufferFrom("Obj");
    var f = util.format;
    var Tap = utils.Tap;
    function RawDecoder(schema, opts) {
      opts = opts || {};
      var noDecode = !!opts.noDecode;
      stream.Duplex.call(this, {
        readableObjectMode: !noDecode,
        allowHalfOpen: false
      });
      this._type = types.Type.forSchema(schema);
      this._tap = new Tap(utils.newBuffer(0));
      this._writeCb = null;
      this._needPush = false;
      this._readValue = createReader(noDecode, this._type);
      this._finished = false;
      this.on("finish", function() {
        this._finished = true;
        this._read();
      });
    }
    util.inherits(RawDecoder, stream.Duplex);
    RawDecoder.prototype._write = function(chunk, encoding, cb) {
      this._writeCb = cb;
      var tap = this._tap;
      tap.buf = Buffer2.concat([tap.buf.slice(tap.pos), chunk]);
      tap.pos = 0;
      if (this._needPush) {
        this._needPush = false;
        this._read();
      }
    };
    RawDecoder.prototype._read = function() {
      this._needPush = false;
      var tap = this._tap;
      var pos = tap.pos;
      var val = this._readValue(tap);
      if (tap.isValid()) {
        this.push(val);
      } else if (!this._finished) {
        tap.pos = pos;
        this._needPush = true;
        if (this._writeCb) {
          this._writeCb();
        }
      } else {
        this.push(null);
      }
    };
    function BlockDecoder(opts) {
      opts = opts || {};
      var noDecode = !!opts.noDecode;
      stream.Duplex.call(this, {
        allowHalfOpen: true,
        // For async decompressors.
        readableObjectMode: !noDecode
      });
      this._rType = opts.readerSchema !== void 0 ? types.Type.forSchema(opts.readerSchema) : void 0;
      this._wType = null;
      this._codecs = opts.codecs;
      this._codec = void 0;
      this._parseHook = opts.parseHook;
      this._tap = new Tap(utils.newBuffer(0));
      this._blockTap = new Tap(utils.newBuffer(0));
      this._syncMarker = null;
      this._readValue = null;
      this._noDecode = noDecode;
      this._queue = new utils.OrderedQueue();
      this._decompress = null;
      this._index = 0;
      this._remaining = void 0;
      this._needPush = false;
      this._finished = false;
      this.on("finish", function() {
        this._finished = true;
        if (this._needPush) {
          this._read();
        }
      });
    }
    util.inherits(BlockDecoder, stream.Duplex);
    BlockDecoder.defaultCodecs = function() {
      return {
        "null": function(buf, cb) {
          cb(null, buf);
        },
        "deflate": zlib.inflateRaw
      };
    };
    BlockDecoder.getDefaultCodecs = BlockDecoder.defaultCodecs;
    BlockDecoder.prototype._decodeHeader = function() {
      var tap = this._tap;
      if (tap.buf.length < MAGIC_BYTES.length) {
        return false;
      }
      if (!MAGIC_BYTES.equals(tap.buf.slice(0, MAGIC_BYTES.length))) {
        this.emit("error", new Error("invalid magic bytes"));
        return false;
      }
      var header = HEADER_TYPE._read(tap);
      if (!tap.isValid()) {
        return false;
      }
      this._codec = (header.meta["avro.codec"] || "null").toString();
      var codecs = this._codecs || BlockDecoder.getDefaultCodecs();
      this._decompress = codecs[this._codec];
      if (!this._decompress) {
        this.emit("error", new Error(f("unknown codec: %s", this._codec)));
        return;
      }
      try {
        var schema = JSON.parse(header.meta["avro.schema"].toString());
        if (this._parseHook) {
          schema = this._parseHook(schema);
        }
        this._wType = types.Type.forSchema(schema);
      } catch (err) {
        this.emit("error", err);
        return;
      }
      try {
        this._readValue = createReader(this._noDecode, this._wType, this._rType);
      } catch (err) {
        this.emit("error", err);
        return;
      }
      this._syncMarker = header.sync;
      this.emit("metadata", this._wType, this._codec, header);
      return true;
    };
    BlockDecoder.prototype._write = function(chunk, encoding, cb) {
      var tap = this._tap;
      tap.buf = Buffer2.concat([tap.buf, chunk]);
      tap.pos = 0;
      if (!this._decodeHeader()) {
        process.nextTick(cb);
        return;
      }
      this._write = this._writeChunk;
      this._write(utils.newBuffer(0), encoding, cb);
    };
    BlockDecoder.prototype._writeChunk = function(chunk, encoding, cb) {
      var tap = this._tap;
      tap.buf = Buffer2.concat([tap.buf.slice(tap.pos), chunk]);
      tap.pos = 0;
      var nBlocks = 1;
      var block;
      while (block = tryReadBlock(tap)) {
        if (!this._syncMarker.equals(block.sync)) {
          this.emit("error", new Error("invalid sync marker"));
          return;
        }
        nBlocks++;
        this._decompress(
          block.data,
          this._createBlockCallback(block.data.length, block.count, chunkCb)
        );
      }
      chunkCb();
      function chunkCb() {
        if (!--nBlocks) {
          cb();
        }
      }
    };
    BlockDecoder.prototype._createBlockCallback = function(size, count, cb) {
      var self = this;
      var index = this._index++;
      return function(cause, data) {
        if (cause) {
          var err = new Error(f("%s codec decompression error", self._codec));
          err.cause = cause;
          self.emit("error", err);
          cb();
        } else {
          self.emit("block", new BlockInfo(count, data.length, size));
          self._queue.push(new BlockData(index, data, cb, count));
          if (self._needPush) {
            self._read();
          }
        }
      };
    };
    BlockDecoder.prototype._read = function() {
      this._needPush = false;
      var tap = this._blockTap;
      if (!this._remaining) {
        var data = this._queue.pop();
        if (!data || !data.count) {
          if (this._finished) {
            this.push(null);
          } else {
            this._needPush = true;
          }
          if (data) {
            data.cb();
          }
          return;
        }
        data.cb();
        this._remaining = data.count;
        tap.buf = data.buf;
        tap.pos = 0;
      }
      this._remaining--;
      var val;
      try {
        val = this._readValue(tap);
        if (!tap.isValid()) {
          throw new Error("truncated block");
        }
      } catch (err) {
        this._remaining = 0;
        this.emit("error", err);
        return;
      }
      this.push(val);
    };
    function RawEncoder(schema, opts) {
      opts = opts || {};
      stream.Transform.call(this, {
        writableObjectMode: true,
        allowHalfOpen: false
      });
      this._type = types.Type.forSchema(schema);
      this._writeValue = function(tap, val) {
        try {
          this._type._write(tap, val);
        } catch (err) {
          this.emit("typeError", err, val, this._type);
        }
      };
      this._tap = new Tap(utils.newBuffer(opts.batchSize || 65536));
      this.on("typeError", function(err) {
        this.emit("error", err);
      });
    }
    util.inherits(RawEncoder, stream.Transform);
    RawEncoder.prototype._transform = function(val, encoding, cb) {
      var tap = this._tap;
      var buf = tap.buf;
      var pos = tap.pos;
      this._writeValue(tap, val);
      if (!tap.isValid()) {
        if (pos) {
          this.push(copyBuffer(tap.buf, 0, pos));
        }
        var len = tap.pos - pos;
        if (len > buf.length) {
          tap.buf = utils.newBuffer(2 * len);
        }
        tap.pos = 0;
        this._writeValue(tap, val);
      }
      cb();
    };
    RawEncoder.prototype._flush = function(cb) {
      var tap = this._tap;
      var pos = tap.pos;
      if (pos) {
        this.push(tap.buf.slice(0, pos));
      }
      cb();
    };
    function BlockEncoder(schema, opts) {
      opts = opts || {};
      stream.Duplex.call(this, {
        allowHalfOpen: true,
        // To support async compressors.
        writableObjectMode: true
      });
      var type2;
      if (types.Type.isType(schema)) {
        type2 = schema;
        schema = void 0;
      } else {
        type2 = types.Type.forSchema(schema);
      }
      this._schema = schema;
      this._type = type2;
      this._writeValue = function(tap, val) {
        try {
          this._type._write(tap, val);
        } catch (err) {
          this.emit("typeError", err, val, this._type);
          return false;
        }
        return true;
      };
      this._blockSize = opts.blockSize || 65536;
      this._tap = new Tap(utils.newBuffer(this._blockSize));
      this._codecs = opts.codecs;
      this._codec = opts.codec || "null";
      this._blockCount = 0;
      this._syncMarker = opts.syncMarker || new utils.Lcg().nextBuffer(16);
      this._queue = new utils.OrderedQueue();
      this._pending = 0;
      this._finished = false;
      this._needHeader = false;
      this._needPush = false;
      this._metadata = opts.metadata || {};
      if (!MAP_BYTES_TYPE.isValid(this._metadata)) {
        throw new Error("invalid metadata");
      }
      var codec = this._codec;
      this._compress = (this._codecs || BlockEncoder.getDefaultCodecs())[codec];
      if (!this._compress) {
        throw new Error(f("unsupported codec: %s", codec));
      }
      if (opts.omitHeader !== void 0) {
        opts.writeHeader = opts.omitHeader ? "never" : "auto";
      }
      switch (opts.writeHeader) {
        case false:
        case "never":
          break;
        case void 0:
        case "auto":
          this._needHeader = true;
          break;
        default:
          this._writeHeader();
      }
      this.on("finish", function() {
        this._finished = true;
        if (this._blockCount) {
          this._flushChunk();
        } else if (this._finished && this._needPush) {
          this.push(null);
        }
      });
      this.on("typeError", function(err) {
        this.emit("error", err);
      });
    }
    util.inherits(BlockEncoder, stream.Duplex);
    BlockEncoder.defaultCodecs = function() {
      return {
        "null": function(buf, cb) {
          cb(null, buf);
        },
        "deflate": zlib.deflateRaw
      };
    };
    BlockEncoder.getDefaultCodecs = BlockEncoder.defaultCodecs;
    BlockEncoder.prototype._writeHeader = function() {
      var schema = JSON.stringify(
        this._schema ? this._schema : this._type.getSchema({ exportAttrs: true })
      );
      var meta = utils.copyOwnProperties(
        this._metadata,
        { "avro.schema": utils.bufferFrom(schema), "avro.codec": utils.bufferFrom(this._codec) },
        true
        // Overwrite.
      );
      var Header = HEADER_TYPE.getRecordConstructor();
      var header = new Header(MAGIC_BYTES, meta, this._syncMarker);
      this.push(header.toBuffer());
    };
    BlockEncoder.prototype._write = function(val, encoding, cb) {
      if (this._needHeader) {
        this._writeHeader();
        this._needHeader = false;
      }
      var tap = this._tap;
      var pos = tap.pos;
      var flushing = false;
      if (this._writeValue(tap, val)) {
        if (!tap.isValid()) {
          if (pos) {
            this._flushChunk(pos, cb);
            flushing = true;
          }
          var len = tap.pos - pos;
          if (len > this._blockSize) {
            this._blockSize = len * 2;
          }
          tap.buf = utils.newBuffer(this._blockSize);
          tap.pos = 0;
          this._writeValue(tap, val);
        }
        this._blockCount++;
      } else {
        tap.pos = pos;
      }
      if (!flushing) {
        cb();
      }
    };
    BlockEncoder.prototype._flushChunk = function(pos, cb) {
      var tap = this._tap;
      pos = pos || tap.pos;
      this._compress(tap.buf.slice(0, pos), this._createBlockCallback(pos, cb));
      this._blockCount = 0;
    };
    BlockEncoder.prototype._read = function() {
      var self = this;
      var data = this._queue.pop();
      if (!data) {
        if (this._finished && !this._pending) {
          process.nextTick(function() {
            self.push(null);
          });
        } else {
          this._needPush = true;
        }
        return;
      }
      this.push(LONG_TYPE.toBuffer(data.count, true));
      this.push(LONG_TYPE.toBuffer(data.buf.length, true));
      this.push(data.buf);
      this.push(this._syncMarker);
      if (!this._finished) {
        data.cb();
      }
    };
    BlockEncoder.prototype._createBlockCallback = function(size, cb) {
      var self = this;
      var index = this._index++;
      var count = this._blockCount;
      this._pending++;
      return function(cause, data) {
        if (cause) {
          var err = new Error(f("%s codec compression error", self._codec));
          err.cause = cause;
          self.emit("error", err);
          return;
        }
        self._pending--;
        self.emit("block", new BlockInfo(count, size, data.length));
        self._queue.push(new BlockData(index, data, cb, count));
        if (self._needPush) {
          self._needPush = false;
          self._read();
        }
      };
    };
    function BlockInfo(count, raw, compressed) {
      this.valueCount = count;
      this.rawDataLength = raw;
      this.compressedDataLength = compressed;
    }
    function BlockData(index, buf, cb, count) {
      this.index = index;
      this.buf = buf;
      this.cb = cb;
      this.count = count | 0;
    }
    function tryReadBlock(tap) {
      var pos = tap.pos;
      var block = BLOCK_TYPE._read(tap);
      if (!tap.isValid()) {
        tap.pos = pos;
        return null;
      }
      return block;
    }
    function createReader(noDecode, writerType, readerType) {
      if (noDecode) {
        return /* @__PURE__ */ function(skipper) {
          return function(tap) {
            var pos = tap.pos;
            skipper(tap);
            return tap.buf.slice(pos, tap.pos);
          };
        }(writerType._skip);
      } else if (readerType) {
        var resolver = readerType.createResolver(writerType);
        return function(tap) {
          return resolver._read(tap);
        };
      } else {
        return function(tap) {
          return writerType._read(tap);
        };
      }
    }
    function copyBuffer(buf, pos, len) {
      var copy = utils.newBuffer(len);
      buf.copy(copy, 0, pos, pos + len);
      return copy;
    }
    module.exports = {
      BLOCK_TYPE,
      // For tests.
      HEADER_TYPE,
      // Idem.
      MAGIC_BYTES,
      // Idem.
      streams: {
        BlockDecoder,
        BlockEncoder,
        RawDecoder,
        RawEncoder
      }
    };
  }
});
var require_services = __commonJS({
  "node_modules/avsc/lib/services.js"(exports, module) {
    "use strict";
    var types = require_types();
    var utils = require_utils();
    var buffer = __import_BUFFER;
    var events = __import_EVENTS;
    var stream = __import_STREAM;
    var util = __import_UTIL;
    var Buffer2 = buffer.Buffer;
    var Tap = utils.Tap;
    var Type2 = types.Type;
    var debug = util.debuglog("avsc:services");
    var f = util.format;
    var OPTS = { namespace: "org.apache.avro.ipc" };
    var BOOLEAN_TYPE = Type2.forSchema("boolean", OPTS);
    var MAP_BYTES_TYPE = Type2.forSchema({ type: "map", values: "bytes" }, OPTS);
    var STRING_TYPE = Type2.forSchema("string", OPTS);
    var HANDSHAKE_REQUEST_TYPE = Type2.forSchema({
      name: "HandshakeRequest",
      type: "record",
      fields: [
        { name: "clientHash", type: { name: "MD5", type: "fixed", size: 16 } },
        { name: "clientProtocol", type: ["null", "string"], "default": null },
        { name: "serverHash", type: "MD5" },
        { name: "meta", type: ["null", MAP_BYTES_TYPE], "default": null }
      ]
    }, OPTS);
    var HANDSHAKE_RESPONSE_TYPE = Type2.forSchema({
      name: "HandshakeResponse",
      type: "record",
      fields: [
        {
          name: "match",
          type: {
            name: "HandshakeMatch",
            type: "enum",
            symbols: ["BOTH", "CLIENT", "NONE"]
          }
        },
        { name: "serverProtocol", type: ["null", "string"], "default": null },
        { name: "serverHash", type: ["null", "MD5"], "default": null },
        { name: "meta", type: ["null", MAP_BYTES_TYPE], "default": null }
      ]
    }, OPTS);
    var PREFIX_LENGTH = 16;
    var PING_MESSAGE = new Message(
      "",
      // Empty name (invalid for other "normal" messages).
      Type2.forSchema({ name: "PingRequest", type: "record", fields: [] }, OPTS),
      Type2.forSchema(["string"], OPTS),
      Type2.forSchema("null", OPTS)
    );
    function Message(name, reqType, errType, resType, oneWay, doc) {
      this.name = name;
      if (!Type2.isType(reqType, "record")) {
        throw new Error("invalid request type");
      }
      this.requestType = reqType;
      if (!Type2.isType(errType, "union") || !Type2.isType(errType.getTypes()[0], "string")) {
        throw new Error("invalid error type");
      }
      this.errorType = errType;
      if (oneWay) {
        if (!Type2.isType(resType, "null") || errType.getTypes().length > 1) {
          throw new Error("inapplicable one-way parameter");
        }
      }
      this.responseType = resType;
      this.oneWay = !!oneWay;
      this.doc = doc !== void 0 ? "" + doc : void 0;
      Object.freeze(this);
    }
    Message.forSchema = function(name, schema, opts) {
      opts = opts || {};
      if (!utils.isValidName(name)) {
        throw new Error(f("invalid message name: %s", name));
      }
      if (!Array.isArray(schema.request)) {
        throw new Error(f("invalid message request: %s", name));
      }
      var recordName = f("%s.%sRequest", OPTS.namespace, utils.capitalize(name));
      var reqType = Type2.forSchema({
        name: recordName,
        type: "record",
        namespace: opts.namespace || "",
        // Don't leak request namespace.
        fields: schema.request
      }, opts);
      delete opts.registry[recordName];
      if (!schema.response) {
        throw new Error(f("invalid message response: %s", name));
      }
      var resType = Type2.forSchema(schema.response, opts);
      if (schema.errors !== void 0 && !Array.isArray(schema.errors)) {
        throw new Error(f("invalid message errors: %s", name));
      }
      var errType = Type2.forSchema(["string"].concat(schema.errors || []), opts);
      var oneWay = !!schema["one-way"];
      return new Message(name, reqType, errType, resType, oneWay, schema.doc);
    };
    Message.prototype.schema = Type2.prototype.getSchema;
    Message.prototype._attrs = function(opts) {
      var reqSchema = this.requestType._attrs(opts);
      var schema = {
        request: reqSchema.fields,
        response: this.responseType._attrs(opts)
      };
      var msgDoc = this.doc;
      if (msgDoc !== void 0) {
        schema.doc = msgDoc;
      }
      var errSchema = this.errorType._attrs(opts);
      if (errSchema.length > 1) {
        schema.errors = errSchema.slice(1);
      }
      if (this.oneWay) {
        schema["one-way"] = true;
      }
      return schema;
    };
    utils.addDeprecatedGetters(
      Message,
      ["name", "errorType", "requestType", "responseType"]
    );
    Message.prototype.isOneWay = util.deprecate(
      function() {
        return this.oneWay;
      },
      "use `.oneWay` directly instead of `.isOneWay()`"
    );
    function Service(name, messages, types2, ptcl, server) {
      if (typeof name != "string") {
        return Service.forProtocol(name, messages);
      }
      this.name = name;
      this._messagesByName = messages || {};
      this.messages = Object.freeze(utils.objectValues(this._messagesByName));
      this._typesByName = types2 || {};
      this.types = Object.freeze(utils.objectValues(this._typesByName));
      this.protocol = ptcl;
      this._hashStr = utils.getHash(JSON.stringify(ptcl)).toString("binary");
      this.doc = ptcl.doc ? "" + ptcl.doc : void 0;
      this._server = server || this.createServer({ silent: true });
      Object.freeze(this);
    }
    Service.Client = Client;
    Service.Server = Server;
    Service.compatible = function(clientSvc, serverSvc) {
      try {
        createReaders(clientSvc, serverSvc);
      } catch (err) {
        return false;
      }
      return true;
    };
    Service.forProtocol = function(ptcl, opts) {
      opts = opts || {};
      var name = ptcl.protocol;
      if (!name) {
        throw new Error("missing protocol name");
      }
      if (ptcl.namespace !== void 0) {
        opts.namespace = ptcl.namespace;
      } else {
        var match = /^(.*)\.[^.]+$/.exec(name);
        if (match) {
          opts.namespace = match[1];
        }
      }
      name = utils.qualify(name, opts.namespace);
      if (ptcl.types) {
        ptcl.types.forEach(function(obj) {
          Type2.forSchema(obj, opts);
        });
      }
      var msgs;
      if (ptcl.messages) {
        msgs = {};
        Object.keys(ptcl.messages).forEach(function(key) {
          msgs[key] = Message.forSchema(key, ptcl.messages[key], opts);
        });
      }
      return new Service(name, msgs, opts.registry, ptcl);
    };
    Service.isService = function(any) {
      return !!any && any.hasOwnProperty("_hashStr");
    };
    Service.prototype.createClient = function(opts) {
      var client = new Client(this, opts);
      process.nextTick(function() {
        if (opts && opts.server) {
          var obj = { objectMode: true };
          var pts = [new stream.PassThrough(obj), new stream.PassThrough(obj)];
          opts.server.createChannel({ readable: pts[0], writable: pts[1] }, obj);
          client.createChannel({ readable: pts[1], writable: pts[0] }, obj);
        } else if (opts && opts.transport) {
          client.createChannel(opts.transport);
        }
      });
      return client;
    };
    Service.prototype.createServer = function(opts) {
      return new Server(this, opts);
    };
    Object.defineProperty(Service.prototype, "hash", {
      enumerable: true,
      get: function() {
        return utils.bufferFrom(this._hashStr, "binary");
      }
    });
    Service.prototype.message = function(name) {
      return this._messagesByName[name];
    };
    Service.prototype.type = function(name) {
      return this._typesByName[name];
    };
    Service.prototype.inspect = function() {
      return f("<Service %j>", this.name);
    };
    utils.addDeprecatedGetters(
      Service,
      ["message", "messages", "name", "type", "types"]
    );
    Service.prototype.createEmitter = util.deprecate(
      function(transport, opts) {
        opts = opts || {};
        var client = this.createClient({
          cache: opts.cache,
          buffering: false,
          strictTypes: opts.strictErrors,
          timeout: opts.timeout
        });
        var channel = client.createChannel(transport, opts);
        forwardErrors(client, channel);
        return channel;
      },
      "use `.createClient()` instead of `.createEmitter()`"
    );
    Service.prototype.createListener = util.deprecate(
      function(transport, opts) {
        if (opts && opts.strictErrors) {
          throw new Error("use `.createServer()` to support strict errors");
        }
        return this._server.createChannel(transport, opts);
      },
      "use `.createServer().createChannel()` instead of `.createListener()`"
    );
    Service.prototype.emit = util.deprecate(
      function(name, req, channel, cb) {
        if (!channel || !this.equals(channel.client._svc$)) {
          throw new Error("invalid emitter");
        }
        var client = channel.client;
        Client.prototype.emitMessage.call(client, name, req, cb && cb.bind(this));
        return channel.getPending();
      },
      "create a client via `.createClient()` to emit messages instead of `.emit()`"
    );
    Service.prototype.equals = util.deprecate(
      function(any) {
        return Service.isService(any) && this.getFingerprint().equals(any.getFingerprint());
      },
      "equality testing is deprecated, compare the `.protocol`s instead"
    );
    Service.prototype.getFingerprint = util.deprecate(
      function(algorithm) {
        return utils.getHash(JSON.stringify(this.protocol), algorithm);
      },
      "use `.hash` instead of `.getFingerprint()`"
    );
    Service.prototype.getSchema = util.deprecate(
      Type2.prototype.getSchema,
      "use `.protocol` instead of `.getSchema()`"
    );
    Service.prototype.on = util.deprecate(
      function(name, handler) {
        var self = this;
        this._server.onMessage(name, function(req, cb) {
          return handler.call(self, req, this.channel, cb);
        });
        return this;
      },
      "use `.createServer().onMessage()` instead of `.on()`"
    );
    Service.prototype.subprotocol = util.deprecate(
      function() {
        var parent = this._server;
        var opts = { strictTypes: parent._strict, cache: parent._cache };
        var server = new Server(parent.service, opts);
        server._handlers = Object.create(parent._handlers);
        return new Service(
          this.name,
          this._messagesByName,
          this._typesByName,
          this.protocol,
          server
        );
      },
      "`.subprotocol()` will be removed in 5.1"
    );
    Service.prototype._attrs = function(opts) {
      var ptcl = { protocol: this.name };
      var types2 = [];
      this.types.forEach(function(t) {
        if (t.getName() === void 0) {
          return;
        }
        var typeSchema = t._attrs(opts);
        if (typeof typeSchema != "string") {
          types2.push(typeSchema);
        }
      });
      if (types2.length) {
        ptcl.types = types2;
      }
      var msgNames = Object.keys(this._messagesByName);
      if (msgNames.length) {
        ptcl.messages = {};
        msgNames.forEach(function(name) {
          ptcl.messages[name] = this._messagesByName[name]._attrs(opts);
        }, this);
      }
      if (opts && opts.exportAttrs && this.doc !== void 0) {
        ptcl.doc = this.doc;
      }
      return ptcl;
    };
    function discoverProtocol(transport, opts, cb) {
      if (cb === void 0 && typeof opts == "function") {
        cb = opts;
        opts = void 0;
      }
      var svc = new Service({ protocol: "Empty" }, OPTS);
      var ptclStr;
      svc.createClient({ timeout: opts && opts.timeout }).createChannel(transport, {
        scope: opts && opts.scope,
        endWritable: typeof transport == "function"
        // Stateless transports only.
      }).once("handshake", function(hreq, hres) {
        ptclStr = hres.serverProtocol;
        this.destroy(true);
      }).once("eot", function(pending, err) {
        if (err && !/interrupted/.test(err)) {
          cb(err);
        } else {
          cb(null, JSON.parse(ptclStr));
        }
      });
    }
    function Client(svc, opts) {
      opts = opts || {};
      events.EventEmitter.call(this);
      this._svc$ = svc;
      this._channels$ = [];
      this._fns$ = [];
      this._buffering$ = !!opts.buffering;
      this._cache$ = opts.cache || {};
      this._policy$ = opts.channelPolicy;
      this._strict$ = !!opts.strictTypes;
      this._timeout$ = utils.getOption(opts, "timeout", 1e4);
      if (opts.remoteProtocols) {
        insertRemoteProtocols(this._cache$, opts.remoteProtocols, svc, true);
      }
      this._svc$.messages.forEach(function(msg) {
        this[msg.name] = this._createMessageHandler$(msg);
      }, this);
    }
    util.inherits(Client, events.EventEmitter);
    Client.prototype.activeChannels = function() {
      return this._channels$.slice();
    };
    Client.prototype.createChannel = function(transport, opts) {
      var objectMode = opts && opts.objectMode;
      var channel;
      if (typeof transport == "function") {
        var writableFactory;
        if (objectMode) {
          writableFactory = transport;
        } else {
          writableFactory = function(cb) {
            var encoder2 = new FrameEncoder();
            var writable2 = transport(function(err, readable2) {
              if (err) {
                cb(err);
                return;
              }
              var decoder2 = new FrameDecoder().once("error", function(err2) {
                channel.destroy(err2);
              });
              cb(null, readable2.pipe(decoder2));
            });
            if (writable2) {
              encoder2.pipe(writable2);
              return encoder2;
            }
          };
        }
        channel = new StatelessClientChannel(this, writableFactory, opts);
      } else {
        var readable, writable;
        if (isStream(transport)) {
          readable = writable = transport;
        } else {
          readable = transport.readable;
          writable = transport.writable;
        }
        if (!objectMode) {
          var decoder = new NettyDecoder();
          readable = readable.pipe(decoder);
          var encoder = new NettyEncoder();
          encoder.pipe(writable);
          writable = encoder;
        }
        channel = new StatefulClientChannel(this, readable, writable, opts);
        if (!objectMode) {
          channel.once("eot", function() {
            readable.unpipe(decoder);
            encoder.unpipe(writable);
          });
          decoder.once("error", function(err) {
            channel.destroy(err);
          });
        }
      }
      var channels = this._channels$;
      channels.push(channel);
      channel.once("_drain", function() {
        channels.splice(channels.indexOf(this), 1);
      });
      this._buffering$ = false;
      this.emit("channel", channel);
      return channel;
    };
    Client.prototype.destroyChannels = function(opts) {
      this._channels$.forEach(function(channel) {
        channel.destroy(opts && opts.noWait);
      });
    };
    Client.prototype.emitMessage = function(name, req, opts, cb) {
      var msg = getExistingMessage(this._svc$, name);
      var wreq = new WrappedRequest(msg, {}, req);
      this._emitMessage$(wreq, opts, cb);
    };
    Client.prototype.remoteProtocols = function() {
      return getRemoteProtocols(this._cache$, true);
    };
    Object.defineProperty(Client.prototype, "service", {
      enumerable: true,
      get: function() {
        return this._svc$;
      }
    });
    Client.prototype.use = function() {
      var i, l, fn;
      for (i = 0, l = arguments.length; i < l; i++) {
        fn = arguments[i];
        this._fns$.push(fn.length < 3 ? fn(this) : fn);
      }
      return this;
    };
    Client.prototype._emitMessage$ = function(wreq, opts, cb) {
      if (!cb && typeof opts === "function") {
        cb = opts;
        opts = void 0;
      }
      var self = this;
      var channels = this._channels$;
      var numChannels = channels.length;
      if (!numChannels) {
        if (this._buffering$) {
          debug("no active client channels, buffering call");
          this.once("channel", function() {
            this._emitMessage$(wreq, opts, cb);
          });
        } else {
          var err = new Error("no active channels");
          process.nextTick(function() {
            if (cb) {
              cb.call(new CallContext(wreq._msg), err);
            } else {
              self.emit("error", err);
            }
          });
        }
        return;
      }
      opts = opts || {};
      if (opts.timeout === void 0) {
        opts.timeout = this._timeout$;
      }
      var channel;
      if (numChannels === 1) {
        channel = channels[0];
      } else if (this._policy$) {
        channel = this._policy$(this._channels$.slice());
        if (!channel) {
          debug("policy returned no channel, skipping call");
          return;
        }
      } else {
        channel = channels[Math.floor(Math.random() * numChannels)];
      }
      channel._emit(wreq, opts, function(err2, wres) {
        var ctx = this;
        var errType = ctx.message.errorType;
        if (err2) {
          if (self._strict$) {
            err2 = errType.clone(err2.message, { wrapUnions: true });
          }
          done(err2);
          return;
        }
        if (!wres) {
          done();
          return;
        }
        err2 = wres.error;
        if (!self._strict$) {
          if (err2 === void 0) {
            err2 = null;
          } else {
            if (Type2.isType(errType, "union:unwrapped")) {
              if (typeof err2 == "string") {
                err2 = new Error(err2);
              }
            } else if (err2 && err2.string && typeof err2.string == "string") {
              err2 = new Error(err2.string);
            }
          }
        }
        done(err2, wres.response);
        function done(err3, res) {
          if (cb) {
            cb.call(ctx, err3, res);
          } else if (err3) {
            self.emit("error", err3);
          }
        }
      });
    };
    Client.prototype._createMessageHandler$ = function(msg) {
      var fields = msg.requestType.getFields();
      var names = fields.map(function(f2) {
        return f2.getName();
      });
      var body = "return function " + msg.name + "(";
      if (names.length) {
        body += names.join(", ") + ", ";
      }
      body += "opts, cb) {\n";
      body += "  var req = {";
      body += names.map(function(n) {
        return n + ": " + n;
      }).join(", ");
      body += "};\n";
      body += "  return this.emitMessage('" + msg.name + "', req, opts, cb);\n";
      body += "};";
      return new Function(body)();
    };
    function Server(svc, opts) {
      opts = opts || {};
      events.EventEmitter.call(this);
      this.service = svc;
      this._handlers = {};
      this._fns = [];
      this._channels = {};
      this._nextChannelId = 1;
      this._cache = opts.cache || {};
      this._defaultHandler = opts.defaultHandler;
      this._sysErrFormatter = opts.systemErrorFormatter;
      this._silent = !!opts.silent;
      this._strict = !!opts.strictTypes;
      if (opts.remoteProtocols) {
        insertRemoteProtocols(this._cache, opts.remoteProtocols, svc, false);
      }
      svc.messages.forEach(function(msg) {
        var name = msg.name;
        if (!opts.noCapitalize) {
          name = utils.capitalize(name);
        }
        this["on" + name] = this._createMessageHandler(msg);
      }, this);
    }
    util.inherits(Server, events.EventEmitter);
    Server.prototype.activeChannels = function() {
      return utils.objectValues(this._channels);
    };
    Server.prototype.createChannel = function(transport, opts) {
      var objectMode = opts && opts.objectMode;
      var channel;
      if (typeof transport == "function") {
        var readableFactory;
        if (objectMode) {
          readableFactory = transport;
        } else {
          readableFactory = function(cb) {
            var decoder2 = new FrameDecoder().once("error", function(err) {
              channel.destroy(err);
            });
            return transport(function(err, writable2) {
              if (err) {
                cb(err);
                return;
              }
              var encoder2 = new FrameEncoder();
              encoder2.pipe(writable2);
              cb(null, encoder2);
            }).pipe(decoder2);
          };
        }
        channel = new StatelessServerChannel(this, readableFactory, opts);
      } else {
        var readable, writable;
        if (isStream(transport)) {
          readable = writable = transport;
        } else {
          readable = transport.readable;
          writable = transport.writable;
        }
        if (!objectMode) {
          var decoder = new NettyDecoder();
          readable = readable.pipe(decoder);
          var encoder = new NettyEncoder();
          encoder.pipe(writable);
          writable = encoder;
        }
        channel = new StatefulServerChannel(this, readable, writable, opts);
        if (!objectMode) {
          channel.once("eot", function() {
            readable.unpipe(decoder);
            encoder.unpipe(writable);
          });
          decoder.once("error", function(err) {
            channel.destroy(err);
          });
        }
      }
      if (!this.listeners("error").length) {
        this.on("error", this._onError);
      }
      var channelId = this._nextChannelId++;
      var channels = this._channels;
      channels[channelId] = channel.once("eot", function() {
        delete channels[channelId];
      });
      this.emit("channel", channel);
      return channel;
    };
    Server.prototype.onMessage = function(name, handler) {
      getExistingMessage(this.service, name);
      this._handlers[name] = handler;
      return this;
    };
    Server.prototype.remoteProtocols = function() {
      return getRemoteProtocols(this._cache, false);
    };
    Server.prototype.use = function() {
      var i, l, fn;
      for (i = 0, l = arguments.length; i < l; i++) {
        fn = arguments[i];
        this._fns.push(fn.length < 3 ? fn(this) : fn);
      }
      return this;
    };
    Server.prototype._createMessageHandler = function(msg) {
      var name = msg.name;
      var fields = msg.requestType.fields;
      var numArgs = fields.length;
      var args = fields.length ? ", " + fields.map(function(f2) {
        return "req." + f2.name;
      }).join(", ") : "";
      var body = "return function (handler) {\n";
      body += "  if (handler.length > " + numArgs + ") {\n";
      body += "    return this.onMessage('" + name + "', function (req, cb) {\n";
      body += "      return handler.call(this" + args + ", cb);\n";
      body += "    });\n";
      body += "  } else {\n";
      body += "    return this.onMessage('" + name + "', function (req) {\n";
      body += "      return handler.call(this" + args + ");\n";
      body += "    });\n";
      body += "  }\n";
      body += "};\n";
      return new Function(body)();
    };
    Server.prototype._onError = function(err) {
      if (!this._silent && err.rpcCode !== "UNKNOWN_PROTOCOL") {
        console.error();
        if (err.rpcCode) {
          console.error(err.rpcCode);
          console.error(err.cause);
        } else {
          console.error("INTERNAL_SERVER_ERROR");
          console.error(err);
        }
      }
    };
    function ClientChannel(client, opts) {
      opts = opts || {};
      events.EventEmitter.call(this);
      this.client = client;
      this.timeout = utils.getOption(opts, "timeout", client._timeout$);
      this._endWritable = !!utils.getOption(opts, "endWritable", true);
      this._prefix = normalizedPrefix(opts.scope);
      var cache = client._cache$;
      var clientSvc = client._svc$;
      var hash = opts.serverHash;
      if (!hash) {
        hash = clientSvc.hash;
      }
      var adapter = cache[hash];
      if (!adapter) {
        hash = clientSvc.hash;
        adapter = cache[hash] = new Adapter(clientSvc, clientSvc, hash);
      }
      this._adapter = adapter;
      this._registry = new Registry(this, PREFIX_LENGTH);
      this.pending = 0;
      this.destroyed = false;
      this.draining = false;
      this.once("_eot", function(pending, err) {
        debug("client channel EOT");
        this.destroyed = true;
        this.emit("eot", pending, err);
      });
    }
    util.inherits(ClientChannel, events.EventEmitter);
    ClientChannel.prototype.destroy = function(noWait) {
      debug("destroying client channel");
      if (!this.draining) {
        this.draining = true;
        this.emit("_drain");
      }
      var registry = this._registry;
      var pending = this.pending;
      if (noWait) {
        registry.clear();
      }
      if (noWait || !pending) {
        if (isError(noWait)) {
          debug("fatal client channel error: %s", noWait);
          this.emit("_eot", pending, noWait);
        } else {
          this.emit("_eot", pending);
        }
      } else {
        debug("client channel entering drain mode (%s pending)", pending);
      }
    };
    ClientChannel.prototype.ping = function(timeout, cb) {
      if (!cb && typeof timeout == "function") {
        cb = timeout;
        timeout = void 0;
      }
      var self = this;
      var wreq = new WrappedRequest(PING_MESSAGE);
      this._emit(wreq, { timeout }, function(err) {
        if (cb) {
          cb.call(self, err);
        } else if (err) {
          self.destroy(err);
        }
      });
    };
    ClientChannel.prototype._createHandshakeRequest = function(adapter, noSvc) {
      var svc = this.client._svc$;
      return {
        clientHash: svc.hash,
        clientProtocol: noSvc ? null : JSON.stringify(svc.protocol),
        serverHash: adapter._hash
      };
    };
    ClientChannel.prototype._emit = function(wreq, opts, cb) {
      var msg = wreq._msg;
      var wres = msg.oneWay ? void 0 : new WrappedResponse(msg, {});
      var ctx = new CallContext(msg, this);
      var self = this;
      this.pending++;
      process.nextTick(function() {
        if (!msg.name) {
          onTransition(wreq, wres, onCompletion);
        } else {
          self.emit("outgoingCall", ctx, opts);
          var fns = self.client._fns$;
          debug("starting client middleware chain (%s middleware)", fns.length);
          chainMiddleware({
            fns,
            ctx,
            wreq,
            wres,
            onTransition,
            onCompletion,
            onError
          });
        }
      });
      function onTransition(wreq2, wres2, prev) {
        var err, reqBuf;
        if (self.destroyed) {
          err = new Error("channel destroyed");
        } else {
          try {
            reqBuf = wreq2.toBuffer();
          } catch (cause) {
            err = serializationError(
              f("invalid %j request", msg.name),
              wreq2,
              [
                { name: "headers", type: MAP_BYTES_TYPE },
                { name: "request", type: msg.requestType }
              ]
            );
          }
        }
        if (err) {
          prev(err);
          return;
        }
        var timeout = opts && opts.timeout !== void 0 ? opts.timeout : self.timeout;
        var id = self._registry.add(timeout, function(err2, resBuf, adapter) {
          if (!err2 && !msg.oneWay) {
            try {
              adapter._decodeResponse(resBuf, wres2, msg);
            } catch (cause) {
              err2 = cause;
            }
          }
          prev(err2);
        });
        id |= self._prefix;
        debug("sending message %s", id);
        self._send(id, reqBuf, !!msg && msg.oneWay);
      }
      function onCompletion(err) {
        self.pending--;
        cb.call(ctx, err, wres);
        if (self.draining && !self.destroyed && !self.pending) {
          self.destroy();
        }
      }
      function onError(err) {
        self.client.emit("error", err, self);
      }
    };
    ClientChannel.prototype._getAdapter = function(hres) {
      var hash = hres.serverHash;
      var cache = this.client._cache$;
      var adapter = cache[hash];
      if (adapter) {
        return adapter;
      }
      var ptcl = JSON.parse(hres.serverProtocol);
      var serverSvc = Service.forProtocol(ptcl);
      adapter = new Adapter(this.client._svc$, serverSvc, hash, true);
      return cache[hash] = adapter;
    };
    ClientChannel.prototype._matchesPrefix = function(id) {
      return matchesPrefix(id, this._prefix);
    };
    ClientChannel.prototype._send = utils.abstractFunction;
    utils.addDeprecatedGetters(ClientChannel, ["pending", "timeout"]);
    ClientChannel.prototype.getCache = util.deprecate(
      function() {
        return this.client._cache$;
      },
      "use `.remoteProtocols()` instead of `.getCache()`"
    );
    ClientChannel.prototype.getProtocol = util.deprecate(
      function() {
        return this.client._svc$;
      },
      "use `.service` instead or `.getProtocol()`"
    );
    ClientChannel.prototype.isDestroyed = util.deprecate(
      function() {
        return this.destroyed;
      },
      "use `.destroyed` instead of `.isDestroyed`"
    );
    function StatelessClientChannel(client, writableFactory, opts) {
      ClientChannel.call(this, client, opts);
      this._writableFactory = writableFactory;
      if (!opts || !opts.noPing) {
        debug("emitting ping request");
        this.ping();
      }
    }
    util.inherits(StatelessClientChannel, ClientChannel);
    StatelessClientChannel.prototype._send = function(id, reqBuf) {
      var cb = this._registry.get(id);
      var adapter = this._adapter;
      var self = this;
      process.nextTick(emit);
      return true;
      function emit(retry) {
        if (self.destroyed) {
          return;
        }
        var hreq = self._createHandshakeRequest(adapter, !retry);
        var writable = self._writableFactory.call(self, function(err, readable) {
          if (err) {
            cb(err);
            return;
          }
          readable.on("data", function(obj) {
            debug("received response %s", obj.id);
            var buf = Buffer2.concat(obj.payload);
            try {
              var parts = readHead(HANDSHAKE_RESPONSE_TYPE, buf);
              var hres = parts.head;
              if (hres.serverHash) {
                adapter = self._getAdapter(hres);
              }
            } catch (cause) {
              cb(cause);
              return;
            }
            var match = hres.match;
            debug("handshake match: %s", match);
            self.emit("handshake", hreq, hres);
            if (match === "NONE") {
              process.nextTick(function() {
                emit(true);
              });
            } else {
              self._adapter = adapter;
              cb(null, parts.tail, adapter);
            }
          });
        });
        if (!writable) {
          cb(new Error("invalid writable stream"));
          return;
        }
        writable.write({
          id,
          payload: [HANDSHAKE_REQUEST_TYPE.toBuffer(hreq), reqBuf]
        });
        if (self._endWritable) {
          writable.end();
        }
      }
    };
    function StatefulClientChannel(client, readable, writable, opts) {
      ClientChannel.call(this, client, opts);
      this._readable = readable;
      this._writable = writable;
      this._connected = !!(opts && opts.noPing);
      this._readable.on("end", onEnd);
      this._writable.on("finish", onFinish);
      var self = this;
      var timer = null;
      this.once("eot", function() {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        if (!self._connected) {
          self.emit("_ready");
        }
        this._writable.removeListener("finish", onFinish);
        if (this._endWritable) {
          debug("ending transport");
          this._writable.end();
        }
        this._readable.removeListener("data", onPing).removeListener("data", onMessage).removeListener("end", onEnd);
      });
      var hreq;
      if (this._connected) {
        this._readable.on("data", onMessage);
      } else {
        this._readable.on("data", onPing);
        process.nextTick(ping);
        if (self.timeout) {
          timer = setTimeout(function() {
            self.destroy(new Error("timeout"));
          }, self.timeout);
        }
      }
      function ping(retry) {
        if (self.destroyed) {
          return;
        }
        hreq = self._createHandshakeRequest(self._adapter, !retry);
        var payload = [
          HANDSHAKE_REQUEST_TYPE.toBuffer(hreq),
          utils.bufferFrom([0, 0])
          // No header, no data (empty message name).
        ];
        self._writable.write({ id: self._prefix, payload });
      }
      function onPing(obj) {
        if (!self._matchesPrefix(obj.id)) {
          debug("discarding unscoped response %s (still connecting)", obj.id);
          return;
        }
        var buf = Buffer2.concat(obj.payload);
        try {
          var hres = readHead(HANDSHAKE_RESPONSE_TYPE, buf).head;
          if (hres.serverHash) {
            self._adapter = self._getAdapter(hres);
          }
        } catch (cause) {
          self.destroy(cause);
          return;
        }
        var match = hres.match;
        debug("handshake match: %s", match);
        self.emit("handshake", hreq, hres);
        if (match === "NONE") {
          process.nextTick(function() {
            ping(true);
          });
        } else {
          debug("successfully connected");
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
          self._readable.removeListener("data", onPing).on("data", onMessage);
          self._connected = true;
          self.emit("_ready");
          hreq = null;
        }
      }
      function onMessage(obj) {
        var id = obj.id;
        if (!self._matchesPrefix(id)) {
          debug("discarding unscoped message %s", id);
          return;
        }
        var cb = self._registry.get(id);
        if (cb) {
          process.nextTick(function() {
            debug("received message %s", id);
            cb(null, Buffer2.concat(obj.payload), self._adapter);
          });
        }
      }
      function onEnd() {
        self.destroy(true);
      }
      function onFinish() {
        self.destroy();
      }
    }
    util.inherits(StatefulClientChannel, ClientChannel);
    StatefulClientChannel.prototype._emit = function() {
      if (this._connected || this.draining) {
        ClientChannel.prototype._emit.apply(this, arguments);
      } else {
        debug("queuing request");
        var args = [];
        var i, l;
        for (i = 0, l = arguments.length; i < l; i++) {
          args.push(arguments[i]);
        }
        this.once("_ready", function() {
          this._emit.apply(this, args);
        });
      }
    };
    StatefulClientChannel.prototype._send = function(id, reqBuf, oneWay) {
      if (oneWay) {
        var self = this;
        process.nextTick(function() {
          self._registry.get(id)(null, utils.bufferFrom([0, 0, 0]), self._adapter);
        });
      }
      return this._writable.write({ id, payload: [reqBuf] });
    };
    function ServerChannel(server, opts) {
      opts = opts || {};
      events.EventEmitter.call(this);
      this.server = server;
      this._endWritable = !!utils.getOption(opts, "endWritable", true);
      this._prefix = normalizedPrefix(opts.scope);
      var cache = server._cache;
      var svc = server.service;
      var hash = svc.hash;
      if (!cache[hash]) {
        cache[hash] = new Adapter(svc, svc, hash);
      }
      this._adapter = null;
      this.destroyed = false;
      this.draining = false;
      this.pending = 0;
      this.once("_eot", function(pending, err) {
        debug("server channel EOT");
        this.emit("eot", pending, err);
      });
    }
    util.inherits(ServerChannel, events.EventEmitter);
    ServerChannel.prototype.destroy = function(noWait) {
      if (!this.draining) {
        this.draining = true;
        this.emit("_drain");
      }
      if (noWait || !this.pending) {
        this.destroyed = true;
        if (isError(noWait)) {
          debug("fatal server channel error: %s", noWait);
          this.emit("_eot", this.pending, noWait);
        } else {
          this.emit("_eot", this.pending);
        }
      }
    };
    ServerChannel.prototype._createHandshakeResponse = function(err, hreq) {
      var svc = this.server.service;
      var buf = svc.hash;
      var serverMatch = hreq && hreq.serverHash.equals(buf);
      return {
        match: err ? "NONE" : serverMatch ? "BOTH" : "CLIENT",
        serverProtocol: serverMatch ? null : JSON.stringify(svc.protocol),
        serverHash: serverMatch ? null : buf
      };
    };
    ServerChannel.prototype._getAdapter = function(hreq) {
      var hash = hreq.clientHash;
      var adapter = this.server._cache[hash];
      if (adapter) {
        return adapter;
      }
      if (!hreq.clientProtocol) {
        throw toRpcError("UNKNOWN_PROTOCOL");
      }
      var ptcl = JSON.parse(hreq.clientProtocol);
      var clientSvc = Service.forProtocol(ptcl);
      adapter = new Adapter(clientSvc, this.server.service, hash, true);
      return this.server._cache[hash] = adapter;
    };
    ServerChannel.prototype._matchesPrefix = function(id) {
      return matchesPrefix(id, this._prefix);
    };
    ServerChannel.prototype._receive = function(reqBuf, adapter, cb) {
      var self = this;
      var wreq;
      try {
        wreq = adapter._decodeRequest(reqBuf);
      } catch (cause) {
        cb(self._encodeSystemError(toRpcError("INVALID_REQUEST", cause)));
        return;
      }
      var msg = wreq._msg;
      var wres = new WrappedResponse(msg, {});
      if (!msg.name) {
        wres.response = null;
        cb(wres.toBuffer(), false);
        return;
      }
      var ctx = new CallContext(msg, this);
      self.emit("incomingCall", ctx);
      var fns = this.server._fns;
      debug("starting server middleware chain (%s middleware)", fns.length);
      self.pending++;
      chainMiddleware({
        fns,
        ctx,
        wreq,
        wres,
        onTransition,
        onCompletion,
        onError
      });
      function onTransition(wreq2, wres2, prev) {
        var handler = self.server._handlers[msg.name];
        if (!handler) {
          var defaultHandler = self.server._defaultHandler;
          if (defaultHandler) {
            defaultHandler.call(ctx, wreq2, wres2, prev);
          } else {
            var cause = new Error(f("no handler for %s", msg.name));
            prev(toRpcError("NOT_IMPLEMENTED", cause));
          }
        } else {
          var pending = !msg.oneWay;
          try {
            if (pending) {
              handler.call(ctx, wreq2.request, function(err, res) {
                pending = false;
                wres2.error = err;
                wres2.response = res;
                prev();
              });
            } else {
              handler.call(ctx, wreq2.request);
              prev();
            }
          } catch (err) {
            if (pending) {
              pending = false;
              prev(err);
            } else {
              onError(err);
            }
          }
        }
      }
      function onCompletion(err) {
        self.pending--;
        var server = self.server;
        var resBuf;
        if (!err) {
          var resErr = wres.error;
          var isStrict = server._strict;
          if (!isStrict) {
            if (isError(resErr)) {
              wres.error = msg.errorType.clone(resErr.message, { wrapUnions: true });
            } else if (resErr === null) {
              resErr = wres.error = void 0;
            }
            if (resErr === void 0 && wres.response === void 0 && msg.responseType.isValid(null)) {
              wres.response = null;
            }
          }
          try {
            resBuf = wres.toBuffer();
          } catch (cause) {
            if (wres.error !== void 0) {
              err = serializationError(
                f("invalid %j error", msg.name),
                // Sic.
                wres,
                [
                  { name: "headers", type: MAP_BYTES_TYPE },
                  { name: "error", type: msg.errorType }
                ]
              );
            } else {
              err = serializationError(
                f("invalid %j response", msg.name),
                wres,
                [
                  { name: "headers", type: MAP_BYTES_TYPE },
                  { name: "response", type: msg.responseType }
                ]
              );
            }
          }
        }
        if (!resBuf) {
          resBuf = self._encodeSystemError(err, wres.headers);
        } else if (resErr !== void 0) {
          server.emit("error", toRpcError("APPLICATION_ERROR", resErr));
        }
        cb(resBuf, msg.oneWay);
        if (self.draining && !self.pending) {
          self.destroy();
        }
      }
      function onError(err) {
        self.server.emit("error", err, self);
      }
    };
    utils.addDeprecatedGetters(ServerChannel, ["pending"]);
    ServerChannel.prototype.getCache = util.deprecate(
      function() {
        return this.server._cache;
      },
      "use `.remoteProtocols()` instead of `.getCache()`"
    );
    ServerChannel.prototype.getProtocol = util.deprecate(
      function() {
        return this.server.service;
      },
      "use `.service` instead of `.getProtocol()`"
    );
    ServerChannel.prototype.isDestroyed = util.deprecate(
      function() {
        return this.destroyed;
      },
      "use `.destroyed` instead of `.isDestroyed`"
    );
    ServerChannel.prototype._encodeSystemError = function(err, header) {
      var server = this.server;
      server.emit("error", err, this);
      var errStr;
      if (server._sysErrFormatter) {
        errStr = server._sysErrFormatter.call(this, err);
      } else if (err.rpcCode) {
        errStr = err.message;
      }
      var hdrBuf;
      if (header) {
        try {
          hdrBuf = MAP_BYTES_TYPE.toBuffer(header);
        } catch (cause) {
          server.emit("error", cause, this);
        }
      }
      return Buffer2.concat([
        hdrBuf || utils.bufferFrom([0]),
        utils.bufferFrom([1, 0]),
        // Error flag and first union index.
        STRING_TYPE.toBuffer(errStr || "internal server error")
      ]);
    };
    function StatelessServerChannel(server, readableFactory, opts) {
      ServerChannel.call(this, server, opts);
      this._writable = void 0;
      var self = this;
      var readable;
      process.nextTick(function() {
        readable = readableFactory.call(self, function(err, writable) {
          process.nextTick(function() {
            if (err) {
              onFinish(err);
              return;
            }
            self._writable = writable.on("finish", onFinish);
            self.emit("_writable");
          });
        }).on("data", onRequest).on("end", onEnd);
      });
      function onRequest(obj) {
        var id = obj.id;
        var buf = Buffer2.concat(obj.payload);
        var err;
        try {
          var parts = readHead(HANDSHAKE_REQUEST_TYPE, buf);
          var hreq = parts.head;
          var adapter = self._getAdapter(hreq);
        } catch (cause) {
          err = toRpcError("INVALID_HANDSHAKE_REQUEST", cause);
        }
        var hres = self._createHandshakeResponse(err, hreq);
        self.emit("handshake", hreq, hres);
        if (err) {
          done(self._encodeSystemError(err));
        } else {
          self._receive(parts.tail, adapter, done);
        }
        function done(resBuf) {
          if (!self.destroyed) {
            if (!self._writable) {
              self.once("_writable", function() {
                done(resBuf);
              });
              return;
            }
            self._writable.write({
              id,
              payload: [HANDSHAKE_RESPONSE_TYPE.toBuffer(hres), resBuf]
            });
          }
          if (self._writable && self._endWritable) {
            self._writable.end();
          }
        }
      }
      function onEnd() {
        self.destroy();
      }
      function onFinish(err) {
        readable.removeListener("data", onRequest).removeListener("end", onEnd);
        self.destroy(err || true);
      }
    }
    util.inherits(StatelessServerChannel, ServerChannel);
    function StatefulServerChannel(server, readable, writable, opts) {
      ServerChannel.call(this, server, opts);
      this._adapter = void 0;
      this._writable = writable.on("finish", onFinish);
      this._readable = readable.on("data", onHandshake).on("end", onEnd);
      this.once("_drain", function() {
        this._readable.removeListener("data", onHandshake).removeListener("data", onRequest).removeListener("end", onEnd);
      }).once("eot", function() {
        this._writable.removeListener("finish", onFinish);
        if (this._endWritable) {
          this._writable.end();
        }
      });
      var self = this;
      function onHandshake(obj) {
        var id = obj.id;
        if (!self._matchesPrefix(id)) {
          return;
        }
        var buf = Buffer2.concat(obj.payload);
        var err;
        try {
          var parts = readHead(HANDSHAKE_REQUEST_TYPE, buf);
          var hreq = parts.head;
          self._adapter = self._getAdapter(hreq);
        } catch (cause) {
          err = toRpcError("INVALID_HANDSHAKE_REQUEST", cause);
        }
        var hres = self._createHandshakeResponse(err, hreq);
        self.emit("handshake", hreq, hres);
        if (err) {
          done(self._encodeSystemError(err));
        } else {
          self._readable.removeListener("data", onHandshake).on("data", onRequest);
          self._receive(parts.tail, self._adapter, done);
        }
        function done(resBuf) {
          if (self.destroyed) {
            return;
          }
          self._writable.write({
            id,
            payload: [HANDSHAKE_RESPONSE_TYPE.toBuffer(hres), resBuf]
          });
        }
      }
      function onRequest(obj) {
        var id = obj.id;
        if (!self._matchesPrefix(id)) {
          return;
        }
        var reqBuf = Buffer2.concat(obj.payload);
        self._receive(reqBuf, self._adapter, function(resBuf, oneWay) {
          if (self.destroyed || oneWay) {
            return;
          }
          self._writable.write({ id, payload: [resBuf] });
        });
      }
      function onEnd() {
        self.destroy();
      }
      function onFinish() {
        self.destroy(true);
      }
    }
    util.inherits(StatefulServerChannel, ServerChannel);
    function WrappedRequest(msg, hdrs, req) {
      this._msg = msg;
      this.headers = hdrs || {};
      this.request = req || {};
    }
    WrappedRequest.prototype.toBuffer = function() {
      var msg = this._msg;
      return Buffer2.concat([
        MAP_BYTES_TYPE.toBuffer(this.headers),
        STRING_TYPE.toBuffer(msg.name),
        msg.requestType.toBuffer(this.request)
      ]);
    };
    function WrappedResponse(msg, hdr, err, res) {
      this._msg = msg;
      this.headers = hdr;
      this.error = err;
      this.response = res;
    }
    WrappedResponse.prototype.toBuffer = function() {
      var hdr = MAP_BYTES_TYPE.toBuffer(this.headers);
      var hasError = this.error !== void 0;
      return Buffer2.concat([
        hdr,
        BOOLEAN_TYPE.toBuffer(hasError),
        hasError ? this._msg.errorType.toBuffer(this.error) : this._msg.responseType.toBuffer(this.response)
      ]);
    };
    function CallContext(msg, channel) {
      this.channel = channel;
      this.locals = {};
      this.message = msg;
      Object.freeze(this);
    }
    function Registry(ctx, prefixLength) {
      this._ctx = ctx;
      this._mask = ~0 >>> (prefixLength | 0);
      this._id = 0;
      this._n = 0;
      this._cbs = {};
    }
    Registry.prototype.get = function(id) {
      return this._cbs[id & this._mask];
    };
    Registry.prototype.add = function(timeout, fn) {
      this._id = this._id + 1 & this._mask;
      var self = this;
      var id = this._id;
      var timer;
      if (timeout > 0) {
        timer = setTimeout(function() {
          cb(new Error("timeout"));
        }, timeout);
      }
      this._cbs[id] = cb;
      this._n++;
      return id;
      function cb() {
        if (!self._cbs[id]) {
          return;
        }
        delete self._cbs[id];
        self._n--;
        if (timer) {
          clearTimeout(timer);
        }
        fn.apply(self._ctx, arguments);
      }
    };
    Registry.prototype.clear = function() {
      Object.keys(this._cbs).forEach(function(id) {
        this._cbs[id](new Error("interrupted"));
      }, this);
    };
    function Adapter(clientSvc, serverSvc, hash, isRemote) {
      this._clientSvc = clientSvc;
      this._serverSvc = serverSvc;
      this._hash = hash;
      this._isRemote = !!isRemote;
      this._readers = createReaders(clientSvc, serverSvc);
    }
    Adapter.prototype._decodeRequest = function(buf) {
      var tap = new Tap(buf);
      var hdr = MAP_BYTES_TYPE._read(tap);
      var name = STRING_TYPE._read(tap);
      var msg, req;
      if (name) {
        msg = this._serverSvc.message(name);
        req = this._readers[name + "?"]._read(tap);
      } else {
        msg = PING_MESSAGE;
      }
      if (!tap.isValid()) {
        throw new Error(f("truncated %s request", name || "ping$"));
      }
      return new WrappedRequest(msg, hdr, req);
    };
    Adapter.prototype._decodeResponse = function(buf, wres, msg) {
      var tap = new Tap(buf);
      utils.copyOwnProperties(MAP_BYTES_TYPE._read(tap), wres.headers, true);
      var isError2 = BOOLEAN_TYPE._read(tap);
      var name = msg.name;
      if (name) {
        var reader = this._readers[name + (isError2 ? "*" : "!")];
        msg = this._clientSvc.message(name);
        if (isError2) {
          wres.error = reader._read(tap);
        } else {
          wres.response = reader._read(tap);
        }
        if (!tap.isValid()) {
          throw new Error(f("truncated %s response", name));
        }
      } else {
        msg = PING_MESSAGE;
      }
    };
    function FrameDecoder() {
      stream.Transform.call(this, { readableObjectMode: true });
      this._id = void 0;
      this._buf = utils.newBuffer(0);
      this._bufs = [];
      this.on("finish", function() {
        this.push(null);
      });
    }
    util.inherits(FrameDecoder, stream.Transform);
    FrameDecoder.prototype._transform = function(buf, encoding, cb) {
      buf = Buffer2.concat([this._buf, buf]);
      var frameLength;
      while (buf.length >= 4 && buf.length >= (frameLength = buf.readInt32BE(0)) + 4) {
        if (frameLength) {
          this._bufs.push(buf.slice(4, frameLength + 4));
        } else {
          var bufs = this._bufs;
          this._bufs = [];
          this.push({ id: null, payload: bufs });
        }
        buf = buf.slice(frameLength + 4);
      }
      this._buf = buf;
      cb();
    };
    FrameDecoder.prototype._flush = function(cb) {
      if (this._buf.length || this._bufs.length) {
        var bufs = this._bufs.slice();
        bufs.unshift(this._buf);
        var err = toRpcError("TRAILING_DATA");
        err.trailingData = Buffer2.concat(bufs).toString();
        this.emit("error", err);
      }
      cb();
    };
    function FrameEncoder() {
      stream.Transform.call(this, { writableObjectMode: true });
      this.on("finish", function() {
        this.push(null);
      });
    }
    util.inherits(FrameEncoder, stream.Transform);
    FrameEncoder.prototype._transform = function(obj, encoding, cb) {
      var bufs = obj.payload;
      var i, l, buf;
      for (i = 0, l = bufs.length; i < l; i++) {
        buf = bufs[i];
        this.push(intBuffer(buf.length));
        this.push(buf);
      }
      this.push(intBuffer(0));
      cb();
    };
    function NettyDecoder() {
      stream.Transform.call(this, { readableObjectMode: true });
      this._id = void 0;
      this._frameCount = 0;
      this._buf = utils.newBuffer(0);
      this._bufs = [];
      this.on("finish", function() {
        this.push(null);
      });
    }
    util.inherits(NettyDecoder, stream.Transform);
    NettyDecoder.prototype._transform = function(buf, encoding, cb) {
      buf = Buffer2.concat([this._buf, buf]);
      while (true) {
        if (this._id === void 0) {
          if (buf.length < 8) {
            this._buf = buf;
            cb();
            return;
          }
          this._id = buf.readInt32BE(0);
          this._frameCount = buf.readInt32BE(4);
          buf = buf.slice(8);
        }
        var frameLength;
        while (this._frameCount && buf.length >= 4 && buf.length >= (frameLength = buf.readInt32BE(0)) + 4) {
          this._frameCount--;
          this._bufs.push(buf.slice(4, frameLength + 4));
          buf = buf.slice(frameLength + 4);
        }
        if (this._frameCount) {
          this._buf = buf;
          cb();
          return;
        } else {
          var obj = { id: this._id, payload: this._bufs };
          this._bufs = [];
          this._id = void 0;
          this.push(obj);
        }
      }
    };
    NettyDecoder.prototype._flush = FrameDecoder.prototype._flush;
    function NettyEncoder() {
      stream.Transform.call(this, { writableObjectMode: true });
      this.on("finish", function() {
        this.push(null);
      });
    }
    util.inherits(NettyEncoder, stream.Transform);
    NettyEncoder.prototype._transform = function(obj, encoding, cb) {
      var bufs = obj.payload;
      var l = bufs.length;
      var buf;
      buf = utils.newBuffer(8);
      buf.writeInt32BE(obj.id, 0);
      buf.writeInt32BE(l, 4);
      this.push(buf);
      var i;
      for (i = 0; i < l; i++) {
        buf = bufs[i];
        this.push(intBuffer(buf.length));
        this.push(buf);
      }
      cb();
    };
    function intBuffer(n) {
      var buf = utils.newBuffer(4);
      buf.writeInt32BE(n);
      return buf;
    }
    function readHead(type2, buf) {
      var tap = new Tap(buf);
      var head = type2._read(tap);
      if (!tap.isValid()) {
        throw new Error(f("truncated %j", type2.schema()));
      }
      return { head, tail: tap.buf.slice(tap.pos) };
    }
    function createReader(rtype, wtype) {
      return rtype.equals(wtype) ? rtype : rtype.createResolver(wtype);
    }
    function createReaders(clientSvc, serverSvc) {
      var obj = {};
      clientSvc.messages.forEach(function(c) {
        var n = c.name;
        var s = serverSvc.message(n);
        try {
          if (!s) {
            throw new Error(f("missing server message: %s", n));
          }
          if (s.oneWay !== c.oneWay) {
            throw new Error(f("inconsistent one-way message: %s", n));
          }
          obj[n + "?"] = createReader(s.requestType, c.requestType);
          obj[n + "*"] = createReader(c.errorType, s.errorType);
          obj[n + "!"] = createReader(c.responseType, s.responseType);
        } catch (cause) {
          throw toRpcError("INCOMPATIBLE_PROTOCOL", cause);
        }
      });
      return obj;
    }
    function insertRemoteProtocols(cache, ptcls, svc, isClient) {
      Object.keys(ptcls).forEach(function(hash) {
        var ptcl = ptcls[hash];
        var clientSvc, serverSvc;
        if (isClient) {
          clientSvc = svc;
          serverSvc = Service.forProtocol(ptcl);
        } else {
          clientSvc = Service.forProtocol(ptcl);
          serverSvc = svc;
        }
        cache[hash] = new Adapter(clientSvc, serverSvc, hash, true);
      });
    }
    function getRemoteProtocols(cache, isClient) {
      var ptcls = {};
      Object.keys(cache).forEach(function(hs) {
        var adapter = cache[hs];
        if (adapter._isRemote) {
          var svc = isClient ? adapter._serverSvc : adapter._clientSvc;
          ptcls[hs] = svc.protocol;
        }
      });
      return ptcls;
    }
    function isError(any) {
      return !!any && Object.prototype.toString.call(any) === "[object Error]";
    }
    function forwardErrors(src, dst) {
      return src.on("error", function(err) {
        dst.emit("error", err, src);
      });
    }
    function toError(msg, cause) {
      var err = new Error(msg);
      err.cause = cause;
      return err;
    }
    function toRpcError(rpcCode, cause) {
      var err = toError(rpcCode.toLowerCase().replace(/_/g, " "), cause);
      err.rpcCode = cause && cause.rpcCode ? cause.rpcCode : rpcCode;
      return err;
    }
    function serializationError(msg, obj, fields) {
      var details = [];
      var i, l, field;
      for (i = 0, l = fields.length; i < l; i++) {
        field = fields[i];
        field.type.isValid(obj[field.name], { errorHook });
      }
      var detailsStr = details.map(function(obj2) {
        return f("%s = %j but expected %s", obj2.path, obj2.value, obj2.type);
      }).join(", ");
      var err = new Error(f("%s (%s)", msg, detailsStr));
      err.details = details;
      return err;
      function errorHook(parts, any, type2) {
        var strs = [];
        var i2, l2, part;
        for (i2 = 0, l2 = parts.length; i2 < l2; i2++) {
          part = parts[i2];
          if (isNaN(part)) {
            strs.push("." + part);
          } else {
            strs.push("[" + part + "]");
          }
        }
        details.push({
          path: field.name + strs.join(""),
          value: any,
          type: type2
        });
      }
    }
    function normalizedPrefix(scope) {
      return scope ? utils.getHash(scope).readInt16BE(0) << 32 - PREFIX_LENGTH : 0;
    }
    function matchesPrefix(id, prefix) {
      return (id ^ prefix) >> 32 - PREFIX_LENGTH === 0;
    }
    function isStream(any) {
      return !!(any && any.pipe);
    }
    function getExistingMessage(svc, name) {
      var msg = svc.message(name);
      if (!msg) {
        throw new Error(f("unknown message: %s", name));
      }
      return msg;
    }
    function chainMiddleware(params) {
      var args = [params.wreq, params.wres];
      var cbs = [];
      var cause;
      forward(0);
      function forward(pos) {
        var isDone = false;
        if (pos < params.fns.length) {
          params.fns[pos].apply(params.ctx, args.concat(function(err, cb) {
            if (isDone) {
              params.onError(toError("duplicate forward middleware call", err));
              return;
            }
            isDone = true;
            if (err || params.wres && // Non one-way messages.
            (params.wres.error !== void 0 || params.wres.response !== void 0)) {
              cause = err;
              backward();
              return;
            }
            if (cb) {
              cbs.push(cb);
            }
            forward(++pos);
          }));
        } else {
          params.onTransition.apply(params.ctx, args.concat(function(err) {
            if (isDone) {
              params.onError(toError("duplicate handler call", err));
              return;
            }
            isDone = true;
            cause = err;
            process.nextTick(backward);
          }));
        }
      }
      function backward() {
        var cb = cbs.pop();
        if (cb) {
          var isDone = false;
          cb.call(params.ctx, cause, function(err) {
            if (isDone) {
              params.onError(toError("duplicate backward middleware call", err));
              return;
            }
            cause = err;
            isDone = true;
            backward();
          });
        } else {
          params.onCompletion.call(params.ctx, cause);
        }
      }
    }
    module.exports = {
      Adapter,
      HANDSHAKE_REQUEST_TYPE,
      HANDSHAKE_RESPONSE_TYPE,
      Message,
      Registry,
      Service,
      discoverProtocol,
      streams: {
        FrameDecoder,
        FrameEncoder,
        NettyDecoder,
        NettyEncoder
      }
    };
  }
});
var require_files = __commonJS({
  "node_modules/avsc/lib/files.js"(exports, module) {
    "use strict";
    var fs = __require2("fs");
    var path = __import_PATH;
    function createImportHook() {
      var imports = {};
      return function(fpath, kind, cb) {
        fpath = path.resolve(fpath);
        if (imports[fpath]) {
          process.nextTick(cb);
          return;
        }
        imports[fpath] = true;
        fs.readFile(fpath, { encoding: "utf8" }, cb);
      };
    }
    function createSyncImportHook() {
      var imports = {};
      return function(fpath, kind, cb) {
        fpath = path.resolve(fpath);
        if (imports[fpath]) {
          cb();
        } else {
          imports[fpath] = true;
          cb(null, fs.readFileSync(fpath, { encoding: "utf8" }));
        }
      };
    }
    module.exports = {
      createImportHook,
      createSyncImportHook,
      // Proxy a few methods to better shim them for browserify.
      existsSync: fs.existsSync,
      readFileSync: fs.readFileSync
    };
  }
});
var require_specs = __commonJS({
  "node_modules/avsc/lib/specs.js"(exports, module) {
    "use strict";
    var files = require_files();
    var utils = require_utils();
    var path = __import_PATH;
    var util = __import_UTIL;
    var f = util.format;
    var TYPE_REFS = {
      date: { type: "int", logicalType: "date" },
      decimal: { type: "bytes", logicalType: "decimal" },
      time_ms: { type: "long", logicalType: "time-millis" },
      timestamp_ms: { type: "long", logicalType: "timestamp-millis" }
    };
    function assembleProtocol(fpath, opts, cb) {
      if (!cb && typeof opts == "function") {
        cb = opts;
        opts = void 0;
      }
      opts = opts || {};
      if (!opts.importHook) {
        opts.importHook = files.createImportHook();
      }
      importFile(fpath, function(err, protocol) {
        if (err) {
          cb(err);
          return;
        }
        if (!protocol) {
          cb(new Error("empty root import"));
          return;
        }
        var schemas = protocol.types;
        if (schemas) {
          var namespace = protocolNamespace(protocol) || "";
          schemas.forEach(function(schema) {
            if (schema.namespace === namespace) {
              delete schema.namespace;
            }
          });
        }
        cb(null, protocol);
      });
      function importFile(fpath2, cb2) {
        opts.importHook(fpath2, "idl", function(err, str) {
          if (err) {
            cb2(err);
            return;
          }
          if (str === void 0) {
            cb2();
            return;
          }
          try {
            var reader = new Reader(str, opts);
            var obj = reader._readProtocol(str, opts);
          } catch (err2) {
            err2.path = fpath2;
            cb2(err2);
            return;
          }
          fetchImports(obj.protocol, obj.imports, path.dirname(fpath2), cb2);
        });
      }
      function fetchImports(protocol, imports, dpath, cb2) {
        var importedProtocols = [];
        next();
        function next() {
          var info = imports.shift();
          if (!info) {
            importedProtocols.reverse();
            try {
              importedProtocols.forEach(function(imported) {
                mergeImport(protocol, imported);
              });
            } catch (err) {
              cb2(err);
              return;
            }
            cb2(null, protocol);
            return;
          }
          var importPath = path.join(dpath, info.name);
          if (info.kind === "idl") {
            importFile(importPath, function(err, imported) {
              if (err) {
                cb2(err);
                return;
              }
              if (imported) {
                importedProtocols.push(imported);
              }
              next();
            });
          } else {
            opts.importHook(importPath, info.kind, function(err, str) {
              if (err) {
                cb2(err);
                return;
              }
              switch (info.kind) {
                case "protocol":
                case "schema":
                  if (str === void 0) {
                    next();
                    return;
                  }
                  try {
                    var obj = JSON.parse(str);
                  } catch (err2) {
                    err2.path = importPath;
                    cb2(err2);
                    return;
                  }
                  var imported = info.kind === "schema" ? { types: [obj] } : obj;
                  importedProtocols.push(imported);
                  next();
                  return;
                default:
                  cb2(new Error(f("invalid import kind: %s", info.kind)));
              }
            });
          }
        }
      }
      function mergeImport(protocol, imported) {
        var schemas = imported.types || [];
        schemas.reverse();
        schemas.forEach(function(schema) {
          if (!protocol.types) {
            protocol.types = [];
          }
          if (schema.namespace === void 0) {
            schema.namespace = protocolNamespace(imported) || "";
          }
          protocol.types.unshift(schema);
        });
        Object.keys(imported.messages || {}).forEach(function(name) {
          if (!protocol.messages) {
            protocol.messages = {};
          }
          if (protocol.messages[name]) {
            throw new Error(f("duplicate message: %s", name));
          }
          protocol.messages[name] = imported.messages[name];
        });
      }
    }
    function read(str) {
      var schema;
      if (typeof str == "string" && ~str.indexOf(path.sep) && files.existsSync(str)) {
        var contents = files.readFileSync(str, { encoding: "utf8" });
        try {
          return JSON.parse(contents);
        } catch (err) {
          var opts = { importHook: files.createSyncImportHook() };
          assembleProtocol(str, opts, function(err2, protocolSchema) {
            schema = err2 ? contents : protocolSchema;
          });
        }
      } else {
        schema = str;
      }
      if (typeof schema != "string" || schema === "null") {
        return schema;
      }
      try {
        return JSON.parse(schema);
      } catch (err) {
        try {
          return Reader.readProtocol(schema);
        } catch (err2) {
          try {
            return Reader.readSchema(schema);
          } catch (err3) {
            return schema;
          }
        }
      }
    }
    function Reader(str, opts) {
      opts = opts || {};
      this._tk = new Tokenizer(str);
      this._ackVoidMessages = !!opts.ackVoidMessages;
      this._implicitTags = !opts.delimitedCollections;
      this._typeRefs = opts.typeRefs || TYPE_REFS;
    }
    Reader.readProtocol = function(str, opts) {
      var reader = new Reader(str, opts);
      var protocol = reader._readProtocol();
      if (protocol.imports.length) {
        throw new Error("unresolvable import");
      }
      return protocol.protocol;
    };
    Reader.readSchema = function(str, opts) {
      var reader = new Reader(str, opts);
      var doc = reader._readJavadoc();
      var schema = reader._readType(doc === void 0 ? {} : { doc }, true);
      reader._tk.next({ id: "(eof)" });
      return schema;
    };
    Reader.prototype._readProtocol = function() {
      var tk = this._tk;
      var imports = [];
      var types = [];
      var messages = {};
      var pos;
      this._readImports(imports);
      var protocolSchema = {};
      var protocolJavadoc = this._readJavadoc();
      if (protocolJavadoc !== void 0) {
        protocolSchema.doc = protocolJavadoc;
      }
      this._readAnnotations(protocolSchema);
      tk.next({ val: "protocol" });
      if (!tk.next({ val: "{", silent: true })) {
        protocolSchema.protocol = tk.next({ id: "name" }).val;
        tk.next({ val: "{" });
      }
      while (!tk.next({ val: "}", silent: true })) {
        if (!this._readImports(imports)) {
          var javadoc = this._readJavadoc();
          var typeSchema = this._readType({}, true);
          var numImports = this._readImports(imports, true);
          var message = void 0;
          pos = tk.pos;
          if (!numImports && (message = this._readMessage(typeSchema))) {
            if (javadoc !== void 0 && message.schema.doc === void 0) {
              message.schema.doc = javadoc;
            }
            var oneWay = false;
            if (message.schema.response === "void" || message.schema.response.type === "void") {
              oneWay = !this._ackVoidMessages && !message.schema.errors;
              if (message.schema.response === "void") {
                message.schema.response = "null";
              } else {
                message.schema.response.type = "null";
              }
            }
            if (oneWay) {
              message.schema["one-way"] = true;
            }
            if (messages[message.name]) {
              throw new Error(f("duplicate message: %s", message.name));
            }
            messages[message.name] = message.schema;
          } else {
            if (javadoc) {
              if (typeof typeSchema == "string") {
                typeSchema = { doc: javadoc, type: typeSchema };
              } else if (typeSchema.doc === void 0) {
                typeSchema.doc = javadoc;
              }
            }
            types.push(typeSchema);
            tk.pos = pos;
            tk.next({ val: ";", silent: true });
          }
          javadoc = void 0;
        }
      }
      tk.next({ id: "(eof)" });
      if (types.length) {
        protocolSchema.types = types;
      }
      if (Object.keys(messages).length) {
        protocolSchema.messages = messages;
      }
      return { protocol: protocolSchema, imports };
    };
    Reader.prototype._readAnnotations = function(schema) {
      var tk = this._tk;
      while (tk.next({ val: "@", silent: true })) {
        var parts = [];
        while (!tk.next({ val: "(", silent: true })) {
          parts.push(tk.next().val);
        }
        schema[parts.join("")] = tk.next({ id: "json" }).val;
        tk.next({ val: ")" });
      }
    };
    Reader.prototype._readMessage = function(responseSchema) {
      var tk = this._tk;
      var schema = { request: [], response: responseSchema };
      this._readAnnotations(schema);
      var name = tk.next().val;
      if (tk.next().val !== "(") {
        return;
      }
      if (!tk.next({ val: ")", silent: true })) {
        do {
          schema.request.push(this._readField());
        } while (!tk.next({ val: ")", silent: true }) && tk.next({ val: "," }));
      }
      var token = tk.next();
      switch (token.val) {
        case "throws":
          schema.errors = [];
          do {
            schema.errors.push(this._readType());
          } while (!tk.next({ val: ";", silent: true }) && tk.next({ val: "," }));
          break;
        case "oneway":
          schema["one-way"] = true;
          tk.next({ val: ";" });
          break;
        case ";":
          break;
        default:
          throw tk.error("invalid message suffix", token);
      }
      return { name, schema };
    };
    Reader.prototype._readJavadoc = function() {
      var token = this._tk.next({ id: "javadoc", emitJavadoc: true, silent: true });
      if (token) {
        return token.val;
      }
    };
    Reader.prototype._readField = function() {
      var tk = this._tk;
      var javadoc = this._readJavadoc();
      var schema = { type: this._readType() };
      if (javadoc !== void 0 && schema.doc === void 0) {
        schema.doc = javadoc;
      }
      this._readAnnotations(schema);
      schema.name = tk.next({ id: "name" }).val;
      if (tk.next({ val: "=", silent: true })) {
        schema["default"] = tk.next({ id: "json" }).val;
      }
      return schema;
    };
    Reader.prototype._readType = function(schema, top) {
      schema = schema || {};
      this._readAnnotations(schema);
      schema.type = this._tk.next({ id: "name" }).val;
      switch (schema.type) {
        case "record":
        case "error":
          return this._readRecord(schema);
        case "fixed":
          return this._readFixed(schema);
        case "enum":
          return this._readEnum(schema, top);
        case "map":
          return this._readMap(schema);
        case "array":
          return this._readArray(schema);
        case "union":
          if (Object.keys(schema).length > 1) {
            throw new Error("union annotations are not supported");
          }
          return this._readUnion();
        default:
          var ref = this._typeRefs[schema.type];
          if (ref) {
            delete schema.type;
            utils.copyOwnProperties(ref, schema);
          }
          return Object.keys(schema).length > 1 ? schema : schema.type;
      }
    };
    Reader.prototype._readFixed = function(schema) {
      var tk = this._tk;
      if (!tk.next({ val: "(", silent: true })) {
        schema.name = tk.next({ id: "name" }).val;
        tk.next({ val: "(" });
      }
      schema.size = parseInt(tk.next({ id: "number" }).val);
      tk.next({ val: ")" });
      return schema;
    };
    Reader.prototype._readMap = function(schema) {
      var tk = this._tk;
      var silent = this._implicitTags;
      var implicitTags = tk.next({ val: "<", silent }) === void 0;
      schema.values = this._readType();
      tk.next({ val: ">", silent: implicitTags });
      return schema;
    };
    Reader.prototype._readArray = function(schema) {
      var tk = this._tk;
      var silent = this._implicitTags;
      var implicitTags = tk.next({ val: "<", silent }) === void 0;
      schema.items = this._readType();
      tk.next({ val: ">", silent: implicitTags });
      return schema;
    };
    Reader.prototype._readEnum = function(schema, top) {
      var tk = this._tk;
      if (!tk.next({ val: "{", silent: true })) {
        schema.name = tk.next({ id: "name" }).val;
        tk.next({ val: "{" });
      }
      schema.symbols = [];
      do {
        schema.symbols.push(tk.next().val);
      } while (!tk.next({ val: "}", silent: true }) && tk.next({ val: "," }));
      if (top && tk.next({ val: "=", silent: true })) {
        schema.default = tk.next().val;
        tk.next({ val: ";" });
      }
      return schema;
    };
    Reader.prototype._readUnion = function() {
      var tk = this._tk;
      var arr = [];
      tk.next({ val: "{" });
      do {
        arr.push(this._readType());
      } while (!tk.next({ val: "}", silent: true }) && tk.next({ val: "," }));
      return arr;
    };
    Reader.prototype._readRecord = function(schema) {
      var tk = this._tk;
      if (!tk.next({ val: "{", silent: true })) {
        schema.name = tk.next({ id: "name" }).val;
        tk.next({ val: "{" });
      }
      schema.fields = [];
      while (!tk.next({ val: "}", silent: true })) {
        schema.fields.push(this._readField());
        tk.next({ val: ";" });
      }
      return schema;
    };
    Reader.prototype._readImports = function(imports, maybeMessage) {
      var tk = this._tk;
      var numImports = 0;
      var pos = tk.pos;
      while (tk.next({ val: "import", silent: true })) {
        if (!numImports && maybeMessage && tk.next({ val: "(", silent: true })) {
          tk.pos = pos;
          return;
        }
        var kind = tk.next({ id: "name" }).val;
        var fname = JSON.parse(tk.next({ id: "string" }).val);
        tk.next({ val: ";" });
        imports.push({ kind, name: fname });
        numImports++;
      }
      return numImports;
    };
    function Tokenizer(str) {
      this._str = str;
      this.pos = 0;
    }
    Tokenizer.prototype.next = function(opts) {
      var token = { pos: this.pos, id: void 0, val: void 0 };
      var javadoc = this._skip(opts && opts.emitJavadoc);
      if (typeof javadoc == "string") {
        token.id = "javadoc";
        token.val = javadoc;
      } else {
        var pos = this.pos;
        var str = this._str;
        var c = str.charAt(pos);
        if (!c) {
          token.id = "(eof)";
        } else {
          if (opts && opts.id === "json") {
            token.id = "json";
            this.pos = this._endOfJson();
          } else if (c === '"') {
            token.id = "string";
            this.pos = this._endOfString();
          } else if (/[0-9]/.test(c)) {
            token.id = "number";
            this.pos = this._endOf(/[0-9]/);
          } else if (/[`A-Za-z_.]/.test(c)) {
            token.id = "name";
            this.pos = this._endOf(/[`A-Za-z0-9_.]/);
          } else {
            token.id = "operator";
            this.pos = pos + 1;
          }
          token.val = str.slice(pos, this.pos);
          if (token.id === "json") {
            try {
              token.val = JSON.parse(token.val);
            } catch (err2) {
              throw this.error("invalid JSON", token);
            }
          } else if (token.id === "name") {
            token.val = token.val.replace(/`/g, "");
          }
        }
      }
      var err;
      if (opts && opts.id && opts.id !== token.id) {
        err = this.error(f("expected ID %s", opts.id), token);
      } else if (opts && opts.val && opts.val !== token.val) {
        err = this.error(f("expected value %s", opts.val), token);
      }
      if (!err) {
        return token;
      } else if (opts && opts.silent) {
        this.pos = token.pos;
        return void 0;
      } else {
        throw err;
      }
    };
    Tokenizer.prototype.error = function(reason, context) {
      var isToken = typeof context != "number";
      var pos = isToken ? context.pos : context;
      var str = this._str;
      var lineNum = 1;
      var lineStart = 0;
      var i;
      for (i = 0; i < pos; i++) {
        if (str.charAt(i) === "\n") {
          lineNum++;
          lineStart = i;
        }
      }
      var msg = isToken ? f("invalid token %j: %s", context, reason) : reason;
      var err = new Error(msg);
      err.token = isToken ? context : void 0;
      err.lineNum = lineNum;
      err.colNum = pos - lineStart;
      return err;
    };
    Tokenizer.prototype._skip = function(emitJavadoc) {
      var str = this._str;
      var isJavadoc = false;
      var pos, c;
      while ((c = str.charAt(this.pos)) && /\s/.test(c)) {
        this.pos++;
      }
      pos = this.pos;
      if (c === "/") {
        switch (str.charAt(this.pos + 1)) {
          case "/":
            this.pos += 2;
            while ((c = str.charAt(this.pos)) && c !== "\n") {
              this.pos++;
            }
            return this._skip(emitJavadoc);
          case "*":
            this.pos += 2;
            if (str.charAt(this.pos) === "*") {
              isJavadoc = true;
            }
            while (c = str.charAt(this.pos++)) {
              if (c === "*" && str.charAt(this.pos) === "/") {
                this.pos++;
                if (isJavadoc && emitJavadoc) {
                  return extractJavadoc(str.slice(pos + 3, this.pos - 2));
                }
                return this._skip(emitJavadoc);
              }
            }
            throw this.error("unterminated comment", pos);
        }
      }
    };
    Tokenizer.prototype._endOf = function(pat) {
      var pos = this.pos;
      var str = this._str;
      while (pat.test(str.charAt(pos))) {
        pos++;
      }
      return pos;
    };
    Tokenizer.prototype._endOfString = function() {
      var pos = this.pos + 1;
      var str = this._str;
      var c;
      while (c = str.charAt(pos)) {
        if (c === '"') {
          return pos + 1;
        }
        if (c === "\\") {
          pos += 2;
        } else {
          pos++;
        }
      }
      throw this.error("unterminated string", pos - 1);
    };
    Tokenizer.prototype._endOfJson = function() {
      var pos = utils.jsonEnd(this._str, this.pos);
      if (pos < 0) {
        throw this.error("invalid JSON", pos);
      }
      return pos;
    };
    function extractJavadoc(str) {
      var lines = str.replace(/^[ \t]+|[ \t]+$/g, "").split("\n").map(function(line, i) {
        return i ? line.replace(/^\s*\*\s?/, "") : line;
      });
      while (lines.length && !lines[0]) {
        lines.shift();
      }
      while (lines.length && !lines[lines.length - 1]) {
        lines.pop();
      }
      return lines.join("\n");
    }
    function protocolNamespace(protocol) {
      if (protocol.namespace) {
        return protocol.namespace;
      }
      var match = /^(.*)\.[^.]+$/.exec(protocol.protocol);
      return match ? match[1] : void 0;
    }
    module.exports = {
      Tokenizer,
      assembleProtocol,
      read,
      readProtocol: Reader.readProtocol,
      readSchema: Reader.readSchema
    };
  }
});
var require_lib = __commonJS({
  "node_modules/avsc/lib/index.js"(exports, module) {
    "use strict";
    var containers = require_containers();
    var services = require_services();
    var specs = require_specs();
    var types = require_types();
    var utils = require_utils();
    var buffer = __import_BUFFER;
    var fs = __require2("fs");
    var util = __import_UTIL;
    var Buffer2 = buffer.Buffer;
    function parse(any, opts) {
      var schemaOrProtocol = specs.read(any);
      return schemaOrProtocol.protocol ? services.Service.forProtocol(schemaOrProtocol, opts) : types.Type.forSchema(schemaOrProtocol, opts);
    }
    function extractFileHeader(path, opts) {
      opts = opts || {};
      var decode = opts.decode === void 0 ? true : !!opts.decode;
      var size = Math.max(opts.size || 4096, 4);
      var buf = utils.newBuffer(size);
      var fd = fs.openSync(path, "r");
      try {
        var pos = fs.readSync(fd, buf, 0, size);
        if (pos < 4 || !containers.MAGIC_BYTES.equals(buf.slice(0, 4))) {
          return null;
        }
        var tap = new utils.Tap(buf);
        var header = null;
        do {
          header = containers.HEADER_TYPE._read(tap);
        } while (!isValid());
        if (decode !== false) {
          var meta = header.meta;
          meta["avro.schema"] = JSON.parse(meta["avro.schema"].toString());
          if (meta["avro.codec"] !== void 0) {
            meta["avro.codec"] = meta["avro.codec"].toString();
          }
        }
        return header;
      } finally {
        fs.closeSync(fd);
      }
      function isValid() {
        if (tap.isValid()) {
          return true;
        }
        var len = 2 * tap.buf.length;
        var buf2 = utils.newBuffer(len);
        len = fs.readSync(fd, buf2, 0, len);
        tap.buf = Buffer2.concat([tap.buf, buf2]);
        tap.pos = 0;
        return false;
      }
    }
    function createFileDecoder(path, opts) {
      return fs.createReadStream(path).pipe(new containers.streams.BlockDecoder(opts));
    }
    function createFileEncoder(path, schema, opts) {
      var encoder = new containers.streams.BlockEncoder(schema, opts);
      encoder.pipe(fs.createWriteStream(path, { defaultEncoding: "binary" }));
      return encoder;
    }
    module.exports = {
      Service: services.Service,
      Type: types.Type,
      assembleProtocol: specs.assembleProtocol,
      createFileDecoder,
      createFileEncoder,
      discoverProtocol: services.discoverProtocol,
      extractFileHeader,
      parse,
      readProtocol: specs.readProtocol,
      readSchema: specs.readSchema,
      streams: containers.streams,
      types: types.builtins,
      // Deprecated exports.
      Protocol: services.Service,
      assemble: util.deprecate(
        specs.assembleProtocol,
        "use `assembleProtocol` instead"
      ),
      combine: util.deprecate(
        types.Type.forTypes,
        "use `Type.forTypes` intead"
      ),
      infer: util.deprecate(
        types.Type.forValue,
        "use `Type.forValue` instead"
      )
    };
  }
});
var import_avsc = __toESM(require_lib(), 1);
console.log("AAAA");
var type = import_avsc.default.forSchema({});
console.log("type is" + type);
export {
  type
};
