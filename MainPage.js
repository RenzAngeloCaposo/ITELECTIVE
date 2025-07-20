// Responsive and tab navigation logic
const tabs = {
    todo: document.getElementById('tab-todo'),
    gwa: document.getElementById('tab-gwa'),
    timer: document.getElementById('tab-timer'),
    flashcards: document.getElementById('tab-flashcards'),
    topics: document.getElementById('tab-topics'),
    schedule: document.getElementById('tab-schedule'),
    quiz: document.getElementById('tab-quiz'),
    exams: document.getElementById('tab-exams')
};
const buttons = {
    todo: document.getElementById('btn-todo'),
    gwa: document.getElementById('btn-gwa'),
    timer: document.getElementById('btn-timer'),
    flashcards: document.getElementById('btn-flashcards'),
    topics: document.getElementById('btn-topics'),
    schedule: document.getElementById('btn-schedule'),
    quiz: document.getElementById('btn-quiz'),
    exams: document.getElementById('btn-exams')
};

function activateTab(tabName) {
    // Deactivate all tabs and buttons
    Object.keys(tabs).forEach(t => {
        tabs[t].classList.remove('active');
        buttons[t].classList.remove('active');
        buttons[t].setAttribute('aria-selected', 'false');
        buttons[t].tabIndex = -1;
    });
    // Activate selected tab/button
    tabs[tabName].classList.add('active');
    buttons[tabName].classList.add('active');
    buttons[tabName].setAttribute('aria-selected', 'true');
    buttons[tabName].tabIndex = 0;
    buttons[tabName].focus();
}

Object.entries(buttons).forEach(([key, btn]) => {
    btn.addEventListener('click', () => activateTab(key));
    btn.addEventListener('keydown', (ev) => {
        if (ev.key === 'ArrowDown' || ev.key === 'ArrowRight') {
            ev.preventDefault();
            const keys = Object.keys(buttons);
            let idx = keys.indexOf(key);
            idx = (idx + 1) % keys.length;
            buttons[keys[idx]].focus();
        } else if (ev.key === "ArrowUp" || ev.key === "ArrowLeft") {
            ev.preventDefault();
            const keys = Object.keys(buttons);
            let idx = keys.indexOf(key);
            idx = (idx - 1 + keys.length) % keys.length;
            buttons[keys[idx]].focus();
        }
    });
});

// Toast notification
const toastEl = document.getElementById('toast');
let toastTimeout;
function showToast(message) {
    clearTimeout(toastTimeout);
    toastEl.textContent = message;
    toastEl.classList.add('show');
    toastTimeout = setTimeout(() => {
        toastEl.classList.remove('show');
    }, 3000);
}

// STORAGE KEYS for Local Storage (These will be phased out as features move to Firebase)
// You can remove this section entirely once all features use Firebase
const STORAGE_KEYS = {
    todo: 'ordenizer_todo_items',
    gwa: 'ordenizer_gwa_courses',
    timer: 'ordenizer_timer',
    flashcards: 'ordenizer_flashcards',
    topics: 'ordenizer_topics',
    schedule: 'ordenizer_schedule',
    quiz: 'ordenizer_quizzes',
    exams: 'ordenizer_exams'
};

// --- Firebase Imports and Initialization ---
// Make sure to import onAuthStateChanged and onValue for real-time data listening
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { ref, push, set, onValue, remove } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

const auth = getAuth();
const db = window.firebaseDB; // Your initialized Firebase DB instance from MainPage.html

let currentUserId = null; // This will store the UID of the currently logged-in user

// --- Authentication State Listener (CRUCIAL for user-specific data) ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        currentUserId = user.uid;
        console.log("User logged in with UID:", currentUserId);

        // Load user-specific data for ALL FEATURES from Firebase here
        loadTodoFromFirebase();
        loadGwaFromFirebase();
        loadTimerFromFirebase(); // New function for timer
        loadFlashcardsFromFirebase();
        loadTopicsFromFirebase();
        loadScheduleFromFirebase();
        loadQuizzesFromFirebase();
        loadExamsFromFirebase();

    } else {
        // User is signed out
        currentUserId = null;
        console.log("User logged out.");

        // Clear local data for ALL FEATURES when user logs out
        todoItems = [];
        renderTodo();

        gwaCourses = [];
        renderGwa();

        // Clear timer state
        pauseTimer(); // Ensure timer stops
        remainingSeconds = 0;
        updateTimerDisplay();

        flashcards = [];
        renderFlashcardsList();
        renderFlashcard(0); // Show empty flashcard

        topics = [];
        renderTopics();

        scheduleItems = [];
        renderSchedule();

        quizzes = [];
        renderQuizzes();

        exams = [];
        renderExams();

        // Optionally, redirect to login page if user is not logged in on page load
        // window.location.href = "index.html";
    }
});

// -------------- To-Do List --------------
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoListEl = document.getElementById('todo-list');
const clearCompletedBtn = document.getElementById('clear-completed');

let todoItems = [];

// --- Firebase To-Do functions ---
function getTodoRef() {
    if (!currentUserId) {
        console.error("No user logged in to get todo reference.");
        return null;
    }
    return ref(db, `users/${currentUserId}/todoItems`);
}

function saveTodoToFirebase() {
    const todoRef = getTodoRef();
    if (todoRef) {
        set(todoRef, todoItems)
            .then(() => console.log("To-Do items saved to Firebase."))
            .catch(error => console.error("Error saving To-Do items:", error));
    }
}

function loadTodoFromFirebase() {
    const todoRef = getTodoRef();
    if (todoRef) {
        // onValue listens for real-time updates
        onValue(todoRef, (snapshot) => {
            const data = snapshot.val();
            todoItems = data ? data : []; // If data is null, initialize as empty array
            renderTodo(); // Always re-render when data changes
            console.log("To-Do items loaded/updated from Firebase.");
        }, (error) => {
            console.error("Error loading To-Do items:", error);
        });
    } else {
        // If no user, ensure local list is empty and rendered
        todoItems = [];
        renderTodo();
    }
}

// Remove localStorage functions for To-Do:
// function saveTodo() { localStorage.setItem(STORAGE_KEYS.todo, JSON.stringify(todoItems)); }
// function loadTodo() { const data = localStorage.getItem(STORAGE_KEYS.todo); todoItems = data ? JSON.parse(data) : []; }

function renderTodo() {
    todoListEl.innerHTML = '';
    if (todoItems.length === 0 && currentUserId) { // Only show message if user is logged in and no items
        const emptyState = document.createElement('li');
        emptyState.textContent = "No tasks yet! Add one above.";
        emptyState.style.textAlign = "center";
        emptyState.style.color = "#ccc";
        todoListEl.appendChild(emptyState);
    }
    todoItems.forEach((item, i) => {
        const li = document.createElement('li');
        li.textContent = item.text;
        li.className = item.completed ? 'completed' : '';
        li.setAttribute('tabindex', '0');
        li.setAttribute('role', 'checkbox');
        li.setAttribute('aria-checked', item.completed);
        li.addEventListener('click', () => toggleTodo(i));
        li.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleTodo(i);
            }
        });

        // Delete icon
        const delIcon = document.createElement('span');
        delIcon.className = 'material-icons';
        delIcon.textContent = 'delete';
        delIcon.setAttribute('role', 'button');
        delIcon.setAttribute('aria-label', 'Delete task');
        delIcon.addEventListener('click', (ev) => {
            ev.stopPropagation();
            deleteTodo(i);
        });
        li.appendChild(delIcon);

        todoListEl.appendChild(li);
    });
}
function addTodo(text) {
    todoItems.push({ text, completed: false });
    saveTodoToFirebase(); // <--- Call Firebase save
    renderTodo(); // Render immediately for responsiveness
}
function toggleTodo(index) {
    todoItems[index].completed = !todoItems[index].completed;
    saveTodoToFirebase(); // <--- Call Firebase save
    renderTodo();
}
function deleteTodo(index) {
    todoItems.splice(index, 1);
    saveTodoToFirebase(); // <--- Call Firebase save
    renderTodo();
    showToast('Task deleted');
}
clearCompletedBtn.addEventListener('click', () => {
    todoItems = todoItems.filter(item => !item.completed);
    saveTodoToFirebase(); // <--- Call Firebase save
    renderTodo();
    showToast('Completed tasks cleared');
});

todoForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const text = todoInput.value.trim();
    if (text) {
        addTodo(text);
        todoInput.value = '';
        showToast('Task added');
    }
});

// -------------- GWA Calculator --------------
const gwaForm = document.querySelector('#gwa-form form');
const gwaCoursesEl = document.getElementById('gwa-courses');
const gwaResultEl = document.getElementById('gwa-result');
const clearGwaBtn = document.getElementById('clear-gwa');

let gwaCourses = [];

// --- Firebase GWA functions ---
function getGwaRef() {
    if (!currentUserId) {
        console.error("No user logged in to get GWA reference.");
        return null;
    }
    return ref(db, `users/${currentUserId}/gwaCourses`);
}

function saveGwaToFirebase() {
    const gwaRef = getGwaRef();
    if (gwaRef) {
        set(gwaRef, gwaCourses)
            .then(() => console.log("GWA courses saved to Firebase."))
            .catch(error => console.error("Error saving GWA courses:", error));
    }
}

function loadGwaFromFirebase() {
    const gwaRef = getGwaRef();
    if (gwaRef) {
        onValue(gwaRef, (snapshot) => {
            const data = snapshot.val();
            gwaCourses = data ? data : [];
            renderGwa();
            console.log("GWA courses loaded/updated from Firebase.");
        }, (error) => {
            console.error("Error loading GWA courses:", error);
        });
    } else {
        gwaCourses = [];
        renderGwa();
    }
}

// Remove localStorage functions for GWA:
// function saveGwa() { localStorage.setItem(STORAGE_KEYS.gwa, JSON.stringify(gwaCourses)); }
// function loadGwa() { const data = localStorage.getItem(STORAGE_KEYS.gwa); gwaCourses = data ? JSON.parse(data) : []; }

function renderGwa() {
    gwaCoursesEl.innerHTML = '';
    if (gwaCourses.length === 0 && currentUserId) {
        const emptyState = document.createElement('li');
        emptyState.textContent = "No courses yet! Add one above.";
        emptyState.style.textAlign = "center";
        emptyState.style.color = "#ccc";
        gwaCoursesEl.appendChild(emptyState);
    }
    let totalGrades = 0;
    let count = 0;

    gwaCourses.forEach(({ course, grade }, index) => {
        const li = document.createElement('li');
        li.textContent = `${course}: ${grade.toFixed(2)}`;
        li.className = 'todo-list-item'; // Re-using class for styling consistent with todo

        // Delete icon for each course
        const delBtn = document.createElement('span');
        delBtn.className = 'material-icons';
        delBtn.textContent = 'delete';
        delBtn.setAttribute('role', 'button');
        delBtn.setAttribute('aria-label', `Delete course ${course}`);
        delBtn.style.cursor = 'pointer';
        delBtn.addEventListener('click', () => {
            gwaCourses.splice(index, 1);
            saveGwaToFirebase(); // <--- Call Firebase save
            renderGwa();
            showToast('Course removed');
        });

        li.style.padding = '10px 0';
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        li.appendChild(delBtn);
        gwaCoursesEl.appendChild(li);
        totalGrades += grade;
        count++;
    });
    let gwa = count ? (totalGrades / count).toFixed(3) : 'N/A';
    gwaResultEl.textContent = gwa;
}

gwaForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const courseInput = document.getElementById('course-name');
    const gradeInput = document.getElementById('course-grade');
    let course = courseInput.value.trim();
    let grade = parseFloat(gradeInput.value);
    if (!course || isNaN(grade) || grade < 1 || grade > 5) {
        alert("Please enter valid course name and grade between 1.0 and 5.0.");
        return;
    }
    gwaCourses.push({ course, grade });
    saveGwaToFirebase(); // <--- Call Firebase save
    renderGwa();
    courseInput.value = '';
    gradeInput.value = '';
    showToast('Course added');
});

clearGwaBtn.addEventListener('click', () => {
    gwaCourses = [];
    saveGwaToFirebase(); // <--- Call Firebase save
    renderGwa();
    showToast('All courses removed');
});

// -------------- Timer --------------
const timerDisplay = document.getElementById('timer-display');
const timerAddMinutesInput = document.getElementById('timer-add-minutes');
const timerAddBtn = document.getElementById('timer-add-btn');
const timerStartBtn = document.getElementById('timer-start-btn');
const timerResetBtn = document.getElementById('timer-reset-btn');

let timerInterval = null;
let remainingSeconds = 0;
let timerRunning = false;

// --- Firebase Timer functions ---
function getTimerRef() {
    if (!currentUserId) {
        console.error("No user logged in to get timer reference.");
        return null;
    }
    return ref(db, `users/${currentUserId}/timer`);
}

function saveTimerToFirebase() {
    const timerRef = getTimerRef();
    if (timerRef) {
        const timerData = {
            remainingSeconds,
            timerRunning,
            timestamp: Date.now() // Save timestamp to resume accurately
        };
        set(timerRef, timerData)
            .then(() => console.log("Timer state saved to Firebase."))
            .catch(error => console.error("Error saving timer state:", error));
    }
}

function loadTimerFromFirebase() {
    const timerRef = getTimerRef();
    if (timerRef) {
        onValue(timerRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                remainingSeconds = data.remainingSeconds;
                timerRunning = data.timerRunning;
                if (timerRunning) {
                    // Recalculate remaining time if timer was running
                    const elapsed = (Date.now() - data.timestamp) / 1000;
                    remainingSeconds = Math.max(0, remainingSeconds - elapsed);
                    startTimer(); // Restart timer if it was running
                } else {
                    updateTimerDisplay(); // Just update display if paused
                }
            } else {
                remainingSeconds = 0;
                timerRunning = false;
                updateTimerDisplay();
            }
            console.log("Timer state loaded/updated from Firebase.");
        }, (error) => {
            console.error("Error loading timer state:", error);
        });
    } else {
        remainingSeconds = 0;
        timerRunning = false;
        updateTimerDisplay();
    }
}

// Remove localStorage functions for Timer:
// function saveTimer() { /* ... */ }
// function loadTimer() { /* ... */ }

function updateTimerDisplay() {
    const hrs = Math.floor(remainingSeconds / 3600);
    const mins = Math.floor((remainingSeconds % 3600) / 60);
    const secs = Math.floor(remainingSeconds % 60);
    timerDisplay.textContent =
        `${hrs.toString().padStart(2, '0')}:` +
        `${mins.toString().padStart(2, '0')}:` +
        `${secs.toString().padStart(2, '0')}`;
}
function startTimer() {
    if (timerRunning) return;
    if (remainingSeconds === 0) {
        showToast('Add time before starting timer');
        return;
    }
    timerRunning = true;
    saveTimerToFirebase(); // <--- Call Firebase save
    timerStartBtn.textContent = 'Pause';
    timerStartBtn.setAttribute('aria-label', 'Pause Timer');

    timerInterval = setInterval(() => {
        if (remainingSeconds <= 0) {
            clearInterval(timerInterval);
            timerRunning = false;
            remainingSeconds = 0; // Ensure it's truly 0
            updateTimerDisplay();
            saveTimerToFirebase(); // <--- Call Firebase save
            timerStartBtn.textContent = 'Start';
            timerStartBtn.setAttribute('aria-label', 'Start Timer');
            showToast('Timer finished!');
            return;
        }
        remainingSeconds--;
        updateTimerDisplay();
    }, 1000);
}
function pauseTimer() {
    timerRunning = false;
    clearInterval(timerInterval);
    timerStartBtn.textContent = 'Start';
    timerStartBtn.setAttribute('aria-label', 'Start Timer');
    saveTimerToFirebase(); // <--- Call Firebase save
}
timerAddBtn.addEventListener('click', () => {
    let toAdd = parseInt(timerAddMinutesInput.value, 10);
    if (isNaN(toAdd) || toAdd <= 0) {
        alert('Please enter a positive number of minutes');
        return;
    }
    remainingSeconds += toAdd * 60;
    updateTimerDisplay();
    saveTimerToFirebase(); // <--- Call Firebase save
    showToast(`Added ${toAdd} minute${toAdd > 1 ? 's' : ''}`);
});
timerStartBtn.addEventListener('click', () => {
    if (timerRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
});
timerResetBtn.addEventListener('click', () => {
    pauseTimer(); // Stop timer if running
    remainingSeconds = 0;
    updateTimerDisplay();
    saveTimerToFirebase(); // <--- Call Firebase save
    showToast('Timer reset');
});

// Initial display, actual loading done by onAuthStateChanged
updateTimerDisplay();

// -------------- Flashcards --------------
const flashcardEl = document.getElementById('flashcard');
const flashcardContainer = document.querySelector('.flashcard-container');
const flashcardForm = document.getElementById('flashcard-form');
const flashcardQuestion = document.getElementById('flashcard-question');
const flashcardAnswer = document.getElementById('flashcard-answer');
const flashcardsList = document.getElementById('flashcards-list');
const flashcardClearBtn = document.getElementById('flashcard-clear');

let flashcards = [];
let currentFlashcardIndex = 0;
let isFront = true;

// --- Firebase Flashcards functions ---
function getFlashcardsRef() {
    if (!currentUserId) {
        console.error("No user logged in to get flashcards reference.");
        return null;
    }
    return ref(db, `users/${currentUserId}/flashcards`);
}

function saveFlashcardsToFirebase() {
    const flashcardsRef = getFlashcardsRef();
    if (flashcardsRef) {
        set(flashcardsRef, flashcards)
            .then(() => console.log("Flashcards saved to Firebase."))
            .catch(error => console.error("Error saving flashcards:", error));
    }
}

function loadFlashcardsFromFirebase() {
    const flashcardsRef = getFlashcardsRef();
    if (flashcardsRef) {
        onValue(flashcardsRef, (snapshot) => {
            const data = snapshot.val();
            flashcards = data ? data : [];
            renderFlashcardsList();
            // Reset index and render current card if cards exist, otherwise show empty state
            currentFlashcardIndex = 0; // Always start at the first card on load
            isFront = true;
            renderFlashcard(currentFlashcardIndex);
            console.log("Flashcards loaded/updated from Firebase.");
        }, (error) => {
            console.error("Error loading flashcards:", error);
        });
    } else {
        flashcards = [];
        renderFlashcardsList();
        renderFlashcard(0);
    }
}

// Remove localStorage functions for Flashcards:
// function saveFlashcards() { /* ... */ }
// function loadFlashcards() { /* ... */ }

function renderFlashcard(index) {
    if (!flashcards.length) {
        flashcardEl.querySelector('.front').textContent = 'Add question here';
        flashcardEl.querySelector('.back').textContent = 'Add answer here';
        isFront = true;
        flashcardEl.classList.remove('flipped');
        return;
    }
    // Ensure index is within bounds
    if (index < 0) index = flashcards.length - 1;
    if (index >= flashcards.length) index = 0;
    currentFlashcardIndex = index;

    const card = flashcards[index];
    flashcardEl.querySelector('.front').textContent = card.question || 'No question';
    flashcardEl.querySelector('.back').textContent = card.answer || 'No answer';
    if (isFront) flashcardEl.classList.remove('flipped');
    else flashcardEl.classList.add('flipped');
}
function renderFlashcardsList() {
    flashcardsList.innerHTML = '';
    if (flashcards.length === 0 && currentUserId) {
        const emptyState = document.createElement('li');
        emptyState.textContent = "No flashcards yet! Add one using the form.";
        emptyState.style.textAlign = "center";
        emptyState.style.color = "#ccc";
        flashcardsList.appendChild(emptyState);
    }
    flashcards.forEach((card, i) => {
        const li = document.createElement('li');
        li.textContent = card.question;
        li.style.cursor = 'pointer';
        li.setAttribute('tabindex', '0');
        li.addEventListener('click', () => {
            currentFlashcardIndex = i;
            isFront = true;
            renderFlashcard(currentFlashcardIndex);
        });
        li.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                currentFlashcardIndex = i;
                isFront = true;
                renderFlashcard(currentFlashcardIndex);
            }
        });
        flashcardsList.appendChild(li);
    });
}

flashcardEl.addEventListener('click', () => {
    if (!flashcards.length) return;
    isFront = !isFront;
    flashcardEl.classList.toggle('flipped', !isFront);
});

flashcardContainer.addEventListener('keydown', e => {
    if (flashcards.length === 0) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        currentFlashcardIndex++;
        isFront = true;
        renderFlashcard(currentFlashcardIndex);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        currentFlashcardIndex--;
        isFront = true;
        renderFlashcard(currentFlashcardIndex);
    } else if (e.key === ' ') {
        e.preventDefault();
        isFront = !isFront;
        flashcardEl.classList.toggle('flipped', !isFront);
    }
});

flashcardForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const q = flashcardQuestion.value.trim();
    const a = flashcardAnswer.value.trim();
    if (!q || !a) {
        alert('Please fill both question and answer');
        return;
    }
    flashcards.push({ question: q, answer: a });
    saveFlashcardsToFirebase(); // <--- Call Firebase save
    renderFlashcardsList();
    currentFlashcardIndex = flashcards.length - 1;
    isFront = true;
    renderFlashcard(currentFlashcardIndex);
    flashcardForm.reset();
    showToast('Flashcard added');
});

flashcardClearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all flashcards?')) {
        flashcards = [];
        saveFlashcardsToFirebase(); // <--- Call Firebase save
        renderFlashcardsList();
        renderFlashcard(0);
        showToast('All flashcards cleared');
    }
});

// -------------- Topics Encoder --------------
const topicsForm = document.getElementById('topics-form');
const topicTitleInput = document.getElementById('topic-title');
const topicContentInput = document.getElementById('topic-content');
const topicsListEl = document.getElementById('topics-list');

let topics = [];

// --- Firebase Topics functions ---
function getTopicsRef() {
    if (!currentUserId) {
        console.error("No user logged in to get topics reference.");
        return null;
    }
    return ref(db, `users/${currentUserId}/topics`);
}

function saveTopicsToFirebase() {
    const topicsRef = getTopicsRef();
    if (topicsRef) {
        set(topicsRef, topics)
            .then(() => console.log("Topics saved to Firebase."))
            .catch(error => console.error("Error saving topics:", error));
    }
}

function loadTopicsFromFirebase() {
    const topicsRef = getTopicsRef();
    if (topicsRef) {
        onValue(topicsRef, (snapshot) => {
            const data = snapshot.val();
            topics = data ? data : [];
            renderTopics();
            console.log("Topics loaded/updated from Firebase.");
        }, (error) => {
            console.error("Error loading topics:", error);
        });
    } else {
        topics = [];
        renderTopics();
    }
}

// Remove localStorage functions for Topics:
// function saveTopics() { /* ... */ }
// function loadTopics() { /* ... */ }

function renderTopics() {
    topicsListEl.innerHTML = '';
    if (topics.length === 0 && currentUserId) {
        const emptyState = document.createElement('li');
        emptyState.textContent = "No topics yet! Add one using the form.";
        emptyState.style.textAlign = "center";
        emptyState.style.color = "#ccc";
        topicsListEl.appendChild(emptyState);
    }
    topics.forEach((topic, i) => {
        const li = document.createElement('li');
        li.style.background = '#2563ebcc';
        li.style.borderRadius = '14px';
        li.style.padding = '10px 16px';
        li.style.marginBottom = '10px';
        li.style.boxShadow = '0 0 8px rgba(37, 99, 235, 0.4)';
        li.style.userSelect = 'none';

        const title = document.createElement('strong');
        title.textContent = topic.title;
        title.style.display = 'block';
        title.style.marginBottom = '6px';
        title.style.color = '#38bdf8';

        const content = document.createElement('div');
        content.textContent = topic.details;

        // Delete btn
        const delBtn = document.createElement('span');
        delBtn.className = 'material-icons';
        delBtn.textContent = 'delete';
        delBtn.style.float = 'right';
        delBtn.style.cursor = 'pointer';
        delBtn.setAttribute('role', 'button');
        delBtn.setAttribute('aria-label', 'Delete topic');
        delBtn.addEventListener('click', () => {
            topics.splice(i, 1);
            saveTopicsToFirebase(); // <--- Call Firebase save
            renderTopics();
            showToast('Topic deleted');
        });

        li.appendChild(delBtn);
        li.appendChild(title);
        li.appendChild(content);
        topicsListEl.appendChild(li);
    });
}
topicsForm.addEventListener('submit', ev => {
    ev.preventDefault();
    const title = topicTitleInput.value.trim();
    const details = topicContentInput.value.trim();
    if (!title || !details) {
        alert('Please fill title and details');
        return;
    }
    topics.push({ title, details });
    saveTopicsToFirebase(); // <--- Call Firebase save
    renderTopics();
    topicsForm.reset();
    showToast('Topic added');
});

// -------------- Class Schedule --------------
const scheduleForm = document.getElementById('schedule-form');
const scheduleListEl = document.getElementById('schedule-list');
const clearScheduleBtn = document.getElementById('clear-schedule');

let scheduleItems = [];

// --- Firebase Schedule functions ---
function getScheduleRef() {
    if (!currentUserId) {
        console.error("No user logged in to get schedule reference.");
        return null;
    }
    return ref(db, `users/${currentUserId}/schedule`);
}

function saveScheduleToFirebase() {
    const scheduleRef = getScheduleRef();
    if (scheduleRef) {
        set(scheduleRef, scheduleItems)
            .then(() => console.log("Schedule saved to Firebase."))
            .catch(error => console.error("Error saving schedule:", error));
    }
}

function loadScheduleFromFirebase() {
    const scheduleRef = getScheduleRef();
    if (scheduleRef) {
        onValue(scheduleRef, (snapshot) => {
            const data = snapshot.val();
            scheduleItems = data ? data : [];
            renderSchedule();
            console.log("Schedule loaded/updated from Firebase.");
        }, (error) => {
            console.error("Error loading schedule:", error);
        });
    } else {
        scheduleItems = [];
        renderSchedule();
    }
}

// Remove localStorage functions for Schedule:
// function saveSchedule() { /* ... */ }
// function loadSchedule() { /* ... */ }

function renderSchedule() {
    scheduleListEl.innerHTML = '';
    if (scheduleItems.length === 0 && currentUserId) {
        const emptyState = document.createElement('div');
        emptyState.textContent = "No classes yet! Add one using the form.";
        emptyState.style.textAlign = "center";
        emptyState.style.color = "#ccc";
        scheduleListEl.appendChild(emptyState);
    }
    scheduleItems.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'schedule-item';

        const day = document.createElement('div');
        day.className = 'day';
        day.textContent = `${item.day} - ${item.className}`;

        const time = document.createElement('div');
        time.className = 'time';
        time.textContent = `Time: ${item.time}`;

        const location = document.createElement('div');
        location.className = 'location';
        location.textContent = `Location: ${item.location || 'N/A'}`;

        const delBtn = document.createElement('span');
        delBtn.className = 'material-icons';
        delBtn.textContent = 'delete';
        delBtn.setAttribute('role', 'button');
        delBtn.setAttribute('aria-label', 'Delete class schedule');
        delBtn.style.cursor = 'pointer';
        delBtn.style.float = 'right';
        delBtn.style.marginTop = '-38px';
        delBtn.style.color = '#38bdf8';
        delBtn.addEventListener('click', () => {
            scheduleItems.splice(i, 1);
            saveScheduleToFirebase(); // <--- Call Firebase save
            renderSchedule();
            showToast('Class schedule deleted');
        });

        div.appendChild(delBtn);
        div.appendChild(day);
        div.appendChild(time);
        div.appendChild(location);
        scheduleListEl.appendChild(div);
    });
}
scheduleForm.addEventListener('submit', ev => {
    ev.preventDefault();
    const className = document.getElementById('class-name').value.trim();
    const day = document.getElementById('class-day').value.trim();
    const time = document.getElementById('class-time').value.trim();
    const location = document.getElementById('class-location').value.trim();
    if (!className || !day || !time) {
        alert('Please fill required fields: Class Name, Day, and Time');
        return;
    }
    scheduleItems.push({ className, day, time, location });
    saveScheduleToFirebase(); // <--- Call Firebase save
    renderSchedule();
    scheduleForm.reset();
    showToast('Class added');
});
clearScheduleBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all class schedules?')) {
        scheduleItems = [];
        saveScheduleToFirebase(); // <--- Call Firebase save
        renderSchedule();
        showToast('Class schedules cleared');
    }
});

// -------------- Quiz Organizer --------------
const quizForm = document.getElementById('quiz-form');
const quizListTbody = document.getElementById('quiz-list');
const clearQuizBtn = document.getElementById('clear-quiz');

let quizzes = [];

// --- Firebase Quiz functions ---
function getQuizzesRef() {
    if (!currentUserId) {
        console.error("No user logged in to get quizzes reference.");
        return null;
    }
    return ref(db, `users/${currentUserId}/quizzes`);
}

function saveQuizzesToFirebase() {
    const quizzesRef = getQuizzesRef();
    if (quizzesRef) {
        set(quizzesRef, quizzes)
            .then(() => console.log("Quizzes saved to Firebase."))
            .catch(error => console.error("Error saving quizzes:", error));
    }
}

function loadQuizzesFromFirebase() {
    const quizzesRef = getQuizzesRef();
    if (quizzesRef) {
        onValue(quizzesRef, (snapshot) => {
            const data = snapshot.val();
            quizzes = data ? data : [];
            renderQuizzes();
            console.log("Quizzes loaded/updated from Firebase.");
        }, (error) => {
            console.error("Error loading quizzes:", error);
        });
    } else {
        quizzes = [];
        renderQuizzes();
    }
}

// Remove localStorage functions for Quiz:
// function saveQuizzes() { /* ... */ }
// function loadQuizzes() { /* ... */ }

function renderQuizzes() {
    quizListTbody.innerHTML = '';
    if (quizzes.length === 0 && currentUserId) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 4;
        td.textContent = "No quizzes yet! Add one using the form.";
        td.style.textAlign = "center";
        td.style.color = "#ccc";
        tr.appendChild(td);
        quizListTbody.appendChild(tr);
    }
    quizzes.forEach((quiz, index) => {
        const tr = document.createElement('tr');

        const dateTime = new Date(quiz.datetime);
        const formattedDate = dateTime.toLocaleString();

        tr.innerHTML = `
            <td>${quiz.name}</td>
            <td>${formattedDate}</td>
            <td>${quiz.className || ''}</td>
            <td class="table-actions">
                <button aria-label="Delete quiz" title="Delete Quiz" data-index="${index}"><span class="material-icons">delete</span></button>
            </td>
        `;
        quizListTbody.appendChild(tr);
    });

    // Add event listeners to delete buttons
    quizListTbody.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (ev) => {
            const idx = ev.currentTarget.dataset.index;
            quizzes.splice(idx, 1);
            saveQuizzesToFirebase(); // <--- Call Firebase save
            renderQuizzes();
            showToast('Quiz deleted');
        });
    });
}
quizForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const name = document.getElementById('quiz-name').value.trim();
    const datetime = document.getElementById('quiz-date').value; // ISO 8601 string
    const className = document.getElementById('quiz-class').value.trim();

    if (!name || !datetime) {
        alert('Please fill quiz name and date/time');
        return;
    }
    quizzes.push({
        name,
        datetime,
        className
    });
    saveQuizzesToFirebase(); // <--- Call Firebase save
    renderQuizzes();
    quizForm.reset();
    showToast('Quiz added');
});

clearQuizBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all quizzes?')) {
        quizzes = [];
        saveQuizzesToFirebase(); // <--- Call Firebase save
        renderQuizzes();
        showToast('Quizzes cleared');
    }
});

// -------------- Major Exams --------------
const examForm = document.getElementById('exam-form');
const examListTbody = document.getElementById('exam-list');
const clearExamsBtn = document.getElementById('clear-exams');

let exams = [];

// --- Firebase Exams functions ---
function getExamsRef() {
    if (!currentUserId) {
        console.error("No user logged in to get exams reference.");
        return null;
    }
    return ref(db, `users/${currentUserId}/exams`);
}

function saveExamsToFirebase() {
    const examsRef = getExamsRef();
    if (examsRef) {
        set(examsRef, exams)
            .then(() => console.log("Exams saved to Firebase."))
            .catch(error => console.error("Error saving exams:", error));
    }
}

function loadExamsFromFirebase() {
    const examsRef = getExamsRef();
    if (examsRef) {
        onValue(examsRef, (snapshot) => {
            const data = snapshot.val();
            exams = data ? data : [];
            renderExams();
            console.log("Exams loaded/updated from Firebase.");
        }, (error) => {
            console.error("Error loading exams:", error);
        });
    } else {
        exams = [];
        renderExams();
    }
}

// Remove localStorage functions for Exams:
// function saveExams() { /* ... */ }
// function loadExams() { /* ... */ }

function renderExams() {
    examListTbody.innerHTML = '';
    if (exams.length === 0 && currentUserId) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 3;
        td.textContent = "No exams yet! Add one using the form.";
        td.style.textAlign = "center";
        td.style.color = "#ccc";
        tr.appendChild(td);
        examListTbody.appendChild(tr);
    }
    exams.forEach((exam, index) => {
        const tr = document.createElement('tr');
        const dateTime = new Date(exam.datetime);
        const formattedDate = dateTime.toLocaleString();
        tr.innerHTML = `
            <td>${exam.name}</td>
            <td>${formattedDate}</td>
            <td class="table-actions">
                <button aria-label="Delete exam" title="Delete Exam" data-index="${index}"><span class="material-icons">delete</span></button>
            </td>
        `;
        examListTbody.appendChild(tr);
    });
    examListTbody.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (ev) => {
            const idx = ev.currentTarget.dataset.index;
            exams.splice(idx, 1);
            saveExamsToFirebase(); // <--- Call Firebase save
            renderExams();
            showToast('Exam deleted');
        });
    });
}
examForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const name = document.getElementById('exam-name').value.trim();
    const datetime = document.getElementById('exam-date').value; // ISO 8601 string

    if (!name || !datetime) {
        alert('Please fill exam name and date/time');
        return;
    }
    exams.push({
        name,
        datetime
    });
    saveExamsToFirebase(); // <--- Call Firebase save
    renderExams();
    examForm.reset();
    showToast('Exam added');
});
clearExamsBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all exams?')) {
        exams = [];
        saveExamsToFirebase(); // <--- Call Firebase save
        renderExams();
        showToast('Exams cleared');
    }
});

// Load all data on app start - THIS FUNCTION IS NOW LARGELY SUPERSEDED BY onAuthStateChanged
// It's kept here mostly for features that *might* still use localStorage or for initial display if not logged in.
// However, the Firebase load functions are called explicitly in onAuthStateChanged.
function loadAll() {
    // loadTodo(); renderTodo(); // REMOVED - loaded by onAuthStateChanged
    // loadGwa(); renderGwa(); // REMOVED - loaded by onAuthStateChanged
    // loadTimer(); // REMOVED - loaded by onAuthStateChanged
    // loadFlashcards(); renderFlashcardsList(); renderFlashcard(currentFlashcardIndex); // REMOVED - loaded by onAuthStateChanged
    // loadTopics(); renderTopics(); // REMOVED - loaded by onAuthStateChanged
    // loadSchedule(); renderSchedule(); // REMOVED - loaded by onAuthStateChanged
    // loadQuizzes(); renderQuizzes(); // REMOVED - loaded by onAuthStateChanged
    // loadExams(); renderExams(); // REMOVED - loaded by onAuthStateChanged
    
    // Initial rendering of empty states if no user is logged in yet
    renderTodo();
    renderGwa();
    updateTimerDisplay(); // Only display, actual data comes from Firebase
    renderFlashcardsList(); renderFlashcard(0);
    renderTopics();
    renderSchedule();
    renderQuizzes();
    renderExams();
}
loadAll(); // Call once on page load to set up initial empty states/displays

// Accessibility: Keyboard shortcut to toggle next/prev flashcard when in flashcards tab
document.addEventListener('keydown', e => {
    if (!tabs.flashcards.classList.contains('active')) return;
    if (flashcards.length === 0) return; // Add check for empty flashcards
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        currentFlashcardIndex++;
        isFront = true;
        renderFlashcard(currentFlashcardIndex);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        currentFlashcardIndex--;
        isFront = true;
        renderFlashcard(currentFlashcardIndex);
    } else if (e.key === ' ') {
        e.preventDefault();
        isFront = !isFront;
        flashcardEl.classList.toggle('flipped', !isFront);
    }
});

// This part should be at the very end of your file, assuming it's related to logout
// (It was already mostly correct, just ensuring it's in the right place conceptually)
document.getElementById('btn-logout').addEventListener('click', () => {
    signOut(auth)
        .then(() => {
            // Redirect to login page
            window.location.href = "index.html"; // Ensure this matches your login page filename
        })
        .catch((error) => {
            alert("Logout error: " + error.message);
        });
});