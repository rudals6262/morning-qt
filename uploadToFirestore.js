const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');
const fs = require('fs');


const firebaseConfig = {
    apiKey: "AIzaSyBe3wWDbyLvPvzHTtvpnXnJNlDOqEVlHNU",
    authDomain: "mornig-qt.firebaseapp.com",
    projectId: "mornig-qt",
    storageBucket: "mornig-qt.appspot.com",
    messagingSenderId: "1083392972716",
    appId: "1:1083392972716:web:f359cdd776f0c0d7fb4c09",
    measurementId: "G-FW5QEZPB5H"
  };

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// JSON 파일 읽기
const bibleData = JSON.parse(fs.readFileSync('bible2.json', 'utf8'));

// Firestore에 데이터 업로드
async function uploadData() {
    for (const item of bibleData) {
        try {
            // Firestore에 문서 업로드
            const docRef = doc(collection(db, 'bible'), item.idx.toString());
            await setDoc(docRef, item);
            console.log(`Document ${item.idx} uploaded successfully`);
        } catch (error) {
            console.error(`Error uploading document ${item.idx}:`, error);
        }
    }
}

uploadData().then(() => {
    console.log('All data uploaded');
    process.exit(0);
}).catch(error => {
    console.error('Error uploading data:', error);
    process.exit(1);
});