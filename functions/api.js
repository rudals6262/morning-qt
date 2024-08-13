const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 데이터베이스 연결
const dbPath = path.join(__dirname, '..', '..', 'database', 'bible.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
    } else {
        console.log("Connected to the SQLite database.");
    }
});

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    const references = event.queryStringParameters.references;

    if (!references) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing references parameter' })
        };
    }

    const referencesArray = references.split(',').map(ref => ref.trim());

    if (referencesArray.length === 0) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Empty references array' })
        };
    }

    try {
        const results = await Promise.all(referencesArray.map(async (ref) => {
            const match = ref.match(/^\[(\D+)(\d+)(?::(\d+)(?:-(\d+))?)?\]$/);
            if (!match) {
                return { error: 'Invalid reference format' };
            }

            const short_label = match[1];
            const chapter = parseInt(match[2], 10);
            const startParagraph = match[3] ? parseInt(match[3], 10) : null;
            const endParagraph = match[4] ? parseInt(match[4], 10) : startParagraph;

            return new Promise((resolve, reject) => {
                let sql, params;

                if (startParagraph === null) {
                    sql = `
                        SELECT chapter, paragraph, sentence, long_label 
                        FROM bible2 
                        WHERE short_label = ? AND chapter = ?
                        ORDER BY paragraph
                    `;
                    params = [short_label, chapter];
                } else {
                    sql = `
                        SELECT chapter, paragraph, sentence, long_label 
                        FROM bible2 
                        WHERE short_label = ? AND chapter = ? AND paragraph BETWEEN ? AND ?
                        ORDER BY paragraph
                    `;
                    params = [short_label, chapter, startParagraph, endParagraph];
                }

                db.all(sql, params, (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    const long_label = rows.length > 0 ? rows[0].long_label : '';
                    const refDisplay = startParagraph === null 
                    ? `[${long_label} ${chapter}장]` 
                    : `[${short_label}${chapter}:${startParagraph}${endParagraph !== startParagraph ? `-${endParagraph}` : ''}]`;
                           
                    resolve({ 
                        ref: refDisplay, 
                        rows, 
                        short_label, 
                        chapter,
                        copyRef: `[${short_label}${chapter}]`
                    });
                });
            });
        }));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(results)
        };
    } catch (error) {
        console.error('쿼리 실행 오류:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: '서버 오류', details: error.message })
        };
    }
};

// 프로세스 종료 시 데이터베이스 연결 닫기
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});
