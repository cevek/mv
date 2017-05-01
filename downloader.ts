import {query} from './db';
import {Torrent, TransmissionRPC} from './transmission';
interface Download {
    id: number;
    kpId: number;
    rtId: number;
    gdId: Maybe<string>;
    startedAt: Maybe<Date>;
    updatedAt: Maybe<Date>;
    endedAt: Maybe<Date>;
    status: Status;
    size: number;
    downloadedBytes: number;
    files: string;
    info: string;
    sort: number;
    hash: string;
}

enum Status {
    DONE = 1,
    DOWNLOADING_TIMEOUT = 2,
    DOWNLOADING_ERROR = 3,
    CONVERTING_ERROR = 4,
    UPLOADING_ERROR = 5,
    UNEXPECTED_ERROR = 6,
    DOWNLOADING = -2,
    CONVERTING = -3,
    UPLOADING = -4,
}

const maxDiskSize = 10 * 1000 * 1000 * 1000;
const maxDownloadSize = 450 * 1000 * 1000 * 1000;
const minSpeedBytesPerSec = 50 * 1000;
const timeBeforeCheckMinSpeed = 5 * 60;

const pathToSave = '/Users/cody/Downloads/';

async function getNextDownload(): Promise<Maybe<Download>> {
    const rows = await query<Download[]>(`SELECT d.*, rt.hash FROM downloads d LEFT JOIN rt ON rt.id = d.rtId WHERE status = 0 LIMIT 1`);
    return rows[0];
}

async function getTotalDownloadBytes() {
    const [{sumDownloadedBytes}] = await query<{sumDownloadedBytes: number}[]>(`SELECT SUM(downloadedBytes) as sumDownloadedBytes FROM downloads`);
    return sumDownloadedBytes;
}


async function getCurrentDownloads() {
    return await query<Download[]>(`SELECT d.*, rt.hash FROM downloads d LEFT JOIN rt ON rt.id = d.rtId WHERE status > 0`);
}

async function getCurrentDownloadsSize() {
    const rows = await getCurrentDownloads();
    let sumSize = 0;
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        sumSize += row.size;
    }
    return sumSize;
}

async function checkDownloads() {
    if (await getTotalDownloadBytes() > maxDownloadSize) return;
    const sumSize = await getCurrentDownloadsSize();
    while (sumSize < maxDiskSize) {
        const next = await getNextDownload();
        if (next && sumSize + next.size < maxDiskSize) {
            await runDownload(next);
        }
    }
}

async function main() {
    while (true) {
        await checkDoneAndFrozenTorrents();
        await sleep(1000);
    }
}

async function checkDoneAndFrozenTorrents() {
    const torrents = await transmission.getTorrentList();

    for (let i = 0; i < torrents.length; i++) {
        const torrent = torrents[i];
        const sec = Date.now() / 1000 - +torrent.addedDate;
        const speedBytesPerSec = (torrent.percentDone * torrent.totalSize) / sec;
        if (sec > timeBeforeCheckMinSpeed && speedBytesPerSec < minSpeedBytesPerSec) {
            await removeTorrent(torrent);
            await updateDownloadStatus(Status.DOWNLOADING_TIMEOUT);
        }
        if (torrent.percentDone === 1) {
            await doneTorrent(torrent);
        }
    }
}

async function doneTorrent(torrent: Torrent) {
    await convert(torrent);
    await upload(torrent);
    await removeTorrent(torrent);
    await updateDownloadStatus(Status.DONE);
}

async function convert(torrent: Torrent) {
    await updateDownloadStatus(Status.CONVERTING);
    try {
        await remuxVideoEngAudio();
        await extractStreams();
    } catch (e) {
        await updateDownloadStatus(Status.CONVERTING_ERROR);
        throw e;
    }
}

async function extractStreams() {

}

async function remuxVideoEngAudio() {

}

async function upload(torrent: Torrent) {
    await updateDownloadStatus(Status.UPLOADING);
    try {
    } catch (e) {
        await updateDownloadStatus(Status.UPLOADING_ERROR);
        throw e;
    }
}
async function removeTorrent(torrent: Torrent) {
    try {
        await transmission.torrentRemove(torrent.id);
    } catch (e) {
        await updateDownloadStatus(Status.UNEXPECTED_ERROR);
        throw e;
    }
}

async function updateDownloadStatus(status: Status) {
    await query(`UPDATE downloads SET status = ?, updatedAt = NOW(), ${status === Status.UPLOADING ? ', startedAt = NOW()' : (status > 1 ? ', endedAt = NOW()' : '')}`, [status]);
}

async function runDownload(download: Download) {
    await updateDownloadStatus(Status.DOWNLOADING);
    await transmission.addTorrent(`magnet:?xt=urn:btih:${download.hash}`, pathToSave);
}

function sleep(ms: number) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    });
}


const transmission = new TransmissionRPC();

`insert into downloads (kpId, rtId)  (select kpId, rtId from (
(select id from kp where rating > 7 and rating < 8.5 and year < 2000 limit 200)
union
(select id from kp where rating > 7 and rating < 8.5 and year < 2010 and year >= 2000 limit 250)
union
(select id from kp where rating > 7 and rating < 8.5 and year >= 2010 limit 250)
) as kpunion inner join kp_rt on kpunion.id = kp_rt.kpId)`;