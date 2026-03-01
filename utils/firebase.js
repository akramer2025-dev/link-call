// Firebase Firestore helper - shared across all API files
// Project: akramplatform-2c6be

let _app = null;
let _db = null;

function getFirebaseApp() {
    if (_app) return _app;
    const { initializeApp, getApps } = require('firebase/app');
    const firebaseConfig = {
        apiKey: "AIzaSyB9rVI5Fn96Mhm6x6aVcKrf8_epQ_c9H4s",
        authDomain: "akramplatform-2c6be.firebaseapp.com",
        projectId: "akramplatform-2c6be",
        storageBucket: "akramplatform-2c6be.firebasestorage.app",
        messagingSenderId: "132959399686",
        appId: "1:132959399686:web:7f1db74b25bebe27a8f887"
    };
    const apps = getApps();
    _app = apps.length === 0 ? initializeApp(firebaseConfig) : apps[0];
    console.log('✅ Firebase initialized - project: akramplatform-2c6be');
    return _app;
}

function getDb() {
    if (_db) return _db;
    const { getFirestore } = require('firebase/firestore');
    _db = getFirestore(getFirebaseApp());
    return _db;
}

module.exports = { getDb };
