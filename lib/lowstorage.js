// node_modules/ultralight-s3/lib/index.min.js
var Q = crypto.createHmac || (await import("node:crypto")).createHmac;
var Y = crypto.createHash || (await import("node:crypto")).createHash;
typeof Q > "u" && typeof Y > "u" && console.error("ultralight-S3 Module: Crypto functions are not available, please report the issue with necessary description: https://github.com/sentienhq/ultralight-s3/issues");
var K = "AWS4-HMAC-SHA256";
var C = "aws4_request";
var P = "s3";
var W = "2";
var _ = "UNSIGNED-PAYLOAD";
var X = "application/octet-stream";
var L = "application/xml";
var S = "application/json";
var V = ["accessKeyId", "secretAccessKey", "sessionToken", "password"];
var M = 5 * 1024 * 1024;
var y = "x-amz-content-sha256";
var Z = "x-amz-date";
var J = "host";
var k = "Authorization";
var w = "Content-Type";
var T = "Content-Length";
var j = "etag";
var B = "last-modified";
var c = "ultralight-s3 Module: ";
var ee = `${c}accessKeyId must be a non-empty string`;
var te = `${c}secretAccessKey must be a non-empty string`;
var re = `${c}endpoint must be a non-empty string`;
var se = `${c}bucketName must be a non-empty string`;
var h = `${c}key must be a non-empty string`;
var $ = `${c}uploadId must be a non-empty string`;
var z = `${c}parts must be a non-empty array`;
var G = `${c}Each part must have a partNumber (number) and ETag (string)`;
var I = `${c}data must be a Buffer or string`;
var U = `${c}path must be a string`;
var q = `${c}prefix must be a string`;
var F = `${c}maxKeys must be a positive integer`;
var oe = { contents: true };
var ne = (m) => `%${m.charCodeAt(0).toString(16).toUpperCase()}`;
var O = (m) => encodeURIComponent(m).replace(/[!'()*]/g, ne);
var f = (m) => O(m).replace(/%2F/g, "/");
var x = class {
  constructor({ accessKeyId: e, secretAccessKey: t, endpoint: r, bucketName: s, region: n = "auto", maxRequestSizeInBytes: i = M, requestAbortTimeout: a = void 0, logger: u = void 0 }) {
    this.getBucketName = () => this.bucketName, this.setBucketName = (o) => {
      this.bucketName = o;
    }, this.getRegion = () => this.region, this.setRegion = (o) => {
      this.region = o;
    }, this.getEndpoint = () => this.endpoint, this.setEndpoint = (o) => {
      this.endpoint = o;
    }, this.getMaxRequestSizeInBytes = () => this.maxRequestSizeInBytes, this.setMaxRequestSizeInBytes = (o) => {
      this.maxRequestSizeInBytes = o;
    }, this.getProps = () => ({ accessKeyId: this.accessKeyId, secretAccessKey: this.secretAccessKey, region: this.region, bucket: this.bucketName, endpoint: this.endpoint, maxRequestSizeInBytes: this.maxRequestSizeInBytes, requestAbortTimeout: this.requestAbortTimeout, logger: this.logger }), this.setProps = (o) => {
      this._validateConstructorParams(o.accessKeyId, o.secretAccessKey, o.bucketName, o.endpoint), this.accessKeyId = o.accessKeyId, this.secretAccessKey = o.secretAccessKey, this.region = o.region || "auto", this.bucketName = o.bucketName, this.endpoint = o.endpoint, this.maxRequestSizeInBytes = o.maxRequestSizeInBytes || M, this.requestAbortTimeout = o.requestAbortTimeout, this.logger = o.logger;
    }, this._validateConstructorParams(e, t, r, s), this.accessKeyId = e, this.secretAccessKey = t, this.endpoint = r, this.bucketName = s, this.region = n, this.maxRequestSizeInBytes = i, this.requestAbortTimeout = a, this.logger = u;
  }
  _validateConstructorParams(e, t, r, s) {
    if (typeof e != "string" || e.trim().length === 0) throw new TypeError(ee);
    if (typeof t != "string" || t.trim().length === 0) throw new TypeError(te);
    if (typeof r != "string" || r.trim().length === 0) throw new TypeError(re);
    if (typeof s != "string" || s.trim().length === 0) throw new TypeError(se);
  }
  _log(e, t, r = {}) {
    if (this.logger && typeof this.logger[e] == "function") {
      let s = (a) => typeof a != "object" || a === null ? a : Object.keys(a).reduce((u, o) => (V.includes(o.toLowerCase()) ? u[o] = "[REDACTED]" : typeof a[o] == "object" && a[o] !== null ? u[o] = s(a[o]) : u[o] = a[o], u), Array.isArray(a) ? [] : {}), n = s(r), i = { timestamp: (/* @__PURE__ */ new Date()).toISOString(), level: e, message: t, ...n, context: s({ bucketName: this.bucketName, region: this.region, endpoint: this.endpoint, accessKeyId: this.accessKeyId ? `${this.accessKeyId.substring(0, 4)}...` : void 0 }) };
      this.logger[e](i);
    }
  }
  async getContentLength(e) {
    if (typeof e != "string" || e.trim().length === 0) throw this._log("error", h), new TypeError(h);
    let t = { [y]: _ }, r = f(e), { url: s, headers: n } = await this._sign("HEAD", r, {}, t, ""), a = (await this._sendRequest(s, "HEAD", n)).headers.get(T);
    return a ? parseInt(a, 10) : 0;
  }
  async bucketExists() {
    let e = { [y]: _ }, { url: t, headers: r } = await this._sign("HEAD", "", {}, e, ""), s = await this._sendRequest(t, "HEAD", r);
    return !!(s.ok && s.status === 200);
  }
  async fileExists(e) {
    if (typeof e != "string" || e.trim().length === 0) throw this._log("error", h), new TypeError(h);
    let t = { [y]: _ }, r = f(e), { url: s, headers: n } = await this._sign("HEAD", r, {}, t, "");
    try {
      let i = await fetch(s, { method: "HEAD", headers: n });
      return i.ok && i.status === 200 ? true : (i.status === 404 || this._handleErrorResponse(i), false);
    } catch (i) {
      let a = i instanceof Error ? i.message : String(i);
      throw this._log("error", `${c}Failed to check if file exists: ${a}`), new Error(`${c}Failed to check if file exists: ${a}`);
    }
  }
  async _sign(e, t, r, s, n) {
    let i = (/* @__PURE__ */ new Date()).toISOString().replace(/[:-]|\.\d{3}/g, ""), a = typeof t == "string" && t.length > 0 ? new URL(t, this.endpoint) : new URL(this.endpoint);
    a.pathname = `/${encodeURI(this.bucketName)}${a.pathname}`, s[y] = n ? await N(n) : _, s[Z] = i, s[J] = a.host;
    let u = this._buildCanonicalHeaders(s), o = Object.keys(s).map((p) => p.toLowerCase()).sort().join(";"), E = await this._buildCanonicalRequest(e, a, r, u, o, n), l = await this._buildStringToSign(i, E), g = await this._calculateSignature(i, l), d = this._buildAuthorizationHeader(i, o, g);
    return s[k] = d, { url: a.toString(), headers: s };
  }
  _buildCanonicalHeaders(e) {
    return Object.entries(e).map(([t, r]) => `${t.toLowerCase()}:${String(r).trim()}`).sort().join(`
`);
  }
  async _buildCanonicalRequest(e, t, r, s, n, i) {
    return [e, t.pathname, this._buildCanonicalQueryString(r), `${s}
`, n, i ? await N(i) : _].join(`
`);
  }
  async _buildStringToSign(e, t) {
    let r = [e.slice(0, 8), this.region, P, C].join("/");
    return [K, e, r, await N(t)].join(`
`);
  }
  async _calculateSignature(e, t) {
    let r = await this._getSignatureKey(e.slice(0, 8));
    return D(r, t, "hex");
  }
  _buildAuthorizationHeader(e, t, r) {
    let s = [e.slice(0, 8), this.region, P, C].join("/");
    return [`${K} Credential=${this.accessKeyId}/${s}`, `SignedHeaders=${t}`, `Signature=${r}`].join(", ");
  }
  async list(e = "/", t = "", r = 1e3, s = "GET", n = {}) {
    if (typeof e != "string" || e.trim().length === 0) throw this._log("error", U), new TypeError(U);
    if (typeof t != "string") throw this._log("error", q), new TypeError(q);
    if (!Number.isInteger(r) || r <= 0) throw this._log("error", F), new TypeError(F);
    if (s !== "GET" && s !== "HEAD") throw this._log("error", `${c}method must be either GET or HEAD`), new TypeError(`${c}method must be either GET or HEAD`);
    if (typeof n != "object") throw this._log("error", `${c}opts must be an object`), new TypeError(`${c}opts must be an object`);
    this._log("info", `Listing objects in ${e}`);
    let i = { "list-type": W, "max-keys": String(r), ...n };
    t.length > 0 && (i.prefix = t);
    let a = { [w]: S, [y]: _ }, u = e === "/" ? e : O(e), { url: o, headers: E } = await this._sign("GET", u, i, a, ""), l = `${o}?${new URLSearchParams(i)}`, g = await this._sendRequest(l, "GET", E), d = await g.text();
    if (s === "HEAD") {
      let R = g.headers.get(T), A = g.headers.get(B), v = g.headers.get(j);
      return { size: R ? +R : void 0, mtime: A ? new Date(A) : void 0, ETag: v || void 0 };
    }
    let p = b(d), H = p.listBucketResult || p.error || p;
    return H.contents || H;
  }
  async listMultiPartUploads(e = "/", t = "", r = "GET", s = {}) {
    var n, i, a;
    if (typeof e != "string" || e.trim().length === 0) throw this._log("error", U), new TypeError(U);
    if (typeof t != "string") throw this._log("error", q), new TypeError(q);
    if (r !== "GET" && r !== "HEAD") throw this._log("error", `${c}method must be either GET or HEAD`), new TypeError(`${c}method must be either GET or HEAD`);
    if (typeof s != "object") throw this._log("error", `${c}opts must be an object`), new TypeError(`${c}opts must be an object`);
    this._log("info", `Listing multipart uploads in ${e}`);
    let u = { uploads: "", ...s }, o = { [w]: S, [y]: _ }, E = e === "/" ? e : O(e), { url: l, headers: g } = await this._sign("GET", E, u, o, ""), d = `${l}?${new URLSearchParams(u)}`, p = await this._sendRequest(d, "GET", g), H = await p.text();
    if (r === "HEAD") return { size: +((n = p.headers.get(T)) !== null && n !== void 0 ? n : "0"), mtime: new Date((i = p.headers.get(B)) !== null && i !== void 0 ? i : ""), ETag: (a = p.headers.get(j)) !== null && a !== void 0 ? a : "" };
    let R = b(H), A = R.listMultipartUploadsResult || R.error || R;
    return A.uploads || A;
  }
  async get(e, t = {}) {
    if (typeof e != "string" || e.trim().length === 0) throw this._log("error", h), new TypeError(h);
    let r = { [w]: S, [y]: _ };
    this._log("info", `Getting object ${e}`);
    let s = f(e), { url: n, headers: i } = await this._sign("GET", s, t, r, "");
    return (await this._sendRequest(n, "GET", i)).text();
  }
  async getResponse(e, t = true, r = 0, s = this.maxRequestSizeInBytes, n = {}) {
    let i = n, a = { [w]: S, [y]: _, ...t ? {} : { range: `bytes=${r}-${s - 1}` } }, u = f(e), { url: o, headers: E } = await this._sign("GET", u, i, a, ""), l = `${o}?${new URLSearchParams(i)}`;
    return this._sendRequest(l, "GET", E);
  }
  async put(e, t) {
    if (typeof e != "string" || e.trim().length === 0) throw this._log("error", h), new TypeError(h);
    if (!(t instanceof Buffer || typeof t == "string")) throw this._log("error", I), new TypeError(I);
    this._log("info", `Uploading object ${e}`);
    let r = typeof t == "string" ? Buffer.byteLength(t) : t.length, s = { [T]: r }, n = f(e), { url: i, headers: a } = await this._sign("PUT", n, {}, s, t);
    return await this._sendRequest(i, "PUT", a, t);
  }
  async getMultipartUploadId(e, t = X) {
    if (typeof e != "string" || e.trim().length === 0) throw this._log("error", h), new TypeError(h);
    if (typeof t != "string") throw this._log("error", `${c}fileType must be a string`), new TypeError(`${c}fileType must be a string`);
    this._log("info", `Initiating multipart upload for object ${e}`);
    let r = { uploads: "" }, s = { [w]: t, [y]: _ }, n = f(e), { url: i, headers: a } = await this._sign("POST", n, r, s, ""), u = `${i}?${new URLSearchParams(r)}`, E = await (await this._sendRequest(u, "POST", a)).text(), l = b(E);
    if (typeof l == "object" && l !== null && "error" in l && typeof l.error == "object" && l.error !== null && "message" in l.error) {
      let g = String(l.error.message);
      throw this._log("error", `${c}Failed to abort multipart upload: ${g}`), new Error(`${c}Failed to abort multipart upload: ${g}`);
    }
    if (typeof l == "object" && l !== null) {
      if (!l.initiateMultipartUploadResult || !l.initiateMultipartUploadResult.uploadId) throw this._log("error", `${c}Failed to create multipart upload: no uploadId in response`), new Error(`${c}Failed to create multipart upload: Missing upload ID in response`);
      return l.initiateMultipartUploadResult.uploadId;
    } else throw this._log("error", `${c}Failed to create multipart upload: unexpected response format`), new Error(`${c}Failed to create multipart upload: Unexpected response format`);
  }
  async uploadPart(e, t, r, s, n = {}) {
    this._validateUploadPartParams(e, t, r, s, n);
    let i = { uploadId: r, partNumber: s, ...n }, a = { [T]: t.length }, u = f(e), { url: o, headers: E } = await this._sign("PUT", u, i, a, t), l = `${o}?${new URLSearchParams(i)}`, d = (await this._sendRequest(l, "PUT", E, t)).headers.get("etag") || "";
    return { partNumber: s, ETag: d };
  }
  _validateUploadPartParams(e, t, r, s, n) {
    if (typeof e != "string" || e.trim().length === 0) throw this._log("error", h), new TypeError(h);
    if (!(t instanceof Buffer || typeof t == "string")) throw this._log("error", I), new TypeError(I);
    if (typeof r != "string" || r.trim().length === 0) throw this._log("error", $), new TypeError($);
    if (!Number.isInteger(s) || s <= 0) throw this._log("error", `${c}partNumber must be a positive integer`), new TypeError(`${c}partNumber must be a positive integer`);
    if (typeof n != "object") throw this._log("error", `${c}opts must be an object`), new TypeError(`${c}opts must be an object`);
  }
  async completeMultipartUpload(e, t, r) {
    if (typeof e != "string" || e.trim().length === 0) throw this._log("error", h), new TypeError(h);
    if (typeof t != "string" || t.trim().length === 0) throw this._log("error", $), new TypeError($);
    if (!Array.isArray(r) || r.length === 0) throw this._log("error", z), new TypeError(z);
    if (!r.every((p) => typeof p.partNumber == "number" && typeof p.ETag == "string")) throw this._log("error", G), new TypeError(G);
    this._log("info", `Complete multipart upload ${t} for object ${e}`);
    let s = { uploadId: t }, n = this._buildCompleteMultipartUploadXml(r), i = { [w]: L, [T]: Buffer.byteLength(n).toString(), [y]: await N(n) }, a = f(e), { url: u, headers: o } = await this._sign("POST", a, s, i, n), E = `${u}?${new URLSearchParams(s)}`, g = await (await this._sendRequest(E, "POST", o, n)).text(), d = b(g);
    if (typeof d == "object" && d !== null && "error" in d && typeof d.error == "object" && d.error !== null && "message" in d.error) {
      let p = String(d.error.message);
      throw this._log("error", `${c}Failed to abort multipart upload: ${p}`), new Error(`${c}Failed to abort multipart upload: ${p}`);
    }
    return d.completeMultipartUploadResult;
  }
  async abortMultipartUpload(e, t) {
    if (typeof e != "string" || e.trim().length === 0) throw this._log("error", h), new TypeError(h);
    if (typeof t != "string" || t.trim().length === 0) throw this._log("error", $), new TypeError($);
    this._log("info", `Aborting multipart upload ${t} for object ${e}`);
    let r = { uploadId: t }, s = { [w]: L, [y]: _ };
    try {
      let n = f(e), { url: i, headers: a } = await this._sign("DELETE", n, r, s, ""), u = `${i}?${new URLSearchParams(r)}`, o = await this._sendRequest(u, "DELETE", a);
      if (o.ok) {
        let E = await o.text(), l = b(E);
        if (typeof l == "object" && l !== null && "error" in l && typeof l.error == "object" && l.error !== null && "message" in l.error) {
          let g = String(l.error.message);
          throw this._log("error", `${c}Failed to abort multipart upload: ${g}`), new Error(`${c}Failed to abort multipart upload: ${g}`);
        }
        return { status: "Aborted", key: e, uploadId: t, response: l };
      } else throw this._log("error", `${c}Abort request failed with status ${o.status}`), new Error(`${c}Abort request failed with status ${o.status}`);
    } catch (n) {
      let i = n instanceof Error ? n.message : String(n);
      throw this._log("error", `${c}Failed to abort multipart upload for key ${e}: ${i}`), new Error(`${c}Failed to abort multipart upload for key ${e}: ${i}`);
    }
  }
  _buildCompleteMultipartUploadXml(e) {
    return `
      <CompleteMultipartUpload>
        ${e.map((t) => `
          <Part>
            <PartNumber>${t.partNumber}</PartNumber>
            <ETag>${t.ETag}</ETag>
          </Part>
        `).join("")}
      </CompleteMultipartUpload>
    `;
  }
  async delete(e) {
    if (typeof e != "string" || e.trim().length === 0) throw this._log("error", h), new TypeError(h);
    this._log("info", `Deleting object ${e}`);
    let t = { [w]: S, [y]: _ }, r = f(e), { url: s, headers: n } = await this._sign("DELETE", r, {}, t, "");
    return (await this._sendRequest(s, "DELETE", n)).text();
  }
  async _sendRequest(e, t, r, s) {
    this._log("info", `Sending ${t} request to ${e}, headers: ${JSON.stringify(r)}`);
    let n = await fetch(e, { method: t, headers: r, body: s, signal: this.requestAbortTimeout !== void 0 ? AbortSignal.timeout(this.requestAbortTimeout) : void 0 });
    return n.ok || await this._handleErrorResponse(n), n;
  }
  async _handleErrorResponse(e) {
    let t = await e.text(), r = e.headers.get("x-amz-error-code") || "Unknown", s = e.headers.get("x-amz-error-message") || e.statusText;
    throw this._log("error", `${c}Request failed with status ${e.status}: ${r} - ${s},err body: ${t}`), new Error(`${c}Request failed with status ${e.status}: ${r} - ${s}, err body: ${t}`);
  }
  _buildCanonicalQueryString(e) {
    return Object.keys(e).length < 1 ? "" : Object.keys(e).sort().map((t) => `${encodeURIComponent(t)}=${encodeURIComponent(e[t])}`).join("&");
  }
  async _getSignatureKey(e) {
    let t = await D(`AWS4${this.secretAccessKey}`, e), r = await D(t, this.region), s = await D(r, P);
    return D(s, C);
  }
};
var N = async (m) => {
  let e = Y("sha256");
  return e.update(m), e.digest("hex");
};
var D = async (m, e, t) => {
  let r = Q("sha256", m);
  return r.update(e), r.digest(t);
};
var b = (m) => {
  let e = (n) => n.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"), t = {}, r = /<(\w)([-\w]+)(?:\/|[^>]*>((?:(?!<\1)[\s\S])*)<\/\1\2)>/gm, s;
  for (; s = r.exec(m); ) {
    let [, n, i, a] = s, u = n.toLowerCase() + i, o = a != null ? b(a) : true;
    typeof o == "string" ? t[u] = e(o) : Array.isArray(t[u]) ? t[u].push(o) : t[u] = t[u] != null ? [t[u], o] : oe[u] ? [o] : o;
  }
  return Object.keys(t).length ? t : e(m);
};

// src/lowstorage.js
import avro from "avro-js";

// src/helpers.js
import { randomUUID } from "node:crypto";
var matchesQuery = (document, query) => {
  return Object.keys(query).every((key) => document[key] === query[key]);
};
var generateUUID = async () => {
  let _randomUUID = randomUUID || (await import("node:crypto")).randomUUID;
  if (typeof _randomUUID !== "undefined" && typeof _randomUUID === "function") {
    return _randomUUID();
  } else {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c2) {
      var r = Math.random() * 16 | 0, v = c2 === "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
  }
};
var _getAvroType = (value, name = "SubAutoGenerated") => {
  switch (typeof value) {
    case "string":
      if (_isUUID(value)) {
        return {
          type: "string",
          name: "_id",
          size: 16,
          logicalType: "UUID"
        };
      }
      return "string";
    case "number":
      return Number.isInteger(value) ? "int" : "float";
    case "boolean":
      return "boolean";
    case "object":
      if (value === null) return "null";
      if (Array.isArray(value)) return { type: "array", items: _getAvroType(value[0]) };
      return inferAvroType(value, name);
    default:
      return "string";
  }
};
var inferAvroType = (data, typeName = "AutoGenerated") => {
  if (Array.isArray(data)) {
    data = data[0];
  }
  const fields = Object.entries(data).map(([name, value]) => {
    return { name, type: _getAvroType(value, `${typeName}.${name}`) };
  });
  return {
    type: "record",
    name: typeName,
    fields
  };
};
var _isUUID = (str) => {
  const uuidV4Regex = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
  return uuidV4Regex.test(str);
};

// src/lowstorage.js
var MODULE_NAME = "lowstorage";
var PROJECT_DIR_PREFIX = "lowstorage/";
var SCHEMA_SUFFIX = ".avro";
var CHUNG_1MB = 1024 * 1024;
var CHUNG_5MB = 5 * CHUNG_1MB;
var lowstorage = class {
  constructor(options = {
    accessKeyId: void 0,
    secretAccessKey: void 0,
    endpoint: void 0,
    bucketName: void 0,
    region: "auto",
    logger: null
  }) {
    this._checkArgs(options);
    this._schemas = /* @__PURE__ */ new Map();
    this._s3 = new x(options);
    this._avro = avro;
  }
  _checkArgs = (args) => {
    const requiredFields = ["accessKeyId", "secretAccessKey", "endpoint", "bucketName"];
    for (const field of requiredFields) {
      if (!args[field]) {
        throw new Error(`${MODULE_NAME}: ${field} is required`);
      }
    }
  };
  async listCollections() {
    const listed = await this._s3.list(PROJECT_DIR_PREFIX, "", 1e3);
    return listed.map((entry) => entry.key.slice(PROJECT_DIR_PREFIX.length, -SCHEMA_SUFFIX.length));
  }
  async createCollection(colName, schema = void 0) {
    try {
      if (colName === void 0 || colName.trim() === "" || colName === null) {
        throw new Error(`${MODULE_NAME}: Collection name is required`);
      }
      if (await this.collectionExists(colName)) {
        throw new Error(`${MODULE_NAME}: Collection ${colName} already exists`);
      }
      if (schema) {
        const avroType = this._avro.parse(schema);
        this._schemas.set(colName, avroType);
      }
      return this.collection(colName, schema);
    } catch (error) {
      throw new Error(`${MODULE_NAME}: ${error.message}`);
    }
  }
  async removeCollection(colName) {
    try {
      const exists = await this._s3.fileExists(`${PROJECT_DIR_PREFIX}${colName}${SCHEMA_SUFFIX}`);
      if (exists) {
        const resp = await this._s3.delete(`${PROJECT_DIR_PREFIX}${colName}${SCHEMA_SUFFIX}`);
        if (resp.status === 200) {
          return true;
        }
        return false;
      }
      return true;
    } catch (error) {
      throw new Error(`${MODULE_NAME}: ${error.message}`);
    }
  }
  async collectionExists(colName) {
    try {
      const exists = await this._s3.fileExists(`${PROJECT_DIR_PREFIX}${colName}${SCHEMA_SUFFIX}`);
      return exists;
    } catch (error) {
      if (error.message.includes("Not Found")) {
        return false;
      }
      throw new Error(`${MODULE_NAME}: ${error.message}`);
    }
  }
  async updateCollectionSchema(colName, schema) {
    try {
      if (colName === void 0 || colName.trim() === "" || colName === null) {
        throw new Error(`${MODULE_NAME}: Collection name is required`);
      }
      const exists = await this.collectionExists(colName);
      if (!exists) {
        throw new Error(`${MODULE_NAME}: Collection ${colName} does not exist`);
      }
      if (schema === void 0 || schema === null) {
        throw new Error(`${MODULE_NAME}: Schema is required`);
      }
      const avroType = this._avro.parse(schema);
      this._schemas.set(colName, avroType);
      const resp = await this._s3.put(`${PROJECT_DIR_PREFIX}${colName}${SCHEMA_SUFFIX}`, JSON.stringify(schema));
      if (resp.status === 200) {
        return true;
      } else {
        throw new Error(`${MODULE_NAME}: Failed to update schema for collection ${colName}`);
      }
    } catch (error) {
      throw new Error(`${MODULE_NAME}: ${error.message}`);
    }
  }
  async collection(colName, schema = void 0) {
    try {
      if (colName === void 0 || colName.trim() === "" || colName === null) {
        throw new Error(`${MODULE_NAME}: Collection name is required`);
      }
      if (typeof schema === "undefined") {
        if (this._schemas.has(colName)) {
          return new Collection(colName, this._s3, this._schemas.get(colName));
        }
        const exists = await this._s3.fileExists(`${PROJECT_DIR_PREFIX}${colName}${SCHEMA_SUFFIX}`);
        if (exists) {
          const schemaContent = await this._s3.get(`${PROJECT_DIR_PREFIX}${colName}${SCHEMA_SUFFIX}`);
          const avroType = this._avro.parse(schemaContent);
          this._schemas.set(colName, avroType);
          return new Collection(colName, this._s3, avroType);
        }
        return new Collection(colName, this._s3, void 0);
      }
      return new Collection(colName, this._s3, this._avro.parse(schema));
    } catch (error) {
      throw new Error(`${MODULE_NAME}: ${error.message}`);
    }
  }
};
var Collection = class {
  constructor(colName, s3, avroType = void 0) {
    this._colName = colName;
    this._s3 = s3;
    this._avro = avro;
    this._avroType = avroType;
  }
  async insert(doc, schema = void 0) {
    try {
      if (doc === void 0 || doc === null) {
        throw new Error(`${MODULE_NAME}: Document is required for insert`);
      }
      if (typeof doc !== "object" && !Array.isArray(doc)) {
        throw new Error(`${MODULE_NAME}: Document must be an object or an array`);
      }
      const items = !Array.isArray(doc) ? [doc] : doc;
      const avroType = !!schema ? this._avro.parse(schema) : this._avroType || this._avro.parse(inferAvroType(doc));
      if (avroType === void 0) {
        throw new Error(`${MODULE_NAME}: Schema is required - Pass a schema to the insert method`);
      }
      this._avroType = avroType;
      const wrapperType = this._avro.parse({ type: "array", items: this._avroType });
      const bufferData = await this._loadDataBuffer();
      const data = bufferData.length > 0 ? wrapperType.fromBuffer(bufferData) : [];
      for (let item of items) {
        if (typeof item !== "object" || item === null) {
          throw new Error("Invalid input: input must be an object or an array of objects");
        }
        item._id = item._id || await generateUUID();
        const valid = this._avroType.isValid(item);
        if (!valid) {
          throw new Error(`${MODULE_NAME}: Invalid document or schema`);
        }
        data.push(item);
      }
      const resp = await this._saveDataBuffer(wrapperType.toBuffer(data));
      if (resp) {
        return items;
      } else {
        throw new Error(`${MODULE_NAME}: Failed to insert document`);
      }
    } catch (error) {
      throw new Error(`${MODULE_NAME}: ${error.message}`);
    }
  }
  async _loadDataBuffer() {
    try {
      const KEY = `${PROJECT_DIR_PREFIX}${this._colName}${SCHEMA_SUFFIX}`;
      const CHUNK_SIZE = this._s3.getMaxRequestSizeInBytes() || CHUNG_5MB;
      let firstData = await this._s3.get(KEY);
      if (firstData.length < CHUNK_SIZE) {
        return Buffer.from(firstData, "utf8");
      }
      let offset = CHUNK_SIZE;
      let bufferArr = [Buffer.from(firstData, "utf8")];
      let repeat = true;
      while (repeat) {
        const nextDataResponse = await this._s3.getResponse(KEY, false, offset, offset + CHUNK_SIZE);
        const nextDataBody = await nextDataResponse.text();
        bufferArr.push(Buffer.from(nextDataBody, "utf8"));
        offset += CHUNG;
        const contentLength = nextDataResponse.headers.get("content-length") || nextDataBody.length;
        if (contentLength < CHUNK_SIZE) {
          repeat = false;
        }
      }
      return Buffer.concat(bufferArr);
    } catch (error) {
      if (error.toString().indexOf("status 404: Unknown - Not Found") > -1) {
        return Buffer.from("");
      }
      throw new Error(`${MODULE_NAME}: ${error.message}`);
    }
  }
  async _saveDataBuffer(data) {
    try {
      const KEY = `${PROJECT_DIR_PREFIX}${this._colName}${SCHEMA_SUFFIX}`;
      const resp = await this._s3.put(KEY, data);
      if (resp.status === 200) {
        return true;
      } else {
        throw new Error(`${MODULE_NAME}: Failed to save data`);
      }
    } catch (error) {
      throw new Error(`${MODULE_NAME}: ${error.message}`);
    }
  }
  async find(query = {}, options = {}) {
    try {
      const bufferData = await this._loadDataBuffer();
      const wrapperType = this._avro.parse({ type: "array", items: this._avroType });
      const data = bufferData.length > 0 ? wrapperType.fromBuffer(bufferData) : [];
      const start = parseInt(options.skip, 10) || 0;
      const end = parseInt(options.limit, 10) ? start + parseInt(options.limit, 10) : void 0;
      const filteredData = data.filter((doc) => matchesQuery(doc, query)).slice(start, end);
      return filteredData;
    } catch (error) {
      throw new Error(`${MODULE_NAME}: ${error.message}`);
    }
  }
  async findOne(query = {}) {
    return (await this.find(query))[0] || null;
  }
  async update(query = {}, update = {}) {
    try {
      const bufferData = await this._loadDataBuffer();
      const wrapperType = this._avro.parse({ type: "array", items: this._avroType });
      const data = bufferData.length > 0 ? wrapperType.fromBuffer(bufferData) : [];
      let updatedCount = 0;
      for (let i = 0; i < data.length; i++) {
        if (matchesQuery(data[i], query)) {
          Object.assign(data[i], update);
          updatedCount++;
        }
      }
      if (updatedCount > 0) {
        const resp = await this._saveDataBuffer(wrapperType.toBuffer(data));
        if (resp) {
          return updatedCount;
        }
      }
      return 0;
    } catch (error) {
      throw new Error(`${MODULE_NAME}: ${error.message}`);
    }
  }
  async updateOne(query = {}, update = {}) {
    try {
      const bufferData = await this._loadDataBuffer();
      const wrapperType = this._avro.parse({ type: "array", items: this._avroType });
      const data = bufferData.length > 0 ? wrapperType.fromBuffer(bufferData) : [];
      const docIndex = data.findIndex((doc) => matchesQuery(doc, query));
      if (docIndex !== -1) {
        Object.assign(data[docIndex], update);
        const resp = await this._saveDataBuffer(wrapperType.toBuffer(data));
        if (resp) {
          return 1;
        }
      }
      return 0;
    } catch (error) {
      throw new Error(`${MODULE_NAME}: ${error.message}`);
    }
  }
  async delete(query = {}) {
    try {
      const bufferData = await this._loadDataBuffer();
      const wrapperType = this._avro.parse({ type: "array", items: this._avroType });
      const data = bufferData.length > 0 ? wrapperType.fromBuffer(bufferData) : [];
      const initialLength = data.length;
      const newData = data.filter((doc) => !matchesQuery(doc, query));
      const resp = await this._saveDataBuffer(wrapperType.toBuffer(newData));
      if (resp) {
        return initialLength - newData.length;
      }
      return 0;
    } catch (error) {
      throw new Error(`${MODULE_NAME}: ${error.message}`);
    }
  }
  async count(query = {}) {
    try {
      if (query === void 0 || query === null) {
        throw new Error(`${MODULE_NAME}: Query is required`);
      }
      if (Object.keys(query).length === 0) {
        const bufferData = await this._loadDataBuffer();
        const wrapperType = this._avro.parse({ type: "array", items: this._avroType });
        const data = bufferData.length > 0 ? wrapperType.fromBuffer(bufferData) : [];
        return data.length || null;
      }
      return (await this.find(query)).length;
    } catch (error) {
      throw new Error(`${MODULE_NAME}: ${error.message}`);
    }
  }
};
var lowstorage_default = lowstorage;
export {
  lowstorage_default as default,
  lowstorage
};
//# sourceMappingURL=lowstorage.js.map
