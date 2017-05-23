import {query} from './db';

async function main() {
    const rows = await query<{id: number; title: string, year: number}[]>('SELECT * FROM kp');
    let nonmatched = 0;
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        let rutracker = await getRuTracker(`${row.title}`, row.year);
        if (!rutracker) {
            nonmatched++;
            console.log(`${row.title} (${row.year}) ----- ${rutracker ? rutracker.title : 'Not Found'}`);
        } else {
            try {
                // await query('INSERT INTO kp_rt (kpId, rtId) VALUES (?, ?)', [row.id, rutracker.id]);
            } catch (e) {
                console.error(`${e.message}`);
            }

        }
    }
    console.log(`Non matched ${nonmatched}/${rows.length}`);
}

async function getRuTracker(search: string, year: number):Promise<any> {
    const otherCond = ` AND size < 3600000000 AND (year = ? OR year = ? OR year = ?) AND (fullTitle LIKE "%orig%" OR fullTitle LIKE "%eng%") AND (fullTitle LIKE "%sub%")`;

    let res = (await query<any[]>(`SELECT * FROM rt2
            WHERE (title = ?) ${otherCond}
            ORDER BY size ASC LIMIT 10`,
        [search, search, year - 1, year, year + 1]));

    if (!res) {
        res = (await query<any[]>(`SELECT *, MATCH (fullTitle) AGAINST (? IN BOOLEAN MODE) as score 
            FROM rt2
            WHERE MATCH (fullTitle) AGAINST (? IN BOOLEAN MODE) ${otherCond}
            HAVING score > 10
            ORDER BY size ASC LIMIT 10`,
            [search, search, year - 1, year, year + 1]));
    }
    let filtered1 = res.filter((a:any) => a.fullTitle.match(/\beng\b/i));
    if (filtered1.length === 0) filtered1 = res;
    let filtered2 = filtered1.filter((a:any) => a.size > 1000 * 1000 * 1000);
    if (filtered2.length === 0) filtered2 = filtered1;

    return filtered2[0];
}


main();
