"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//@ts-ignore */
var Promise = require("bluebird");
//global.Promise = Promise
//@ts-ignore */
var Janus = require("janus-gateway-js");
//@ts-ignore */
var Helpers = require("janus-gateway-js/src/helpers");
var attachmediastream_1 = require("./attachmediastream");
function VideoroomPlugin() {
    //@ts-ignore */
    Janus.MediaPlugin.apply(this, arguments);
}
//TODO: convert to  class VideoroomPlugin{
VideoroomPlugin.NAME = 'janus.plugin.videoroom';
VideoroomPlugin.super_ = {};
Helpers.inherits(VideoroomPlugin, Janus.MediaPlugin);
Janus.Plugin.register(VideoroomPlugin.NAME, VideoroomPlugin);
/**
 * @param {boolean} state
 * @returns {Promise}
 * @fulfilled {RTCSessionDescription} jsep
 */
VideoroomPlugin.prototype.processLocalVideo = function (option, joinedInfo) {
    option = option || {};
    option = Helpers.extend({ audio: true, video: true }, option);
    var self = this;
    return new Promise(function (resolve) {
        self.getUserMedia(option)
            .then(function (stream) {
            self.createPeerConnection();
            stream.getTracks().forEach(function (track) {
                self.addTrack(track, stream);
            });
        })
            .then(function () {
            return self.createOffer();
        })
            .then(function (jsep) {
            return self.configure(option, jsep);
        })
            .then(function (response) {
            var jsep = response.get('jsep');
            if (jsep) {
                self.setRemoteSDP(jsep);
                //console.debug();
                self.processIncomeMessagePublishers(joinedInfo.publishers);
                resolve(jsep);
            }
        });
    });
};
VideoroomPlugin.prototype.processRemoteVideo = function (roomId, attachedJsep) {
    var self = this;
    return new Promise(function (resolve) {
        self.createAnswer(attachedJsep, { audio: false, video: false })
            .then(function (jsepResult) {
            return self.start(roomId, jsepResult);
        })
            .then(function (response) {
            //TODO check error
            // started: "ok"
            resolve();
        });
    });
};
/**
 * @param {Object} [options]
 * @param {boolean} [options.muted]
 * @param {number} [options.quality]
 * @param {RTCSessionDescription} [jsep]
 * @returns {Promise}
 * @fulfilled {JanusPluginMessage} response
 */
VideoroomPlugin.prototype.configure = function (options, jsep) {
    var body = Helpers.extend({
        request: 'configure'
    }, options);
    var message = { body: body };
    if (jsep) {
        message.jsep = jsep;
    }
    return this.sendWithTransaction(message);
};
/**
 * @param {MediaStream} stream
 * @param {RTCOfferOptions} [offerOptions]
 * @param {Object} [configureOptions]
 * @param {boolean} [configureOptions.muted]
 * @param {number} [configureOptions.quality]
 * @returns {Promise}
 * @fulfilled {@link sendSDP}
 */
/*
VideoroomPlugin.prototype.offerStream = function (stream, offerOptions, configureOptions) {
  var self = this;
  return Promise
    .try(function () {
      self.createPeerConnection();
      stream.getAudioTracks().forEach(function (track) {
        self.addTrack(track, stream);
      });
    })
    .then(function () {
      return self.createOffer(offerOptions);
    })
    .then(function (jsep) {
      return self.sendSDP(jsep, configureOptions);
    });
};
*/
/**
 * @param {RTCSessionDescription} jsep
 * @param {Object} [configureOptions]
 * @param {boolean} [configureOptions.muted]
 * @param {number} [configureOptions.quality]
 * @returns {Promise}
 * @fulfilled {RTCSessionDescription}
 */
VideoroomPlugin.prototype.sendSDP = function (jsep, configureOptions) {
    var _self = this;
    return this.configure(configureOptions, jsep)
        .then(function (response) {
        var jsep = response.get('jsep');
        if (jsep) {
            _self.setRemoteSDP(jsep);
            return jsep;
        }
        return Promise.reject(new Error('Failed sendSDP. No jsep in response.'));
    }.bind(this));
};
/**
 * @param {Object} options
 * @returns {Promise}
 * @fulfilled {JanusPluginMessage} list
 */
VideoroomPlugin.prototype._listParticipants = function (options) {
    var body = Helpers.extend({ request: 'listparticipants' }, options);
    return this.sendWithTransaction({ body: body });
};
/**
 * @param {string|number} id
 * @param {Object} options
 * @returns {Promise}
 * @fulfilled {JanusPluginMessage} response
 */
VideoroomPlugin.prototype._join = function (id, options) {
    var _self = this;
    var body = Helpers.extend({ request: 'join' }, options);
    return this.sendWithTransaction({ body: body })
        .then(function (response) {
        _self.setCurrentEntity(id);
        return response;
    }.bind(this));
};
/**
 * crete new room
 * options.description
 * options.publishers
 */
VideoroomPlugin.prototype.newRoom = function (options) {
    options.description = options.description ? options.description : "";
    options.publishers = options.publishers ? options.publishers : 30;
    return this.sendWithTransaction({
        janus: "message", body: {
            request: "create", publishers: options.publishers, description: options.description
        }
    });
};
/**
 * join to room
 */
VideoroomPlugin.prototype.joinRoom = function (options) {
    var JoinOptions = {
        request: "join", room: options.room, ptype: options.ptype, display: options.display
    };
    if (options.ptype == "subscriber") {
        JoinOptions.feed = options.feed;
    }
    return this.sendWithTransaction({ janus: "message", body: JoinOptions });
};
//@ts-ignore
VideoroomPlugin.prototype.start = function (roomId, jsep) {
    // jsep type: "answer"
    return this.sendWithTransaction({
        janus: "message", body: { request: "start", room: roomId },
        jsep: jsep
    });
};
// Helper methods to attach/reattach a stream to a video element (previously part of adapter.js)
VideoroomPlugin.prototype.attachMediaStream = function (element, stream) {
    if (!element) {
        throw new Error(" attachMediaStream  element is null ");
        return false;
    }
    try {
        return attachmediastream_1.default(element, stream);
    }
    catch (e) {
        //console.debug(e);
        //TODO:  event error call
        throw new Error("Error attaching stream to element");
        //Janus.error("Error attaching stream to element");
    }
    /*try {
      element.srcObject = stream;
    } catch (e) {
      try {
        element.src = URL.createObjectURL(stream);
      } catch (e) {
        //TODO:  event error call
        throw new Error("Error attaching stream to element")
        //Janus.error("Error attaching stream to element");
      }
    }
    */
};
VideoroomPlugin.reattachMediaStream = function (to, from) {
    try {
        to.srcObject = from.srcObject;
    }
    catch (e) {
        try {
            to.src = from.src;
        }
        catch (e) {
            //TODO:  event error call
            throw new Error("Error reattaching stream to element");
            // Janus.error("Error reattaching stream to element");
        }
    }
};
/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/RTCPeerConnection#RTCConfiguration_dictionary
 * @typedef {Object} RTCConfiguration
 */
/**
 * @param {RTCConfiguration} [options]
 * @returns {RTCPeerConnection}
 */
VideoroomPlugin.prototype.createPeerConnection2 = function (options) {
    options = options || {};
    var config = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };
    var constraints = {
        'optional': [{ 'DtlsSrtpKeyAgreement': true }]
    };
    if (options.config) {
        Helpers.extend(config, options.config);
    }
    if (options.constraints) {
        Helpers.extend(constraints, options.constraints);
    }
    return this.super_.prototype.createPeerConnection(options);
};
VideoroomPlugin.prototype.processIncomeMessage = function (message) {
    var self = this;
    return Promise.try(function () {
        //@ts-ignore
        return VideoroomPlugin.super_.prototype.processIncomeMessage.call(self, message);
    }).then(function (result) {
        if (message._plainMessage) {
            var _plainMessage = message._plainMessage;
            var janusType = _plainMessage['janus'];
            switch (janusType) {
                //message
                //webrtcup: ICE and DTLS succeeded, and so Janus correctly established a PeerConnection with the user/application;
                //media: whether Janus is receiving (receiving: true/false) audio/video (type: "audio/video") on this PeerConnection;
                // ICE and DTLS succeeded, and so Janus correctly established a PeerConnection with the user/application;
                //slowlink: whether Janus is reporting trouble sending/receiving (uplink: true/false) media on this PeerConnection;
                //hangup: the PeerConnection was closed, either by Janus or by the user/application, and as such cannot be used anymore.
                //detach
                //trickle
                //slowlink
                //webrtcup
                case 'event':
                    var plugindata = _plainMessage['plugindata']['data'];
                    if (plugindata['videoroom']) {
                        var videoroom = plugindata['videoroom'];
                        self.processIncomeMessagePublishers(plugindata['publishers']);
                        switch (videoroom) {
                            case 'attached':
                                self.onRemoteFeedAttached(_plainMessage);
                                break;
                            case 'joined':
                                //self.processIncomeMessagePublishers(plugindata['publishers']);
                                break;
                            case 'event':
                                //TODO: "processIncomeMessage error";
                                //when remote-feed not video and audio published
                                if (plugindata['unpublished']) {
                                    self.emit('videoroom-remote-feed:unpublished', plugindata['unpublished']);
                                }
                                if (plugindata['leaving']) {
                                    self.emit('videoroom-remote-feed:leaving', plugindata['leaving']);
                                }
                                self.onEvent(_plainMessage);
                                break;
                        }
                    }
                    break;
            }
        }
        return result;
    });
};
VideoroomPlugin.prototype.processIncomeMessagePublishers = function (publishers) {
    /*let message: any = {
      feed: 5963190004863477,
      private_id: 645980523,
      ptype: "subscriber",
      request: "join",
      room: 1234
    }
    */
    this.emit('videoroom-remote-feed:publishers', { 'publishers': publishers });
};
/**
 * result  for  subscript join
 */
VideoroomPlugin.prototype.onRemoteFeedAttached = function (plainMessage) {
    this.emit('videoroom-remote-feed:attached', { plainMessage: plainMessage });
};
VideoroomPlugin.prototype.onEvent = function (plainMessage) {
    this.emit('videoroom-event:attached', { plainMessage: plainMessage });
};
Janus.VideoroomPlugin = VideoroomPlugin;
exports.default = Janus;
