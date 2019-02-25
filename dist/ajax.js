!function(t,n){"object"==typeof exports&&"object"==typeof module?module.exports=n():"function"==typeof define&&define.amd?define([],n):"object"==typeof exports?exports.beta=n():t.beta=n()}("undefined"!=typeof self?self:this,function(){return function(t){var n={};function e(r){if(n[r])return n[r].exports;var o=n[r]={i:r,l:!1,exports:{}};return t[r].call(o.exports,o,o.exports,e),o.l=!0,o.exports}return e.m=t,e.c=n,e.d=function(t,n,r){e.o(t,n)||Object.defineProperty(t,n,{enumerable:!0,get:r})},e.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},e.t=function(t,n){if(1&n&&(t=e(t)),8&n)return t;if(4&n&&"object"==typeof t&&t&&t.__esModule)return t;var r=Object.create(null);if(e.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:t}),2&n&&"string"!=typeof t)for(var o in t)e.d(r,o,function(n){return t[n]}.bind(null,o));return r},e.n=function(t){var n=t&&t.__esModule?function(){return t.default}:function(){return t};return e.d(n,"a",n),n},e.o=function(t,n){return Object.prototype.hasOwnProperty.call(t,n)},e.p="",e(e.s=0)}([function(t,n,e){t.exports=e(1)},function(t,n,e){"use strict";var r=e(2);r.env.fetch=window.fetch,r.env.window=window,t.exports=r},function(t,n,e){var r=e(3);function o(){var t={parse:c,hooks:[],beforehooks:[],base:"",path:"",query:{},init:function(t,n,e){var r=this.clone().setMethod(t);return n&&(r=r.setBase(n)),e&&(r=r.setPath(e)),r},merge:function(t){return Object.assign(this.clone(),t)},clone:function(){return Object.assign(o(),this,{query:Object.assign({},this.query),hooks:this.hooks.slice(),beforehooks:this.beforehooks.slice()})},addQuery:function(t,n){var e=this.clone();return e.query[t]=n,e},removeQuery:function(t){var n=this.clone();return void 0!==n.query[t]&&(n.query[t]=void 0),n},setQuery:function(t){return this.merge({query:t})},setMode:function(t){return this.merge({mode:t})},setCredentials:function(t){return this.merge({credentials:t})},clearHooks:function(){var t=this.clone();return t.hooks=[],t.beforehooks=[],t},beforeHook:function(t){var n=this.clone();return n.beforehooks.push(t),n},injectHook:function(t){var n=this.clone();return n.hooks.push(t),n},setPath:function(t){var n=this.clone();return n.path=u(t),n},setHeader:function(t){var n=this.clone();return n.headers=Object.assign({},this.headers,t),n.headers["Content-Type"]=void 0,n},put:function(t,n){return this.init("PUT",t,n)},head:function(t,n){return this.init("HEAD",t,n)},patch:function(t,n){return this.init("PATCH",t,n)},del:function(t,n){return this.init("DELETE",t,n)},post:function(t,n){return this.init("POST",t,n)},get:function(t,n){return this.init("GET",t,n)},setMethod:function(t){var n=this.clone();return n.method=u(t),n},setBase:function(t){var n=this.clone();return n.base=u(t),n},contentTypeJson:function(){return this.merge({content_type:"application/json; charset=utf-8"})},contentTypeForm:function(){return this.merge({content_type:"application/x-www-form-urlencoded"})},setContentType:function(t){return this.merge({content_type:u(t)})},setParser:function(t){var n=this.clone();switch(u(t)){case"json":n.parse=function(t){if(void 0!==t)return JSON.parse(t)};break;default:n.parse=c}return n},send:function(t){var n=this.clone();t&&("application/json; charset=utf-8"===this.content_type?n.body=JSON.stringify(t):"application/x-www-form-urlencoded"===this.content_type?n.body=r.stringify(t):n.body=t);var e={request:n};return f(n.beforehooks,e).then(function(){return i(e.request)})}};return t}var i=function(t){return new Promise(function(n,e){var o,i;t.content_type&&(t.headers=Object.assign(t.headers||{},{"Content-Type":t.content_type}));var u=r.stringify(t.query);u&&(u="?"+u);var c=function(t,n){return n&&t?(t.endsWith("/")||(t+="/"),n.startsWith("/")&&(n=n.substring(1)),t+n):t+n}(t.base,t.path)+u;s.fetch.bind(s.window)(c,t).then(function(t){return(o=t).text()}).then(function(n){return i={req:t,code:o.status,body:n},f(t.hooks,i)}).then(function(){var e=i.body;try{e=t.parse(e),n([i.code,e])}catch(t){n([void 0,void 0,t])}}).catch(function(t){n([0,void 0,t])})})};function u(t){return(t||"").trim()}function c(t){return t}var s={fetch:{},window:{}};function f(t,n){return 0===t.length?new Promise(function(t){t(!0)}):t.shift()(n).then(function(e){return!1===e?new Promise(function(t){t(!1)}):f(t,n)})}t.exports={post:function(t,n){return o().init("POST",t,n)},del:function(t,n){return o().init("DELETE",t,n)},head:function(t,n){return o().init("HEAD",t,n)},patch:function(t,n){return o().init("PATCH",t,n)},env:s,get:function(t,n){return o().init("GET",t,n)},put:function(t,n){return o().init("PUT",t,n)}}},function(t,n){function e(t,n){return n.encode?n.strict?function(t){return encodeURIComponent(t).replace(/[!'()*]/g,function(t){return"%"+t.charCodeAt(0).toString(16)})}(t):encodeURIComponent(t):t}t.exports={stringify:function(t){if(!t)return"";var n={encode:!0,strict:!0,arrayFormat:"none"};const r=function(t){switch(t.arrayFormat){case"index":return function(n,r,o){var i=e(n,t);return null===r?[i,"[",o,"]"].join(""):[i,"[",e(o,t),"]=",e(r,t)].join("")};case"bracket":return(n,r)=>null===r?[e(n,t),"[]"].join(""):[e(n,t),"[]=",e(r,t)].join("");default:return(n,r)=>null===r?e(n,t):[e(n,t),"=",e(r,t)].join("")}}(n),o=Object.keys(t);return!1!==n.sort&&o.sort(n.sort),o.map(function(o){const i=t[o];if(void 0===i)return"";if(null===i)return e(o,n);if(!Array.isArray(i))return e(o,n)+"="+e(i,n);const u=[];for(const t of i.slice())void 0!==t&&u.push(r(o,t,u.length));return u.join("&")}).filter(function(t){return t.length>0}).join("&")}}}])});