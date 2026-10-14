/*
 * Подключение к Firebase.
 * Эти ключи публичные по задумке Firebase (не секрет) — настоящая защита
 * базы данных находится в Firestore Security Rules, а не в сокрытии ключей.
 */
var firebaseConfig = {
    apiKey: "AIzaSyAaYWmnug_o0dZtXL2zhOMG5rF2yDbkq90",
    authDomain: "amre-kyzmet.firebaseapp.com",
    projectId: "amre-kyzmet",
    storageBucket: "amre-kyzmet.firebasestorage.app",
    messagingSenderId: "153454964918",
    appId: "1:153454964918:web:148626c9eb5d7c718b7617",
    measurementId: "G-M9WV1YH9FX"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();
