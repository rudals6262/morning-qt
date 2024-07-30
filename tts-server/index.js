const textToSpeech = require('@google-cloud/text-to-speech');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const util = require('util');

// Google Cloud TTS client 설정
const client = new textToSpeech.TextToSpeechClient({
  keyFilename: 'path/to/your/service-account-file.json' // 서비스 계정 파일 경로
});

// Express 앱 설정
const app = express();
app.use(bodyParser.json());

// 음성 합성 엔드포인트
app.post('/synthesize', async (req, res) => {
  const text = req.body.text;

  const request = {
    input: { text },
    voice: { languageCode: 'ko-KR', ssmlGender: 'FEMALE' },
    audioConfig: { audioEncoding: 'MP3' },
  };

  const [response] = await client.synthesizeSpeech(request);
  const writeFile = util.promisify(fs.writeFile);
  await writeFile('output.mp3', response.audioContent, 'binary');

  res.sendFile(__dirname + '/output.mp3');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
