import * as Janus from 'janus-gateway-js';
export interface joinOption {
    room: string;
    ptype: string;
    display: string;
    feed: number;
}
/**
 * Janus Server Response Structure after joined
 * joined event data
 */
export interface JoinedInfo {
    videoroom: string;
    room: number;
    description: string;
    id: number;
    private_id: number;
    publishers: any[];
}
export default Janus;
