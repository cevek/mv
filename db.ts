const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'rutracker'
});
connection.connect();

export function query<T>(sql: string, args?: (number | boolean | string | Date | null)[]) {
    return new Promise<T>((resolve, reject) => {
        connection.query(sql, args, (error: any, results: T) => {
            if (error) return reject(error);
            return resolve(results);
        });
    });
}

