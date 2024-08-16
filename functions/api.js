const db = require('./firebaseConfig'); // Firestore 초기화한 파일 가져오기

exports.handler = async (event, context) => {
    try {
        // 'references' 파라미터에서 데이터 추출
        const references = event.queryStringParameters.references.split(',');

        const results = await Promise.all(references.map(async (ref) => {
            // Firestore에서 문서를 검색하는 쿼리
            const snapshot = await db.collection('bible').doc(ref.trim()).get();
            if (snapshot.exists) {
                return snapshot.data();
            } else {
                return { error: `No data found for reference ${ref}` };
            }
        }));

        return {
            statusCode: 200,
            body: JSON.stringify(results),
        };
    } catch (error) {
        console.error('Firestore query error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Firestore query failed', details: error.message }),
        };
    }
};
