const sqlite3 = require('sqlite3').verbose();
const path = require('path');

exports.handler = async (event, context) => {
  const db = new sqlite3.Database(path.join(__dirname, 'bible.db'));
  const references = event.queryStringParameters.references.split(',');
  
  // 여기에 기존 server.js의 쿼리 로직을 넣습니다.
  // 주의: 비동기 작업을 위해 Promise를 사용해야 합니다.

  return new Promise((resolve, reject) => {
    // 쿼리 로직 실행
    // 결과를 처리한 후 resolve 호출
    resolve({
      statusCode: 200,
      body: JSON.stringify(results)
    });
  });
};