
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAnJiOYAaA8ngYLZb0_NPZqTDyVVbXNSaY",
  authDomain: "ordinizer-9698d.firebaseapp.com",
  databaseURL: "https://ordinizer-9698d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ordinizer-9698d",
  storageBucket: "ordinizer-9698d.appspot.com",
  messagingSenderId: "360013646683",
  appId: "1:360013646683:web:8fe32f3ac44a69949ba87e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export { app, auth, db };
