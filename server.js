const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const db = new sqlite3.Database('bible.db');

// CORS 설정
app.use(cors());

// 정적 파일 서빙
app.use(express.static(path.join(__dirname)));

// 루트 경로 처리
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API 엔드포인트
app.get('/api/texts', (req, res) => {
    console.log('Received request with references:', req.query.references);

    const references = req.query.references.split(',');
    const queries = references.map(ref => {
        const match = ref.match(/^\[(\D+)(\d+)(?::(\d+)(?:-(\d+))?)?\]$/);
        if (!match) return null;

        const short_label = match[1];
        const chapter = parseInt(match[2], 10);
        const startParagraph = match[3] ? parseInt(match[3], 10) : null;
        const endParagraph = match[4] ? parseInt(match[4], 10) : startParagraph;

        return { short_label, chapter, startParagraph, endParagraph };
    });

    if (queries.some(q => q === null)) {
        console.error('Invalid reference format');
        res.status(400).send('잘못된 참조 형식');
        return;
    }

    const results = [];
    const promises = queries.map(({ short_label, chapter, startParagraph, endParagraph }) => {
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
                    console.error('Database error:', err);
                    reject(err);
                    return;
                }
                const long_label = rows.length > 0 ? rows[0].long_label : '';
                const refDisplay = startParagraph === null 
                ? `[${long_label} ${chapter}장]` 
                : `[${short_label}${chapter}:${startParagraph}${endParagraph !== startParagraph ? `-${endParagraph}` : ''}]`;
                       
                results.push({ 
                    ref: refDisplay, 
                    rows, 
                    short_label, 
                    chapter,
                    copyRef: `[${short_label}${chapter}]`  // 복사용 참조 추가
                });
                resolve();
            });
        });
    });

    Promise.all(promises)
        .then(() => {
            res.json(results);
        })
        .catch(err => {
            console.error('쿼리 실행 오류:', err);
            res.status(500).json({ error: '서버 오류', details: err.message });
        });
});

// 404 에러 처리
app.use((req, res, next) => {
    res.status(404).send("Sorry, that route doesn't exist.");
});

// 오류 처리 미들웨어
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

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