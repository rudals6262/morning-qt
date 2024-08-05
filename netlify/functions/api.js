const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('bible.db');

exports.handler = async (event, context) => {
  const references = event.queryStringParameters.references.split(',');
  // 여기에 기존 server.js의 쿼리 로직을 넣습니다.
  
  // 결과 반환
  return {
    statusCode: 200,
    body: JSON.stringify(results)
  };
};