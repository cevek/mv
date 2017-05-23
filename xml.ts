import {query} from './db';
const fs = require('fs');
const path = require('path');
const XmlStream = require('xml-stream');

// Create a file stream and pass it to XmlStream
var stream = fs.createReadStream('/Users/cody/Downloads/backup.20170208185701.xml');
var xml = new XmlStream(stream);

xml.preserve('torrent', true);
// xml.collect('torrent');
let x = 0;

async function parse() {
    await query('truncate table rt2');
    xml.on('endElement: torrent', function (item: any) {
        // console.log(item.forum);
        x++;
        if (x % 100 === 0) console.log(x);
        const id = item.forum.$.id;
        if (id === '2221' || id === '2091' || id === '2092' || id === '2093' || id === '2200') {
            // console.log(item);
            const rId = item.$.id;
            const createdAt = item.$.registred_at;
            const size = item.$.size;
            const fullTitle = item.title.$text;
            const magnet = item.magnet.$text;
            const content = item.content.$text;
            let subtitles:string | null = extract(/^(.*?субтитр.*?)$/igm, content);
            let audio: string | null = extract(/^(.*?аудио(?! *кодек).*?)$/igm, content);
            const {year, ruTitle, title} = parseTitle(fullTitle);
            if (subtitles.length > 500) subtitles = null;
            if (audio.length > 500) audio = null;
            query('INSERT INTO rt2 (`title`, ruTitle, fullTitle, year, rId, `hash`, `size`, `createdAt`, subtitles, audio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [title, ruTitle, fullTitle, year, rId, magnet, size, createdAt, subtitles, audio]);
            // console.log({rtId, year, ruTitle, title, size, createdAt, fullTitle, magnet, subtitles, audio});
        }
    });
}

parse();

function extract(regExp: RegExp, str: string) {
    let m;
    let s = '';
    while (m = regExp.exec(str)) {
        s += m[1] + '\n';
    }
    return s.replace(/\[[^\]]+\]/g, '').trim();
}

function parseTitle(fullTitle: string) {
    let year;
    let ruTitle;
    let title;
    let m = fullTitle.match(/^(.*?) *(?:\(.*?\))? *\[(\d{4}(?![pPi]))/);
    if (!m) {
        // console.log('----------------');
        m = fullTitle.match(/^(.*?)\(?(\d{4}(?![pPi])).*?$/);
        if (!m) {
            // console.log(fullTitle);
        } else {
            // console.log('found', fullTitle);
        }
    }
    if (m) {
        year = +m[2];
        if (year === 1080) year = null;
        const names = m[1].split('/');
        ruTitle = (names[0] || '').trim();
        title = (names[1] || '').trim();
    }
    return {year, ruTitle, title};
}