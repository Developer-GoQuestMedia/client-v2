"use strict";var __defProp=Object.defineProperty,__getOwnPropDesc=Object.getOwnPropertyDescriptor,__getOwnPropNames=Object.getOwnPropertyNames,__hasOwnProp=Object.prototype.hasOwnProperty,__export=(e,t)=>{for(var r in t)__defProp(e,r,{get:t[r],enumerable:!0})},__copyProps=(e,t,r,o)=>{if(t&&"object"===typeof t||"function"===typeof t)for(let n of __getOwnPropNames(t))__hasOwnProp.call(e,n)||n===r||__defProp(e,n,{get:()=>t[n],enumerable:!(o=__getOwnPropDesc(t,n))||o.enumerable});return e},__toCommonJS=e=>__copyProps(__defProp({},"__esModule",{value:!0}),e),__accessCheck=(e,t,r)=>{if(!t.has(e))throw TypeError("Cannot "+r)},__privateGet=(e,t,r)=>(__accessCheck(e,t,"read from private field"),r?r.call(e):t.get(e)),__privateAdd=(e,t,r)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,r)},__privateSet=(e,t,r,o)=>(__accessCheck(e,t,"write to private field"),o?o.call(e,r):t.set(e,r),r),__privateMethod=(e,t,r)=>(__accessCheck(e,t,"access private method"),r),src_exports={};__export(src_exports,{FormDataEncoder:()=>FormDataEncoder,isFile:()=>isFile,isFormData:()=>isFormData}),module.exports=__toCommonJS(src_exports);var isFunction=e=>"function"===typeof e,isAsyncIterable=e=>isFunction(e[Symbol.asyncIterator]),MAX_CHUNK_SIZE=65536;function*chunk(e){if(e.byteLength<=MAX_CHUNK_SIZE)return void(yield e);let t=0;for(;t<e.byteLength;){const r=Math.min(e.byteLength-t,MAX_CHUNK_SIZE),o=e.buffer.slice(t,t+r);t+=o.byteLength,yield new Uint8Array(o)}}async function*readStream(e){const t=e.getReader();for(;;){const{done:e,value:r}=await t.read();if(e)break;yield r}}async function*chunkStream(e){for await(const t of e)yield*chunk(t)}var getStreamIterator=e=>{if(isAsyncIterable(e))return chunkStream(e);if(isFunction(e.getReader))return chunkStream(readStream(e));throw new TypeError("Unsupported data source: Expected either ReadableStream or async iterable.")},alphabet="abcdefghijklmnopqrstuvwxyz0123456789";function createBoundary(){let e=16,t="";for(;e--;)t+=alphabet[Math.random()*alphabet.length|0];return t}var normalizeValue=e=>String(e).replace(/\r|\n/g,((e,t,r)=>"\r"===e&&"\n"!==r[t+1]||"\n"===e&&"\r"!==r[t-1]?"\r\n":e)),getType=e=>Object.prototype.toString.call(e).slice(8,-1).toLowerCase();function isPlainObject(e){if("object"!==getType(e))return!1;const t=Object.getPrototypeOf(e);if(null===t||void 0===t)return!0;return(t.constructor&&t.constructor.toString())===Object.toString()}function getProperty(e,t){if("string"===typeof t)for(const[r,o]of Object.entries(e))if(t.toLowerCase()===r.toLowerCase())return o}var _CRLF,_CRLF_BYTES,_CRLF_BYTES_LENGTH,_DASHES,_encoder,_footer,_form,_options,_getFieldHeader,getFieldHeader_fn,_getContentLength,getContentLength_fn,proxyHeaders=e=>new Proxy(e,{get:(e,t)=>getProperty(e,t),has:(e,t)=>void 0!==getProperty(e,t)}),isFormData=e=>Boolean(e&&isFunction(e.constructor)&&"FormData"===e[Symbol.toStringTag]&&isFunction(e.append)&&isFunction(e.getAll)&&isFunction(e.entries)&&isFunction(e[Symbol.iterator])),escapeName=e=>String(e).replace(/\r/g,"%0D").replace(/\n/g,"%0A").replace(/"/g,"%22"),isFile=e=>Boolean(e&&"object"===typeof e&&isFunction(e.constructor)&&"File"===e[Symbol.toStringTag]&&isFunction(e.stream)&&null!=e.name),defaultOptions={enableAdditionalHeaders:!1},readonlyProp={writable:!1,configurable:!1},FormDataEncoder=class{constructor(e,t,r){if(__privateAdd(this,_getFieldHeader),__privateAdd(this,_getContentLength),__privateAdd(this,_CRLF,"\r\n"),__privateAdd(this,_CRLF_BYTES,void 0),__privateAdd(this,_CRLF_BYTES_LENGTH,void 0),__privateAdd(this,_DASHES,"-".repeat(2)),__privateAdd(this,_encoder,new TextEncoder),__privateAdd(this,_footer,void 0),__privateAdd(this,_form,void 0),__privateAdd(this,_options,void 0),!isFormData(e))throw new TypeError("Expected first argument to be a FormData instance.");let o;if(isPlainObject(t)?r=t:o=t,o||(o=createBoundary()),"string"!==typeof o)throw new TypeError("Expected boundary argument to be a string.");if(r&&!isPlainObject(r))throw new TypeError("Expected options argument to be an object.");__privateSet(this,_form,Array.from(e.entries())),__privateSet(this,_options,{...defaultOptions,...r}),__privateSet(this,_CRLF_BYTES,__privateGet(this,_encoder).encode(__privateGet(this,_CRLF))),__privateSet(this,_CRLF_BYTES_LENGTH,__privateGet(this,_CRLF_BYTES).byteLength),this.boundary=`form-data-boundary-${o}`,this.contentType=`multipart/form-data; boundary=${this.boundary}`,__privateSet(this,_footer,__privateGet(this,_encoder).encode(`${__privateGet(this,_DASHES)}${this.boundary}${__privateGet(this,_DASHES)}${__privateGet(this,_CRLF).repeat(2)}`));const n={"Content-Type":this.contentType},a=__privateMethod(this,_getContentLength,getContentLength_fn).call(this);a&&(this.contentLength=a,n["Content-Length"]=a),this.headers=proxyHeaders(Object.freeze(n)),Object.defineProperties(this,{boundary:readonlyProp,contentType:readonlyProp,contentLength:readonlyProp,headers:readonlyProp})}*values(){for(const[e,t]of __privateGet(this,_form)){const r=isFile(t)?t:__privateGet(this,_encoder).encode(normalizeValue(t));yield __privateMethod(this,_getFieldHeader,getFieldHeader_fn).call(this,e,r),yield r,yield __privateGet(this,_CRLF_BYTES)}yield __privateGet(this,_footer)}async*encode(){for(const e of this.values())isFile(e)?yield*getStreamIterator(e.stream()):yield*chunk(e)}[Symbol.iterator](){return this.values()}[Symbol.asyncIterator](){return this.encode()}};_CRLF=new WeakMap,_CRLF_BYTES=new WeakMap,_CRLF_BYTES_LENGTH=new WeakMap,_DASHES=new WeakMap,_encoder=new WeakMap,_footer=new WeakMap,_form=new WeakMap,_options=new WeakMap,_getFieldHeader=new WeakSet,getFieldHeader_fn=function(e,t){let r="";if(r+=`${__privateGet(this,_DASHES)}${this.boundary}${__privateGet(this,_CRLF)}`,r+=`Content-Disposition: form-data; name="${escapeName(e)}"`,isFile(t)&&(r+=`; filename="${escapeName(t.name)}"${__privateGet(this,_CRLF)}`,r+=`Content-Type: ${t.type||"application/octet-stream"}`),!0===__privateGet(this,_options).enableAdditionalHeaders){const e=isFile(t)?t.size:t.byteLength;null==e||isNaN(e)||(r+=`${__privateGet(this,_CRLF)}Content-Length: ${e}`)}return __privateGet(this,_encoder).encode(`${r}${__privateGet(this,_CRLF).repeat(2)}`)},_getContentLength=new WeakSet,getContentLength_fn=function(){let e=0;for(const[t,r]of __privateGet(this,_form)){const o=isFile(r)?r:__privateGet(this,_encoder).encode(normalizeValue(r)),n=isFile(o)?o.size:o.byteLength;if(null==n||isNaN(n))return;e+=__privateMethod(this,_getFieldHeader,getFieldHeader_fn).call(this,t,o).byteLength,e+=n,e+=__privateGet(this,_CRLF_BYTES_LENGTH)}return String(e+__privateGet(this,_footer).byteLength)};