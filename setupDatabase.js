const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('bible.db');

const sqlFile = 'bible2.sql'; // SQL 파일 이름

fs.readFile(sqlFile, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading SQL file:', err);
        return;
    }

    const sqliteData = data.replace(/SET [^;]+;/g, '')
                           .replace(/\/\*[^*]*\*\/\s*/g, '');

    db.serialize(() => {
        db.run('PRAGMA foreign_keys=OFF;');
        db.exec(sqliteData, (err) => {
            if (err) {
                console.error('Error executing SQL:', err);
            } else {
                console.log('Database setup complete.');
            }
            db.close();
        });
    });
});
