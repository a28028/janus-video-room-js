

import Janus from './janus-plugin-videoroom';
import JoinedInfo from './janus-plugin-videoroom';

interface ILiteEvent<T> {
    on(handler: { (data?: T): void }): void;
    off(handler: { (data?: T): void }): void;
}
/**
 * https://stackoverflow.com/questions/12881212/does-typescript-support-events-on-classes?answertab=votes
 */
class LiteEvent<T> implements ILiteEvent<T> {
    private handlers: { (data?: T): void; }[] = [];

    public on(handler: { (data?: T): void }): void {
        this.handlers.push(handler);
    }

    public off(handler: { (data?: T): void }): void {
        this.handlers = this.handlers.filter(h => h !== handler);
    }

    public trigger(data?: T) {
        this.handlers.slice(0).forEach(h => h(data));
    }

    public expose(): ILiteEvent<T> {
        return this;
    }
}


/**
 * janus  room helper classs
 */
class JanusRoom {
    _address: string
    _options: any
    listVideoroomPlugin: Array<Janus.videoroomPlugin> = [];
    JanusClient: Janus.client;
    connection: Janus.Connection;
    session: Janus.Session;
    videoroomPlugin: Janus.videoroomPlugin;
    roomId: string = "";
    /**
     * first join info result type: "publisher"
     */
    joinedInfo: JoinedInfo
    CreatedInfo: JoinedInfo
    private readonly onRoomjoined = new LiteEvent<JoinedInfo>();
    private readonly onRemoteRoomAttached = new LiteEvent<JoinedInfo>();
    private readonly onRoomCreated = new LiteEvent<void>();
    private readonly onNeedVideoLocal = new LiteEvent<void>();
    private readonly onNeedVideoRemote = new LiteEvent<void>();
    /**
     * when remote-feed not video and audio published
     */
    private readonly onUnpublished = new LiteEvent<number>();
    /**
     * when remote-feed leaving
     */
    private readonly onLeaving = new LiteEvent<number>();
    /**
     * 
     * @param address "wss://janus.conf.meetecho.com/ws"
     * @param options {keepalive: 'true' }
     */
    constructor(address: string, options: any) {
        this._address = address || "wss://janus.conf.meetecho.com/ws";
        this._options = options || {
            keepalive: 'true'
        };
    }
    // no-video-container
    /**
     * event rome joined sucsess
     */
    public get eventRoomjoined() { return this.onRoomjoined.expose(); }
    /**
     * event rome joined for feed
     */
    public get eventRemoteRoomAttached() { return this.onRemoteRoomAttached.expose(); }
    /**
      * event rome Created
      */
    public get eventRoomCreated() { return this.onRoomCreated.expose(); }
    /**
     * need tag video html for local
     */
    public get eventNeedVideoLocal() { return this.onNeedVideoLocal.expose(); }
    /**
     * need tag video html for remote
     */
    public get eventNeedVideoRemote() { return this.onNeedVideoRemote.expose(); }
    /**
     * when remote-feed not video and audio published
     */
    public get eventOnUnpublished() { return this.onUnpublished.expose(); }
    /**
     * when remote-feed leaving
     */
    public get eventOnLeaving() { return this.onLeaving.expose(); }
    /**
     *janus create new Connection
     */
    //@ts-ignore
    private async createConnection(): Promise<any> {
        if (!this.connection) {
            let url = 'wss://janus.roomler.live/janus_ws';
            url = "wss://janus.conf.meetecho.com/ws"
            this.JanusClient = new Janus.Client(this._address, this._options)
            this.connection = await this.JanusClient.createConnection('client');
        }
        return this.connection;
    }
    /**
     *janus create new Session
     */
    //@ts-ignore
    private async createSession(): Promise<any> {
        if (!this.session) {
            await this.createConnection();
            this.session = await this.connection.createSession();
        }
        return this;
    }
    /**
     * create  VideoroomPlugin  object
     */
    private async createVideoRoomPlugin() {
        var _self = this;
        await this.createSession();
        if (!this.videoroomPlugin) {
            this.videoroomPlugin = await this.session.attachPlugin(Janus.VideoroomPlugin.NAME);
            this.videoroomPlugin.on('consent-dialog:stop', (trackInfo: any) => {
                var elementinfo: any = { element: null };
                _self.onNeedVideoLocal.trigger(elementinfo);
                _self.videoroomPlugin.attachMediaStream(elementinfo.element, trackInfo.stream);
                //console.log('pc:track:local');
            });
            this.videoroomPlugin.on('videoroom-remote-feed:publishers', (data: any) => { this.videoroomRremoteFeedPublishers(_self, data) });
            /**
             *  when remote-feed not video and audio published
             */
            this.videoroomPlugin.on('videoroom-remote-feed:unpublished', (feedId: number) => { this.onUnpublished.trigger(feedId) });
            /**
             * when remote-feed leaving
             */
            this.videoroomPlugin.on('videoroom-remote-feed:leaving', (feedId: number) => { this.onLeaving.trigger(feedId) });
        }
        return this;
    }
    /**
     * join room for feed subscriber
     * @param _self JanusRoom
     * @param data {publishers}
     */
    private async videoroomRremoteFeedPublishers(_self: JanusRoom, data: any) {
        if (data.publishers) {
            let publishers: Array<any> = data.publishers;
            for (const feedInfo of publishers) {
                let dataResult = await _self.remoteJoinRoomSubscriber(_self, feedInfo);
                dataResult.videoroomPlugin.createPeerConnection();
                let mediaConstraints = {};//{ audio: false, video: false };
                let jsepResult = await dataResult.videoroomPlugin.createAnswer(dataResult.dataAttached._plainMessage.jsep, mediaConstraints);
                await dataResult.videoroomPlugin.start(_self.roomId, jsepResult)
            }
        }
    }
    /**
     * create private VideoroomPlugin for feed  remote client
     * @param _self 
     * @param feedInfo 
     */
    private remoteCreateVideoroomPlugin = async (_self: JanusRoom, feedInfo: any) => {
        //TODO check Session not  null
        await _self.createSession();
        let videoroomPlugin = await _self.session.attachPlugin(Janus.VideoroomPlugin.NAME);
        videoroomPlugin.on("pc:track:remote", (event: any) => {
            var elementinfo: any = { element: null, feedInfo: feedInfo };
            _self.onNeedVideoRemote.trigger(elementinfo);
            videoroomPlugin.attachMediaStream(elementinfo.element, event.streams[0]);
        })
        return videoroomPlugin;
    }

    /**
     * new room
     * @param option 
     */
    newRoom = async (options = { publishers: 30, description: "roomtest" }) => {
        await this.createVideoRoomPlugin();
        let data: any = await this.videoroomPlugin.newRoom(options);
        this.roomId = data._plainMessage.plugindata.data.room;
        return this.roomId;
    }
    /**
     * اتصال به روم موجود
     * @param roomId 
     * @param display 
     * @param options 
     */
    joinRoom = async (roomId: string, display: string = "anyName", options: any = { "ptype": "publisher" }) => {
        this.roomId = roomId;
        options.room = roomId;
        options.display = display;
        await this.createVideoRoomPlugin();
        var data = await this.videoroomPlugin.joinRoom(options);
        this.onRoomjoined.trigger(data);
        this.joinedInfo = data._plainMessage.plugindata.data;
        await this.videoroomPlugin.processLocalVideo({ audio: true, video: true }, this.joinedInfo);
        return data;
    }

    /**
     * 
     * @param _self join room for feed subscriber
     * @param feedInfo 
     */
    remoteJoinRoomSubscriber = async (_self: JanusRoom, feedInfo: any) => {
        let videoroomPlugin = await _self.remoteCreateVideoroomPlugin(_self, feedInfo);
        //TODO check joinedInfo
        let options: any = { "ptype": "subscriber" };
        options.feed = feedInfo.id;
        //TODO check roomId
        options.room = _self.joinedInfo.room;
        //TODO check private_id
        options.private_id = _self.joinedInfo.private_id;
        let dataAttached = await videoroomPlugin.joinRoom(options);
        return { dataAttached: dataAttached, videoroomPlugin: videoroomPlugin }
    }
    /**
     * To stop publishing and tear down the related PeerConnection, you can use the unpublish request, which requires no arguments as the context is implicit:
     */
    async stopPublishing() {
        await this.createVideoRoomPlugin();
        return await this.videoroomPlugin.stopPublishing();
    }
    async startPublishing() {
        await this.createVideoRoomPlugin();
        return await this.videoroomPlugin.processLocalVideo({ audio: true, video: true }, this.joinedInfo);
        return await this.videoroomPlugin.stopPublishing();
    }
    
    async publishOwnFeed() {
        // /	$('#publish').attr('disabled', true).unbind('click');

    }
}
Janus.JanusRoom = JanusRoom;
export default Janus;