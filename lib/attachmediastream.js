"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var webrtc_adapter_1 = require("webrtc-adapter");
//https://github.com/otalk/attachMediaStream/blob/master/attachmediastream.js
function default_1(el, stream, options) {
    if (options === void 0) { options = null; }
    var item;
    var element = el;
    var opts = {
        autoplay: true,
        mirror: false,
        muted: false,
        audio: false,
        disableContextMenu: false
    };
    if (options) {
        for (item in options) {
            opts[item] = options[item];
        }
    }
    if (!element) {
        //@ts-ignore
        element = document.createElement(opts.audio ? 'audio' : 'video');
    }
    else if (element.tagName.toLowerCase() === 'audio') {
        opts.audio = true;
    }
    if (opts.disableContextMenu) {
        element.oncontextmenu = function (e) {
            e.preventDefault();
        };
    }
    if (opts.autoplay)
        element.autoplay = 'autoplay';
    element.muted = !!opts.muted;
    if (!opts.audio) {
        ['', 'moz', 'webkit', 'o', 'ms'].forEach(function (prefix) {
            var styleName = prefix ? prefix + 'Transform' : 'transform';
            element.style[styleName] = opts.mirror ? 'scaleX(-1)' : 'scaleX(1)';
        });
    }
    if (webrtc_adapter_1.default.browserDetails.browser === 'safari') {
        element.setAttribute('playsinline', true);
    }
    element.srcObject = stream;
    try {
        element.srcObject = stream;
    }
    catch (e) {
        try {
            //@ts-ignore
            element.src = URL.createObjectURL(stream);
        }
        catch (e) {
            throw new Error("Error attaching stream to element");
        }
    }
    return element;
}
exports.default = default_1;
