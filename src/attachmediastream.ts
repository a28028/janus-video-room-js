import adapter from 'webrtc-adapter';
//https://github.com/otalk/attachMediaStream/blob/master/attachmediastream.js
export default function (el : any, stream : any, options : any = null) {
    var item;
    var element = el;
    var opts : any = {
        autoplay: true,
        mirror: false,
        muted: false,
        audio: false,
        disableContextMenu: false
    };

    if (options) {
        for (item   in options) {
            opts[item] = options[item];
        }
    }

    if (!element) {
        //@ts-ignore
        element = document.createElement(opts.audio ? 'audio' : 'video');
    } else if (element.tagName.toLowerCase() === 'audio') {
        opts.audio = true;
    }

    if (opts.disableContextMenu) {
        element.oncontextmenu = function (e : any) {
            e.preventDefault();
        };
    }

    if (opts.autoplay) element.autoplay = 'autoplay';
    element.muted = !!opts.muted;
    if (!opts.audio) {
        ['', 'moz', 'webkit', 'o', 'ms'].forEach(function (prefix) {
            var styleName = prefix ? prefix + 'Transform' : 'transform';
            element.style[styleName] = opts.mirror ? 'scaleX(-1)' : 'scaleX(1)';
        });
    }

    if (adapter.browserDetails.browser === 'safari') {
        element.setAttribute('playsinline', true);
    }

    element.srcObject = stream;

    try {
        element.srcObject = stream;
    } catch (e) {
        try {
            //@ts-ignore
            element.src = URL.createObjectURL(stream);
        } catch (e) {
            throw new Error("Error attaching stream to element");
        }
    }
    return element;
}