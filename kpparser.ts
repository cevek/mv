import {getUrl, parseDocument, setCacheDir} from '../parsers-lib/requester';
import {getAttr, getNode, getNodeList, getRegexpValue, getText, getTextOrNull, num} from '../parsers-lib/dom-helpers';
import {query} from './db';
const iconv = require('iconv-lite');

interface Movie {
    title: string;
    year: number;
    kpId: number;
    rating: number;
    ruTitle: string;
    info: string;
}
async function parseKPPage(decade: number, page: number) {
    const url = `https://www.kinopoisk.ru/top/navigator/m_act%5Begenre%5D/1750,12,1747,25,999,26,1/m_act%5Bdecade%5D/${decade}/m_act%5Bnum_vote%5D/750/m_act%5Brating%5D/6.7:/m_act%5Btomat_rating%5D/30:/m_act%5Breview_procent%5D/50:/order/rating/perpage/200/page/${page}/`;
    let html = await getUrl(url, {requestOptions: {encoding: null}, skipCache: false});
    html = iconv.decode(html, 'win-1251');
    const doc = await parseDocument(html);
    const list = getNodeList(doc, 'div.item');
    const movies: Movie[] = [];
    for (let i = 0; i < list.length; i++) {
        const div = list[i];
        const enTitleWithYear = getText(getNode(div, '.info .name span').firstChild);
        const title = getRegexpValue(enTitleWithYear, /^(.*?)? ?\(\d+\)$/);
        if (!title) continue;
        const kpId = num(getRegexpValue(getAttr(getNode(div, '.poster a'), 'href'), /\/(\d+)\/$/));
        const ruTitle = getText(div, '.info .name a');
        const year = num(getRegexpValue(enTitleWithYear, /\((\d+)\)$/));
        const rating = num(getAttr(getNode(div, '.WidgetStars'), 'value'));
        let info = getText(div, '.info .gray_text:nth-child(2)').replace(/\s+/g, ' ').replace('...', '');
        info += ' ' +(getTextOrNull(div, '.info .gray_text:nth-child(3)') || '').replace(', ...', '');
        // movies.push({title, year, kpId, rating, ruTitle, info});
        await insert({title, year, kpId, rating, ruTitle, info});
    }
    return movies;
}

async function insert(movie: Movie) {
    const {title, ruTitle, info, kpId, rating, year} = movie;
    // console.log(`${i}/${movies.length}`);
    try {
        await query('INSERT INTO kp (title, ruTitle, info, kpId, rating, year) VALUES (?, ?, ?, ?, ?, ?)', [title, ruTitle, info, kpId, rating, year]);
    } catch (e) {
        console.error(`${e.message}`);
    }
}

async function parseKP() {
    await parseKPPage(1990, 1);
    for (let i = 1990; i <= 2010; i += 10) {
        for (let j = 1; j <= 4; j++) {
            await parseKPPage(i, j);
        }
    }
}

setCacheDir(__dirname + '/cache/');
parseKP().catch(err => console.error(err.stack));