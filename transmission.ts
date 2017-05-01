import * as request from 'request';
import {CoreOptions, RequestResponse} from 'request';
function req(url: string, options: CoreOptions) {
    return new Promise<{body: string, response: RequestResponse}>((resolve, reject) => {
        request(url, options, (error: Error, response: RequestResponse, body: string) => {
            if (error) return reject(error);
            resolve({body, response});
        });
    });
}

export interface Torrent {
    addedDate: number;
    downloadDir: string;
    error: number;
    errorString: string;
    eta: number;
    id: number;
    isFinished: boolean;
    isStalled: boolean;
    leftUntilDone: number;
    metadataPercentComplete: number;
    name: string;
    peersConnected: number;
    peersGettingFromUs: number;
    peersSendingToUs: number;
    percentDone: number;
    queuePosition: number;
    rateDownload: number;
    rateUpload: number;
    recheckProgress: number;
    seedRatioLimit: number;
    seedRatioMode: number;
    sizeWhenDone: number;
    status: number;
    totalSize: number;
    trackers: any[];
    uploadRatio: number;
    uploadedEver: number;
    webseedsSendingToUs: number;
}

export class TransmissionRPC {
    sid: string;

    private async post<T>(payload: any, attempt = 1): Promise<T> {
        const {body, response} = await req('http://localhost:9091/transmission/rpc', {
            method: 'POST',
            headers: {
                'X-Transmission-Session-Id': this.sid,
            },
            body: payload
        });
        const sid = response.headers['X-Transmission-Session-Id'];
        if (sid) {
            this.sid = sid;
            if (attempt <= 3) {
                return this.post(payload, attempt + 1) as Promise<T>;
            }
        }
        return JSON.parse(body).arguments;
    }

    async getSession() {
        return await this.post({method: 'session-get'});
    }

    async getSessionStats() {
        return await this.post({'method': 'session-stats'});
    }

    // async getTorrent() {
    //     return await this.post({
    //         'method': 'torrent-get',
    //         'arguments': {
    //             'fields': ['id', 'error', 'errorString', 'eta', 'isFinished', 'isStalled', 'leftUntilDone', 'metadataPercentComplete', 'peersConnected', 'peersGettingFromUs', 'peersSendingToUs', 'percentDone', 'queuePosition', 'rateDownload', 'rateUpload', 'recheckProgress', 'seedRatioMode', 'seedRatioLimit', 'sizeWhenDone', 'status', 'trackers', 'downloadDir', 'uploadedEver', 'uploadRatio', 'webseedsSendingToUs'],
    //             'ids': 'recently-active'
    //         }
    //     });
    // }

    async getTorrentList() {
        return (await this.post<{torrents: Torrent[]}>({
            'method': 'torrent-get',
            'arguments': {
                'fields': ['id', 'addedDate', 'name', 'totalSize', 'error', 'errorString', 'eta', 'isFinished', 'isStalled', 'leftUntilDone', 'metadataPercentComplete', 'peersConnected', 'peersGettingFromUs', 'peersSendingToUs', 'percentDone', 'queuePosition', 'rateDownload', 'rateUpload', 'recheckProgress', 'seedRatioMode', 'seedRatioLimit', 'sizeWhenDone', 'status', 'trackers', 'downloadDir', 'uploadedEver', 'uploadRatio', 'webseedsSendingToUs']
            }
        })).torrents;
    }

    async addTorrent(url: string, pathToSave: string) {
        return await this.post({
            'method': 'torrent-add',
            'arguments': {
                'paused': false,
                'download-dir': pathToSave,
                'filename': url
            }
        });
    }

    async torrentRemove(id: number) {
        return await this.post({
            'method': 'torrent-remove',
            'arguments': {'delete-local-data': true, 'ids': [id]}
        });
    }
}