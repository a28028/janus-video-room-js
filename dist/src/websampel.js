"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var room_1 = require("./room");
var sampelRoom = new room_1.default.JanusRoom("wss://janus.conf.meetecho.com/ws", { keepalive: 'true' });
/**
 * on joined room success
 */
sampelRoom.eventRoomjoined.on(function (info) {
    console.debug("Roomjoined");
    console.debug(info);
});
sampelRoom.eventNeedVideoLocal.on(function (elementinfo) {
    elementinfo.element = document.getElementById('localvideo');
});
sampelRoom.eventNeedVideoRemote.on(function (event) {
    if (!document.getElementById(event.feedInfo.id)) {
        var video = document.createElement('video');
        video.id = event.feedInfo.id;
        video.autoplay = true;
        if (document.getElementById("h" + event.feedInfo.id)) {
            document.getElementById("h" + event.feedInfo.id).remove();
        }
        document.getElementById('remotvideocontainer').innerHTML += ("<h2 id=\"h" + event.feedInfo.id + "\"> " + event.feedInfo.id + " display : " + event.feedInfo.display + " </h2>");
        document.getElementById('remotvideocontainer').appendChild(video);
        event.element = video;
    }
    else {
        event.element = document.getElementById(event.feedInfo.id);
    }
    var spanID = "no_video_" + event.feedInfo.id.toString();
    var elementSpan = document.getElementById(spanID);
    if (elementSpan) {
        elementSpan.remove();
    }
});
/**
 *  On Leaving feed from room
 */
sampelRoom.eventOnLeaving.on(function (feedID) {
    var elementVideo = document.getElementById(feedID.toString());
    var spanID = "no_video_" + feedID.toString();
    var elementSpan = document.getElementById(spanID);
    var h2 = document.getElementById("h" + feedID);
    if (elementVideo) {
        elementVideo.remove();
    }
    if (elementSpan) {
        elementSpan.remove();
    }
    if (h2) {
        h2.remove();
    }
});
/**
 * on Unpublished  video and  audio
 */
sampelRoom.eventOnUnpublished.on(function (feedID) {
    var elementVideo = document.getElementById(feedID.toString());
    var spanID = "no_video_" + feedID.toString();
    //let elementSpan = document.getElementById(spanID);
    if (elementVideo) {
        var elementSpan = document.createElement('span');
        elementSpan.id = spanID;
        elementSpan.innerHTML = "no video  publish";
        elementVideo.parentNode.replaceChild(elementSpan, elementVideo);
        //document.getElementById(feedID.toString()).remove();
    }
});
sampelRoom.joinRoom(1234, 'fullname2').then(function (data) {
    console.log('joinRoom 1234');
});
//# sourceMappingURL=websampel.js.map