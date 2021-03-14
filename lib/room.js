"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var janus_plugin_videoroom_1 = require("./janus-plugin-videoroom");
/**
 * https://stackoverflow.com/questions/12881212/does-typescript-support-events-on-classes?answertab=votes
 */
var LiteEvent = /** @class */ (function () {
    function LiteEvent() {
        this.handlers = [];
    }
    LiteEvent.prototype.on = function (handler) {
        this.handlers.push(handler);
    };
    LiteEvent.prototype.off = function (handler) {
        this.handlers = this.handlers.filter(function (h) { return h !== handler; });
    };
    LiteEvent.prototype.trigger = function (data) {
        this.handlers.slice(0).forEach(function (h) { return h(data); });
    };
    LiteEvent.prototype.expose = function () {
        return this;
    };
    return LiteEvent;
}());
/**
 * janus  room helper classs
 */
var JanusRoom = /** @class */ (function () {
    /**
     *
     * @param address "wss://janus.conf.meetecho.com/ws"
     * @param options {keepalive: 'true' }
     */
    function JanusRoom(address, options) {
        var _this = this;
        this.listVideoroomPlugin = [];
        this.roomId = "";
        this.onRoomjoined = new LiteEvent();
        this.onRemoteRoomAttached = new LiteEvent();
        this.onRoomCreated = new LiteEvent();
        this.onNeedVideoLocal = new LiteEvent();
        this.onNeedVideoRemote = new LiteEvent();
        /**
         * when remote-feed not video and audio published
         */
        this.onUnpublished = new LiteEvent();
        /**
         * when remote-feed leaving
         */
        this.onLeaving = new LiteEvent();
        /**
         * create private VideoroomPlugin for feed  remote client
         * @param _self
         * @param feedInfo
         */
        this.remoteCreateVideoroomPlugin = function (_self, feedInfo) { return __awaiter(_this, void 0, void 0, function () {
            var videoroomPlugin;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    //TODO check Session not  null
                    return [4 /*yield*/, _self.createSession()];
                    case 1:
                        //TODO check Session not  null
                        _a.sent();
                        return [4 /*yield*/, _self.session.attachPlugin(janus_plugin_videoroom_1.default.VideoroomPlugin.NAME)];
                    case 2:
                        videoroomPlugin = _a.sent();
                        videoroomPlugin.on("pc:track:remote", function (event) {
                            var elementinfo = { element: null, feedInfo: feedInfo };
                            _self.onNeedVideoRemote.trigger(elementinfo);
                            videoroomPlugin.attachMediaStream(elementinfo.element, event.streams[0]);
                        });
                        return [2 /*return*/, videoroomPlugin];
                }
            });
        }); };
        /**
         * new room
         * @param option
         */
        this.newRoom = function (options) {
            if (options === void 0) { options = { publishers: 30, description: "roomtest" }; }
            return __awaiter(_this, void 0, void 0, function () {
                var data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.createVideoRoomPlugin()];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.videoroomPlugin.newRoom(options)];
                        case 2:
                            data = _a.sent();
                            this.roomId = data._plainMessage.plugindata.data.room;
                            return [2 /*return*/, this.roomId];
                    }
                });
            });
        };
        /**
         * اتصال به روم موجود
         * @param roomId
         * @param display
         * @param options
         */
        this.joinRoom = function (roomId, display, options) {
            if (display === void 0) { display = "anyName"; }
            if (options === void 0) { options = { "ptype": "publisher" }; }
            return __awaiter(_this, void 0, void 0, function () {
                var data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.roomId = roomId;
                            options.room = roomId;
                            options.display = display;
                            return [4 /*yield*/, this.createVideoRoomPlugin()];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.videoroomPlugin.joinRoom(options)];
                        case 2:
                            data = _a.sent();
                            this.onRoomjoined.trigger(data);
                            this.joinedInfo = data._plainMessage.plugindata.data;
                            return [4 /*yield*/, this.videoroomPlugin.processLocalVideo({ audio: true, video: true }, this.joinedInfo)];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        /**
         *
         * @param _self join room for feed subscriber
         * @param feedInfo
         */
        this.remoteJoinRoomSubscriber = function (_self, feedInfo) { return __awaiter(_this, void 0, void 0, function () {
            var videoroomPlugin, options, dataAttached;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, _self.remoteCreateVideoroomPlugin(_self, feedInfo)];
                    case 1:
                        videoroomPlugin = _a.sent();
                        options = { "ptype": "subscriber" };
                        options.feed = feedInfo.id;
                        //TODO check roomId
                        options.room = _self.joinedInfo.room;
                        //TODO check private_id
                        options.private_id = _self.joinedInfo.private_id;
                        return [4 /*yield*/, videoroomPlugin.joinRoom(options)];
                    case 2:
                        dataAttached = _a.sent();
                        return [2 /*return*/, { dataAttached: dataAttached, videoroomPlugin: videoroomPlugin }];
                }
            });
        }); };
        this._address = address || "wss://janus.conf.meetecho.com/ws";
        this._options = options || {
            keepalive: 'true'
        };
    }
    Object.defineProperty(JanusRoom.prototype, "eventRoomjoined", {
        // no-video-container
        /**
         * event rome joined sucsess
         */
        get: function () { return this.onRoomjoined.expose(); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(JanusRoom.prototype, "eventRemoteRoomAttached", {
        /**
         * event rome joined for feed
         */
        get: function () { return this.onRemoteRoomAttached.expose(); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(JanusRoom.prototype, "eventRoomCreated", {
        /**
          * event rome Created
          */
        get: function () { return this.onRoomCreated.expose(); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(JanusRoom.prototype, "eventNeedVideoLocal", {
        /**
         * need tag video html for local
         */
        get: function () { return this.onNeedVideoLocal.expose(); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(JanusRoom.prototype, "eventNeedVideoRemote", {
        /**
         * need tag video html for remote
         */
        get: function () { return this.onNeedVideoRemote.expose(); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(JanusRoom.prototype, "eventOnUnpublished", {
        /**
         * when remote-feed not video and audio published
         */
        get: function () { return this.onUnpublished.expose(); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(JanusRoom.prototype, "eventOnLeaving", {
        /**
         * when remote-feed leaving
         */
        get: function () { return this.onLeaving.expose(); },
        enumerable: false,
        configurable: true
    });
    /**
     *janus create new Connection
     */
    //@ts-ignore
    JanusRoom.prototype.createConnection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var url, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!!this.connection) return [3 /*break*/, 2];
                        url = 'wss://janus.roomler.live/janus_ws';
                        url = "wss://janus.conf.meetecho.com/ws";
                        this.JanusClient = new janus_plugin_videoroom_1.default.Client(this._address, this._options);
                        _a = this;
                        return [4 /*yield*/, this.JanusClient.createConnection('client')];
                    case 1:
                        _a.connection = _b.sent();
                        _b.label = 2;
                    case 2: return [2 /*return*/, this.connection];
                }
            });
        });
    };
    /**
     *janus create new Session
     */
    //@ts-ignore
    JanusRoom.prototype.createSession = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!!this.session) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.createConnection()];
                    case 1:
                        _b.sent();
                        _a = this;
                        return [4 /*yield*/, this.connection.createSession()];
                    case 2:
                        _a.session = _b.sent();
                        _b.label = 3;
                    case 3: return [2 /*return*/, this];
                }
            });
        });
    };
    /**
     * create  VideoroomPlugin  object
     */
    JanusRoom.prototype.createVideoRoomPlugin = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _self, _a;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _self = this;
                        return [4 /*yield*/, this.createSession()];
                    case 1:
                        _b.sent();
                        if (!!this.videoroomPlugin) return [3 /*break*/, 3];
                        _a = this;
                        return [4 /*yield*/, this.session.attachPlugin(janus_plugin_videoroom_1.default.VideoroomPlugin.NAME)];
                    case 2:
                        _a.videoroomPlugin = _b.sent();
                        this.videoroomPlugin.on('consent-dialog:stop', function (trackInfo) {
                            var elementinfo = { element: null };
                            _self.onNeedVideoLocal.trigger(elementinfo);
                            _self.videoroomPlugin.attachMediaStream(elementinfo.element, trackInfo.stream);
                            //console.log('pc:track:local');
                        });
                        this.videoroomPlugin.on('videoroom-remote-feed:publishers', function (data) { _this.videoroomRremoteFeedPublishers(_self, data); });
                        /**
                         *  when remote-feed not video and audio published
                         */
                        this.videoroomPlugin.on('videoroom-remote-feed:unpublished', function (feedId) { _this.onUnpublished.trigger(feedId); });
                        /**
                         * when remote-feed leaving
                         */
                        this.videoroomPlugin.on('videoroom-remote-feed:leaving', function (feedId) { _this.onLeaving.trigger(feedId); });
                        _b.label = 3;
                    case 3: return [2 /*return*/, this];
                }
            });
        });
    };
    /**
     * join room for feed subscriber
     * @param _self JanusRoom
     * @param data {publishers}
     */
    JanusRoom.prototype.videoroomRremoteFeedPublishers = function (_self, data) {
        return __awaiter(this, void 0, void 0, function () {
            var publishers, _i, publishers_1, feedInfo, dataResult, mediaConstraints, jsepResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!data.publishers) return [3 /*break*/, 6];
                        publishers = data.publishers;
                        _i = 0, publishers_1 = publishers;
                        _a.label = 1;
                    case 1:
                        if (!(_i < publishers_1.length)) return [3 /*break*/, 6];
                        feedInfo = publishers_1[_i];
                        return [4 /*yield*/, _self.remoteJoinRoomSubscriber(_self, feedInfo)];
                    case 2:
                        dataResult = _a.sent();
                        dataResult.videoroomPlugin.createPeerConnection();
                        mediaConstraints = {};
                        return [4 /*yield*/, dataResult.videoroomPlugin.createAnswer(dataResult.dataAttached._plainMessage.jsep, mediaConstraints)];
                    case 3:
                        jsepResult = _a.sent();
                        return [4 /*yield*/, dataResult.videoroomPlugin.start(_self.roomId, jsepResult)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * To stop publishing and tear down the related PeerConnection, you can use the unpublish request, which requires no arguments as the context is implicit:
     */
    JanusRoom.prototype.stopPublishing = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.createVideoRoomPlugin()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.videoroomPlugin.stopPublishing()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    JanusRoom.prototype.startPublishing = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.createVideoRoomPlugin()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.videoroomPlugin.processLocalVideo({ audio: true, video: true }, this.joinedInfo)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    JanusRoom.prototype.publishOwnFeed = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    return JanusRoom;
}());
janus_plugin_videoroom_1.default.JanusRoom = JanusRoom;
exports.default = janus_plugin_videoroom_1.default;
