const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('bible.db');

db.serialize(() => {
    db.all("SELECT * FROM bible_table", (err, rows) => { bible
        if (err) {
            console.error(err.message);
            return;
        }

        // JSON 파일로 변환
        const jsonData = JSON.stringify(rows, null, 2);
        fs.writeFileSync('bible.json', jsonData);
        console.log('Data has been written to bible.json');
    });
});

db.close();
