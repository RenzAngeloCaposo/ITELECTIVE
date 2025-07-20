
import { auth, db } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  ref, set
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

document.querySelector('.register-btn').addEventListener('click', () =>
  document.querySelector('.container').classList.add('active'));
document.querySelector('.login-btn').addEventListener('click', () =>
  document.querySelector('.container').classList.remove('active'));

// Register
document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    await set(ref(db, 'users/' + userCred.user.uid), {
      email: email
    });
    alert("Registration successful!");
    window.location.href = "index.html";
  } catch (error) {
    alert("Registration error: " + error.message);
  }
});

// Login
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    alert("Login successful!");
    window.location.href = "MainPage.html";
  } catch (error) {
    alert("Login error: " + error.message);
  }
});
