import {readFileSync} from 'fs';
import {query} from './db';
const csv = readFileSync('./category_2.csv', 'utf8');
const lines = csv.split('\n');
interface Movie {
    rId: number;
    hash: string;
    size: number;
    createdAt: Date;
    fullTitle: string;
    title: string | null;
    ruTitle: string | null;
    year: number | null;
    // type: string;
    // info: string;
}
const movies = [];
let unmatch = 0;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const parts = line.match(/^".*?";".*?";"(.*?)";"(.*?)";"(.*?)";"(.*?)";"(.*?)"$/);
    if (!parts) {
        throw new Error(line);
    }
    const rId = +parts[1];
    const hash = parts[2];
    const fullTitle = parts[3];
    const size = +parts[4];
    const createdAt = new Date(parts[5]);
    let ruTitle = null;
    let title = null;
    let year = null;
    let m = fullTitle.match(/^(.*?) *(?:\(.*?\))? *\[(\d{4}(?![pPi]))/);
    if (!m) {
        // console.log('----------------');
        m = fullTitle.match(/^(.*?)\(?(\d{4}(?![pPi])).*?$/);
        if (!m) {
            // console.log(fullTitle);
            unmatch++;
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
    // const type = m[3];
    // const info = m[5];
    const movie: Movie = {rId, hash, title, fullTitle, ruTitle, year, size, createdAt};
    movies.push(movie);
}
console.log(unmatch);
// console.log(movies);
async function insert(movies: Movie[]) {
    for (let i = 0; i < movies.length; i++) {
        const {title, ruTitle, fullTitle, year, rId, hash, size, createdAt} = movies[i];
        if (i % 100 === 0) {
            console.log(`${i}/${movies.length}`);
        }
        try {
            // console.log(movies[i]);
            await query('INSERT INTO rt (`title`, ruTitle, fullTitle, year, rId, `hash`, `size`, `createdAt`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [title, ruTitle, fullTitle, year, rId, hash, size, createdAt]);
        } catch (e) {
            console.error(`${e.message}, i:${i}, size:${size}`);
        }
    }
}

insert(movies).catch(e => console.error(e.stack));