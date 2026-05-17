const quotes = [
    { text: "La excelencia no es un acto, sino un hábito.", author: "Aristóteles" },
    { text: "El éxito es la suma de pequeños esfuerzos repetidos día tras día.", author: "Robert Collier" },
    { text: "No esperes la inspiración, es mejor persecución.", author: "Augusto Cury" },
    { text: "El conocimiento es poder, pero el entusiasmo abre las puertas.", author: "William G. B. Brown" },
    { text: "La creatividad es la inteligencia divirtiéndose.", author: "Albert Einstein" },
    { text: "El único modo de hacer un gran trabajo es amar lo que haces.", author: "Steve Jobs" },
    { text: "El futuro pertenece a quienes creen en la belleza de sus sueños.", author: "Eleanor Roosevelt" },
    { text: "No importa lo lento que vayas, siempre y cuando no te detengas.", author: "Confucio" },
    { text: "La disciplina es el puente entre tus sueños y tus logros.", author: "Jim Rohn" },
    { text: "El éxito no es definitivo, el fracaso no es fatal: lo que cuenta es el coraje para continuar.", author: "Winston Churchill" },
    { text: "Cada día es una nueva oportunidad para cambiar tu vida.", author: "Anónimo" },
    { text: "Los sueños no tienen límites, solo los que imponemos.", author: "Anónimo" },
    { text: "La motivación te lleva a empezar. El hábito te lleva a continuar.", author: "Jim Ryun" },
    { text: "El trabajo duro supera al talento cuando el talento no trabaja duro.", author: "Tim Notke" },
    { text: "El único lugar donde el éxito viene antes que el trabajo es en el diccionario.", author: "Vidal Sassoon" }
];

const tracks = {
    lofi: { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', name: 'Lo-fi Beats - Enfoque' },
    ambient: { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', name: 'Sonidos Ambientales' },
    piano: { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', name: 'Piano Relajante' },
    nature: { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', name: 'Naturaleza y Paz' },
    focus: { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', name: 'Música para Concentrarse' }
};

// Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDimp0FC92olHJb9hOQQGcBQuHVXIIgvAA",
  authDomain: "homefocus-9ee19.firebaseapp.com",
  projectId: "homefocus-9ee19",
  storageBucket: "homefocus-9ee19.firebasestorage.app",
  messagingSenderId: "462612128471",
  appId: "1:462612128471:web:f9169137f800b171d58692"
};
// Firebase (with full fallback if CDN fails)
let firestoreDb = null;
let TASKS_DOC = null;
let authReady = true;
let currentUser = null;

try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        firestoreDb = firebase.firestore();
        authReady = false;
        if (firebase.auth) {
            firebase.auth().onAuthStateChanged((user) => {
                authReady = true;
                currentUser = user;
                if (user) {
                    // Si es sesión anónima de la versión anterior, cerrarla
                    if (user.isAnonymous) {
                        firebase.auth().signOut();
                        return;
                    }
                    setLoggedIn();
                    afterAuthInit();
                } else {
                    showLogin();
                }
            });
            setTimeout(() => {
                if (!authReady) {
                    authReady = true;
                    showLogin();
                }
            }, 10000);
        } else {
            authReady = true;
            showLogin();
        }
    } else {
        authReady = true;
        showLogin();
    }
} catch(e) {
    console.warn('Firebase error:', e);
    authReady = true;
    showLogin();
}

const STORAGE_KEYS = {
    USER_NAME: 'homefocus_username',
    STATS: 'homefocus_stats',
    SESSIONS: 'homefocus_sessions',
    CUSTOM_FILES: 'homefocus_custom_files',
    URL_FILES: 'homefocus_url_files',
    LAST_TRACK: 'homefocus_last_track',
    AUTO_MUSIC: 'homefocus_auto_music'
};

let globalTasks = [];
let selectedTaskId = null;

let timerInterval = null;
let timeRemaining = 25 * 60;
let isRunning = false;
let isWorkPhase = true;
let workTime = 25;
let breakTime = 5;
let startTimestamp = null;
let pausedTimeRemaining = null;
let customFiles = [];
let urlFiles = [];
let folderFiles = [];
let currentTrackIndex = 0;
let directoryHandle = null;

const elements = {
    greeting: document.getElementById('greeting'),
    editNameBtn: document.getElementById('editNameBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    nameModal: document.getElementById('nameModal'),
    nameInput: document.getElementById('nameInput'),
    saveNameBtn: document.getElementById('saveNameBtn'),
    timerMinutes: document.getElementById('timerMinutes'),
    timerSeconds: document.getElementById('timerSeconds'),
    timerStatus: document.getElementById('timerStatus'),
    startBtn: document.getElementById('startBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    resetBtn: document.getElementById('resetBtn'),
    workTime: document.getElementById('workTime'),
    breakTime: document.getElementById('breakTime'),
    autoMusic: document.getElementById('autoMusic'),
    folderInfo: document.getElementById('folderInfo'),
    customFiles: document.getElementById('customFiles'),
    openFolderBtn: document.getElementById('openFolderBtn'),
    singleFileInput: document.getElementById('singleFileInput'),
    playMusicBtn: document.getElementById('playMusicBtn'),
    prevTrackBtn: document.getElementById('prevTrackBtn'),
    nextTrackBtn: document.getElementById('nextTrackBtn'),
    stopMusicBtn: document.getElementById('stopMusicBtn'),
    playIcon: document.getElementById('playIcon'),
    pauseIcon: document.getElementById('pauseIcon'),
    backgroundMusic: document.getElementById('backgroundMusic'),
    volumeSlider: document.getElementById('volumeSlider'),
    trackName: document.getElementById('trackName'),
    todayMinutes: document.getElementById('todayMinutes'),
    sessionsCompleted: document.getElementById('sessionsCompleted'),
    totalMinutes: document.getElementById('totalMinutes'),
    weeklyChart: document.getElementById('weeklyChart'),
    quote: document.getElementById('quote'),
    quoteAuthor: document.getElementById('quoteAuthor'),
    notification: document.getElementById('notification'),
    notificationText: document.getElementById('notificationText'),
    closeNotification: document.getElementById('closeNotification'),
    sidebar: document.getElementById('sidebar'),
    toggleSidebar: document.getElementById('toggleSidebar'),
    toggleTasks: document.getElementById('toggleTasks'),
    toggleGlobalTasks: document.getElementById('toggleGlobalTasks'),
    toggleWallpaper: document.getElementById('toggleWallpaper'),
    sidebarContent: document.getElementById('sidebarContent'),
    taskTableBody: document.getElementById('taskTableBody'),
    globalTaskTableBody: document.getElementById('globalTaskTableBody'),
    globalTaskNameInput: document.getElementById('globalTaskNameInput'),
    globalTaskPriority: document.getElementById('globalTaskPriority'),
    globalTaskDeadline: document.getElementById('globalTaskDeadline'),
    addGlobalTaskBtn: document.getElementById('addGlobalTaskBtn'),
    taskSelector: document.getElementById('taskSelector')
};

function loadSavedWallpaper() {
    const savedWallpaper = localStorage.getItem('homefocus_wallpaper');
    if (savedWallpaper) {
        document.querySelector('.background-image').style.backgroundImage = `url('${savedWallpaper}')`;
    }
}

function checkUserName() {
    const savedName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
    if (!savedName) {
        elements.nameModal.classList.remove('hidden');
    } else {
        elements.nameModal.classList.add('hidden');
    }
    updateGreeting();
}

function setupEventListeners() {
    elements.saveNameBtn.addEventListener('click', saveUserName);
    elements.nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveUserName();
    });
    elements.editNameBtn.addEventListener('click', () => {
        elements.nameInput.value = localStorage.getItem(STORAGE_KEYS.USER_NAME) || '';
        elements.nameModal.classList.remove('hidden');
        elements.nameInput.focus();
    });

    elements.startBtn.addEventListener('click', startTimer);
    elements.pauseBtn.addEventListener('click', pauseTimer);
    elements.resetBtn.addEventListener('click', resetTimer);

    elements.workTime.addEventListener('change', updateTimerSettings);
    elements.breakTime.addEventListener('change', updateTimerSettings);

    elements.autoMusic.addEventListener('change', () => {
        localStorage.setItem(STORAGE_KEYS.AUTO_MUSIC, elements.autoMusic.checked);
    });

    elements.playMusicBtn.addEventListener('click', toggleMusic);
    elements.stopMusicBtn.addEventListener('click', stopMusic);
    elements.prevTrackBtn.addEventListener('click', prevTrack);
    elements.nextTrackBtn.addEventListener('click', nextTrack);
    elements.backgroundMusic.addEventListener('ended', playNextTrack);
    elements.volumeSlider.addEventListener('input', (e) => {
        elements.backgroundMusic.volume = e.target.value;
    });

    elements.openFolderBtn.addEventListener('click', openMusicFolder);
    
    const folderInput = document.getElementById('folderInput');
    folderInput.addEventListener('change', handleFolderInput);
    
    const singleFileInput = document.getElementById('singleFileInput');
    singleFileInput.addEventListener('change', handleSingleFile);

    elements.closeNotification.addEventListener('click', () => {
        elements.notification.classList.add('hidden');
    });
    
    // Logout
    elements.logoutBtn.addEventListener('click', handleLogout);

    // Login form
    document.getElementById('loginSubmitBtn').addEventListener('click', handleLoginSubmit);
    document.getElementById('loginPasswordInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLoginSubmit();
    });
    document.getElementById('loginEmailInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLoginSubmit();
    });

    // Tasks event listeners
    elements.toggleSidebar.addEventListener('click', toggleSidebar);
    elements.toggleTasks.addEventListener('click', toggleTasks);
    elements.toggleGlobalTasks.addEventListener('click', toggleGlobalTasks);
    // Wallpaper button event listener is set up below (line ~270)
    
    // Edit task modal
    document.getElementById('saveEditTaskBtn').addEventListener('click', saveEditTask);
    document.getElementById('editTaskName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveEditTask();
    });
    // Close modal on overlay click
    document.getElementById('editTaskModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            document.getElementById('editTaskModal').classList.add('hidden');
            editingTaskId = null;
        }
    });

    // Global tasks specific listeners
    elements.addGlobalTaskBtn.addEventListener('click', addGlobalTask);
    elements.globalTaskNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addGlobalTask();
    });
}

// Toggle sidebar and show specific panel
function toggleSidebar() {
    if (!elements.sidebarContent.classList.contains('open')) {
        openSidebar('stats');
    } else {
        const statsPanel = document.getElementById('statsPanel');
        if (statsPanel.classList.contains('active')) {
            closeSidebar();
        } else {
            openSidebar('stats');
        }
    }
}

function toggleTasks() {
    if (!elements.sidebarContent.classList.contains('open')) {
        openSidebar('tasks');
    } else {
        const tasksPanel = document.getElementById('tasksPanel');
        if (tasksPanel.classList.contains('active')) {
            closeSidebar();
        } else {
            openSidebar('tasks');
        }
    }
}

function toggleGlobalTasks() {
    if (!elements.sidebarContent.classList.contains('open')) {
        openSidebar('global');
    } else {
        const globalPanel = document.getElementById('globalTasksPanel');
        if (globalPanel.classList.contains('active')) {
            closeSidebar();
        } else {
            openSidebar('global');
        }
    }
}

function openSidebar(panelId) {
    elements.sidebar.classList.add('sidebar-open');
    elements.sidebar.classList.remove('tasks-mode', 'global-mode');
    elements.sidebarContent.classList.add('open');

    document.querySelectorAll('.sidebar-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    document.getElementById(`${panelId === 'global' ? 'globalTasks' : panelId}Panel`).classList.add('active');

    elements.toggleSidebar.classList.remove('active');
    elements.toggleTasks.classList.remove('active');
    elements.toggleGlobalTasks.classList.remove('active');

    // Reset z-index for all buttons
    elements.toggleSidebar.style.zIndex = '101';
    elements.toggleTasks.style.zIndex = '101';
    elements.toggleGlobalTasks.style.zIndex = '101';

    if (panelId === 'stats') {
        elements.toggleSidebar.classList.add('active');
        elements.toggleSidebar.style.zIndex = '102';
    } else if (panelId === 'tasks') {
        elements.sidebar.classList.add('tasks-mode');
        elements.toggleTasks.classList.add('active');
        elements.toggleTasks.style.zIndex = '102';
        renderTaskTable();
    } else if (panelId === 'global') {
        elements.sidebar.classList.add('global-mode');
        elements.toggleGlobalTasks.classList.add('active');
        elements.toggleGlobalTasks.style.zIndex = '102';
        renderGlobalTaskTable();
    }
}

function closeSidebar() {
    elements.sidebar.classList.remove('sidebar-open');
    elements.sidebar.classList.remove('tasks-mode', 'global-mode');
    elements.sidebarContent.classList.remove('open');
    elements.toggleSidebar.classList.remove('active');
    elements.toggleTasks.classList.remove('active');
    elements.toggleGlobalTasks.classList.remove('active');
    elements.toggleSidebar.style.zIndex = '101';
    elements.toggleTasks.style.zIndex = '101';
    elements.toggleGlobalTasks.style.zIndex = '101';

    document.querySelectorAll('.sidebar-panel').forEach(panel => {
        panel.classList.remove('active');
    });
}

// Right panel for wallpapers
const rightPanel = document.getElementById('rightPanel');
const toggleWallpaperBtn = document.getElementById('toggleWallpaper');

toggleWallpaperBtn.addEventListener('click', () => {
    const isOpen = rightPanel.classList.contains('open');

    // Toggle wallpaper button active state
    toggleWallpaperBtn.classList.toggle('active');

    if (isOpen) {
        rightPanel.classList.remove('open');
        toggleWallpaperBtn.style.zIndex = '101';
    } else {
        rightPanel.classList.add('open');
        toggleWallpaperBtn.style.zIndex = '102';

        // Close sidebar if open
        if (elements.sidebarContent.classList.contains('open')) {
            closeSidebar();
        }
    }
});
function setupWallpaperListeners() {
    document.querySelectorAll('.wallpaper-item').forEach(item => {
        item.addEventListener('click', () => {
            const wallpaperUrl = item.dataset.wallpaper;
            document.querySelector('.background-image').style.backgroundImage = `url('${wallpaperUrl}')`;
            localStorage.setItem('homefocus_wallpaper', wallpaperUrl);
        });
    });
}

setupWallpaperListeners();

function saveUserName() {
    const name = elements.nameInput.value.trim();
    if (name) {
        localStorage.setItem(STORAGE_KEYS.USER_NAME, name);
        if (currentUser) {
            currentUser.updateProfile({ displayName: name }).catch(() => {});
        }
        elements.nameModal.classList.add('hidden');
        updateGreeting();
    }
}

// Login functions
function showLogin() {
    document.getElementById('loginOverlay').classList.remove('hidden');
}

function setLoggedIn() {
    document.getElementById('loginOverlay').classList.add('hidden');
    document.getElementById('app').style.visibility = 'visible';
    document.body.classList.add('logged-in');
}

function showLoginError(msg) {
    const el = document.getElementById('loginError');
    el.textContent = msg;
    el.classList.remove('hidden');
}

function hideLoginError() {
    document.getElementById('loginError').classList.add('hidden');
}

function getFirebaseErrorMessage(code) {
    const messages = {
        'auth/email-already-in-use': 'Este correo ya está registrado',
        'auth/invalid-email': 'Correo electrónico inválido',
        'auth/user-not-found': 'Usuario no encontrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
        'auth/invalid-credential': 'Correo o contraseña incorrectos'
    };
    return messages[code] || 'Error de autenticación. Intenta de nuevo.';
}

async function handleLoginSubmit() {
    const email = document.getElementById('loginEmailInput').value.trim();
    const password = document.getElementById('loginPasswordInput').value;
    hideLoginError();
    if (!email || !password) {
        showLoginError('Completa todos los campos');
        return;
    }
    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
    } catch (err) {
        showLoginError(getFirebaseErrorMessage(err.code));
    }
}

async function handleLogout() {
    try {
        await firebase.auth().signOut();
        globalTasks = [];
        document.body.classList.remove('logged-in');
    } catch(e) {
        console.warn('Logout error:', e);
    }
}

function afterAuthInit() {
    TASKS_DOC = firestoreDb ? firestoreDb.collection('homefocus').doc(currentUser.uid) : null;
    checkUserName();
    updateGreeting();
    initTasks();
}

function updateGreeting() {
    let name = localStorage.getItem(STORAGE_KEYS.USER_NAME);
    if (!name && currentUser) {
        name = currentUser.displayName || currentUser.email?.split('@')[0] || '';
    }
    name = name || 'Usuario';
    const hour = new Date().getHours();
    let greeting;

    if (hour >= 5 && hour < 12) greeting = 'Buenos días';
    else if (hour >= 12 && hour < 18) greeting = 'Buenas tardes';
    else greeting = 'Buenas noches';

    elements.greeting.textContent = `${greeting}, ${name}`;
}

function loadQuote() {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('homefocus_quote_date');
    let quoteIndex;

    if (savedDate === today) {
        quoteIndex = parseInt(localStorage.getItem('homefocus_quote_index'));
    } else {
        quoteIndex = Math.floor(Math.random() * quotes.length);
        localStorage.setItem('homefocus_quote_date', today);
        localStorage.setItem('homefocus_quote_index', quoteIndex);
    }

    const quote = quotes[quoteIndex];
    elements.quote.textContent = `"${quote.text}"`;
    elements.quoteAuthor.textContent = `- ${quote.author}`;
}

function loadLastTrack() {
    // Don't load any track by default
    const lastTrack = localStorage.getItem(STORAGE_KEYS.LAST_TRACK);
    if (lastTrack && tracks[lastTrack]) {
        loadTrack(lastTrack);
        elements.trackName.textContent = tracks[lastTrack].name;
    } else {
        elements.trackName.textContent = '';
    }
}

function loadAutoMusicSetting() {
    const autoMusic = localStorage.getItem(STORAGE_KEYS.AUTO_MUSIC);
    elements.autoMusic.checked = autoMusic !== 'false';
}

function loadTrack(trackKey) {
    if (tracks[trackKey]) {
        elements.backgroundMusic.src = tracks[trackKey].url;
        elements.trackName.textContent = tracks[trackKey].name;
    }
}

let db;

const DB_REQUEST = indexedDB.open('HomeFocusDB', 1);

DB_REQUEST.onerror = () => console.error('Error opening IndexedDB');

DB_REQUEST.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains('audioFiles')) {
        db.createObjectStore('audioFiles', { keyPath: 'name' });
    }
};

DB_REQUEST.onsuccess = (event) => {
    db = event.target.result;
    loadCustomFilesFromDB();
};

function loadCustomFilesFromDB() {
    if (!db) return;
    const transaction = db.transaction(['audioFiles'], 'readonly');
    const store = transaction.objectStore('audioFiles');
    const request = store.getAll();

    request.onsuccess = () => {
        customFiles = request.result;
        renderCustomFiles();
    };
}

function handleCustomFiles(e) {
    const files = Array.from(e.target.files);
    
    if (!db) {
        alert('Base de datos no lista. Intenta de nuevo en un momento.');
        return;
    }

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const fileData = {
                name: file.name,
                url: event.target.result
            };
            
            const transaction = db.transaction(['audioFiles'], 'readwrite');
            const store = transaction.objectStore('audioFiles');
            store.put(fileData);

            transaction.oncomplete = () => {
                customFiles.push(fileData);
                renderCustomFiles();
            };
        };
        reader.readAsDataURL(file);
    });
    e.target.value = '';
}

function renderCustomFiles() {
    if (!elements.customFiles) return;
    elements.customFiles.innerHTML = '';
    customFiles.forEach((file, index) => {
        const div = document.createElement('div');
        div.className = 'custom-file-item';
        div.innerHTML = `
            <span>${file.name}</span>
            <button onclick="removeCustomFile(${index})" title="Eliminar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;
        elements.customFiles.appendChild(div);
    });
}

window.removeCustomFile = function(index) {
    const fileToRemove = customFiles[index];
    if (!db) return;

    const transaction = db.transaction(['audioFiles'], 'readwrite');
    const store = transaction.objectStore('audioFiles');
    store.delete(fileToRemove.name);

    transaction.oncomplete = () => {
        customFiles.splice(index, 1);
        renderCustomFiles();
    };
};

function loadCustomFiles() {
    // Loaded via IndexedDB onsuccess
}

function loadUrlFiles() {
    const saved = localStorage.getItem(STORAGE_KEYS.URL_FILES);
    if (saved) {
        urlFiles = JSON.parse(saved);
        renderUrlFiles();
    }
}

function addUrlFile() {
    const url = elements.urlMusicInput.value.trim();
    if (!url) return;

    const urlLower = url.toLowerCase();
    const isStreaming = urlLower.includes('youtube') || urlLower.includes('spotify') || urlLower.includes('soundcloud') || urlLower.includes('deezer') || urlLower.includes('apple.com/music');
    
    if (isStreaming) {
        alert('No se pueden usar enlaces de YouTube, Spotify, SoundCloud, etc. Solo URLs directas a archivos de audio (.mp3, .wav, .ogg)');
        return;
    }

    if (!url.match(/^https?:\/\/.+\.(mp3|wav|ogg|m4a|flac|aac)$/i) && !url.match(/^https?:\/\/.*\.(mp3|wav|ogg|m4a|flac|aac)/i)) {
        alert('La URL debe terminar en .mp3, .wav, .ogg, etc. para que sea un archivo de audio directo.');
        return;
    }

    const fileData = {
        name: url.split('/').pop() || 'Audio URL',
        url: url
    };

    urlFiles.push(fileData);
    localStorage.setItem(STORAGE_KEYS.URL_FILES, JSON.stringify(urlFiles));
    elements.urlMusicInput.value = '';
    renderUrlFiles();
}

function renderUrlFiles() {
    elements.urlFiles.innerHTML = '';
    urlFiles.forEach((file, index) => {
        const div = document.createElement('div');
        div.className = 'custom-file-item';
        div.innerHTML = `
            <span>${file.name}</span>
            <button onclick="removeUrlFile(${index})" title="Eliminar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;
        elements.urlFiles.appendChild(div);
    });
}

window.removeUrlFile = function(index) {
    urlFiles.splice(index, 1);
    localStorage.setItem(STORAGE_KEYS.URL_FILES, JSON.stringify(urlFiles));
    renderUrlFiles();
};

async function openMusicFolder() {
    // Verificar si la File System Access API está disponible
    if (window.showDirectoryPicker) {
        try {
            directoryHandle = await window.showDirectoryPicker();
            
            const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'];
            const audioFiles = [];
            
            for await (const entry of directoryHandle.values()) {
                if (entry.kind === 'file') {
                    const ext = entry.name.toLowerCase().slice(entry.name.lastIndexOf('.'));
                    if (audioExtensions.includes(ext)) {
                        audioFiles.push({
                            name: entry.name,
                            handle: entry
                        });
                    }
                }
            }
            
            audioFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
            
            folderFiles = audioFiles;
            currentTrackIndex = 0;
            
            elements.folderInfo.innerHTML = `
                <div class="folder-name">📁 ${directoryHandle.name}</div>
                <div class="track-count">${folderFiles.length} canciones</div>
            `;
            
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error al abrir carpeta:', err);
            }
        }
    } else {
        // API no disponible, usar método alternativo con input
        const folderInput = document.getElementById('folderInput');
        folderInput.click();
    }
}

function handleFolderInput(e) {
    const files = Array.from(e.target.files);
    const totalFiles = files.length;
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'];
    
    // Mostrar indicador de carga
    const loadingHtml = `
        <div id="loadingIndicator">
            <div class="loading-spinner"></div>
            <span>Cargando ${totalFiles} archivos...</span>
        </div>
    `;
    elements.folderInfo.innerHTML = loadingHtml;
    
    // Procesar en batches para no bloquear la UI
    const MAX_FILES = 100; // Limitar para evitar lentitud
    let processedCount = 0;
    const audioFiles = [];
    
    function processBatch(startIndex) {
        const batchSize = 20;
        const endIndex = Math.min(startIndex + batchSize, totalFiles);
        
        for (let i = startIndex; i < endIndex; i++) {
            const file = files[i];
            const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
            if (audioExtensions.includes(ext)) {
                audioFiles.push({
                    name: file.name,
                    url: URL.createObjectURL(file)
                });
            }
            processedCount++;
        }
        
        // Actualizar progreso
        const progress = Math.round((processedCount / totalFiles) * 100);
        document.querySelector('#loadingIndicator span').textContent = 
            `Cargando... ${processedCount}/${totalFiles} (${progress}%)`;
        
        if (processedCount < totalFiles && audioFiles.length < MAX_FILES) {
            setTimeout(() => processBatch(processedCount), 0);
        } else {
            finishLoading(audioFiles, e.target.files[0]?.webkitRelativePath || '');
        }
    }
    
    function finishLoading(audioFiles, folderPath) {
        audioFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
        
        // Limitar a MAX_FILES
        const limitedFiles = audioFiles.slice(0, MAX_FILES);
        
        folderFiles = limitedFiles;
        currentTrackIndex = 0;
        
        const folderName = folderPath.split('/')[0] || 'Carpeta';
        
        const countText = audioFiles.length > MAX_FILES 
            ? `${MAX_FILES} de ${audioFiles.length} canciones (limitado)` 
            : `${folderFiles.length} canciones`;
        
        elements.folderInfo.innerHTML = `
            <div class="folder-name">📁 ${folderName}</div>
            <div class="track-count">${countText}</div>
        `;
    }
    
    processBatch(0);
}

function handleSingleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!audioExtensions.includes(ext)) {
        alert('Selecciona un archivo de audio válido');
        return;
    }
    
    folderFiles = [{
        name: file.name,
        url: URL.createObjectURL(file)
    }];
    currentTrackIndex = 0;
    
    elements.folderInfo.innerHTML = `
        <div class="folder-name">🎵 ${file.name}</div>
        <div class="track-count">1 canción</div>
    `;
}

async function getAudioUrlFromHandle(handle) {
    const file = await handle.getFile();
    return URL.createObjectURL(file);
}

function prevTrack() {
    if (folderFiles.length === 0) return;

    currentTrackIndex = (currentTrackIndex - 1 + folderFiles.length) % folderFiles.length;
    playTrack(currentTrackIndex);
}

function nextTrack() {
    if (folderFiles.length === 0) return;
    currentTrackIndex = (currentTrackIndex + 1) % folderFiles.length;
    playTrack(currentTrackIndex);
}

function playNextTrack() {
    if (folderFiles.length === 0) return;

    currentTrackIndex = (currentTrackIndex + 1) % folderFiles.length;
    playTrack(currentTrackIndex);
}

async function playTrack(index) {
    if (folderFiles.length === 0) return;

    const track = folderFiles[index];
    let url;
    
    if (track.handle) {
        url = await getAudioUrlFromHandle(track.handle);
    } else {
        url = track.url;
    }
    
    elements.backgroundMusic.src = url;
    elements.trackName.textContent = track.name;

    elements.backgroundMusic.play().catch(err => console.log('Audio error:', err));
    updateMusicUI(true);
}

function updateTimerSettings() {
    if (!isRunning) {
        workTime = parseInt(elements.workTime.value) || 25;
        breakTime = parseInt(elements.breakTime.value) || 5;
        if (isWorkPhase) {
            timeRemaining = workTime * 60;
        }
        updateTimerDisplay();
    }
}

function startTimer() {
    if (isRunning) return;

    isRunning = true;
    startTimestamp = Date.now();

    elements.startBtn.classList.add('hidden');
    elements.pauseBtn.classList.remove('hidden');
    document.body.classList.add('focus-mode');

    if (elements.autoMusic.checked && elements.backgroundMusic.paused) {
        playCurrentTrack();
    }

    timerInterval = setInterval(updateTimer, 100);
}

function updateTimer() {
    const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
    const totalSeconds = pausedTimeRemaining !== null ? pausedTimeRemaining : (isWorkPhase ? workTime * 60 : breakTime * 60);
    timeRemaining = Math.max(0, totalSeconds - elapsed);

    updateTimerDisplay();

    if (timeRemaining <= 0) {
        completePhase();
    }
}

function pauseTimer() {
    if (!isRunning) return;

    isRunning = false;
    pausedTimeRemaining = timeRemaining;
    clearInterval(timerInterval);

    elements.startBtn.classList.remove('hidden');
    elements.pauseBtn.classList.add('hidden');
}

function resetTimer() {
    isRunning = false;
    isWorkPhase = true;
    pausedTimeRemaining = null;
    clearInterval(timerInterval);

    workTime = parseInt(elements.workTime.value) || 25;
    breakTime = parseInt(elements.breakTime.value) || 5;
    timeRemaining = workTime * 60;

    elements.startBtn.classList.remove('hidden');
    elements.pauseBtn.classList.add('hidden');
    document.body.classList.remove('focus-mode');

    elements.timerStatus.textContent = 'Enfoque';
    elements.timerStatus.classList.remove('break');

    updateTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    elements.timerMinutes.textContent = minutes.toString().padStart(2, '0');
    elements.timerSeconds.textContent = seconds.toString().padStart(2, '0');
}

function completePhase() {
    clearInterval(timerInterval);
    isRunning = false;

    if (isWorkPhase) {
        saveSession(workTime);
        // Increment pomodoro count for selected task
        const taskId = getSelectedTaskId();
        if (taskId) {
            incrementTaskPomodoros(taskId);
            showNotification('¡Sesión de trabajo completada! 🍅 +1 para tu tarea.');
        } else {
            showNotification('¡Sesión de trabajo completada! Es hora de descansar.');
        }
        isWorkPhase = false;
        timeRemaining = breakTime * 60;
        elements.timerStatus.textContent = 'Descanso';
        elements.timerStatus.classList.add('break');
    } else {
        showNotification('¡Descanso terminado! Listo para enfocarte.');
        isWorkPhase = true;
        timeRemaining = workTime * 60;
        elements.timerStatus.textContent = 'Enfoque';
        elements.timerStatus.classList.remove('break');
    }

    pausedTimeRemaining = null;
    elements.startBtn.classList.remove('hidden');
    elements.pauseBtn.classList.add('hidden');
    updateTimerDisplay();
    loadStats();
}

function showNotification(text) {
    elements.notificationText.textContent = text;
    elements.notification.classList.remove('hidden');

    // Use a more reliable notification sound
    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-bell-notification-933.mp3');
    audio.volume = 0.5; // Set volume to 50%
    audio.play().catch(() => {
        // Fallback to a simpler beep if the MP3 fails
        const beep = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
        beep.volume = 0.5;
        beep.play().catch(() => {});
    });

    setTimeout(() => {
        elements.notification.classList.add('hidden');
    }, 5000);
}

function saveSession(minutes) {
    const today = new Date().toISOString().split('T')[0];
    const stats = JSON.parse(localStorage.getItem(STORAGE_KEYS.STATS) || '{}');
    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '{}');

    stats[today] = (stats[today] || 0) + minutes;
    sessions[today] = (sessions[today] || 0) + 1;

    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
}

function loadStats() {
    const today = new Date().toISOString().split('T')[0];
    const stats = JSON.parse(localStorage.getItem(STORAGE_KEYS.STATS) || '{}');
    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '{}');

    elements.todayMinutes.textContent = stats[today] || 0;
    elements.sessionsCompleted.textContent = sessions[today] || 0;

    const totalMinutes = Object.values(stats).reduce((sum, val) => sum + val, 0);
    elements.totalMinutes.textContent = totalMinutes;

    updateWeeklyChart(stats);
}

function updateWeeklyChart(stats) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const maxMinutes = Math.max(...Object.values(stats), 60);

    const chartBars = elements.weeklyChart.querySelectorAll('.chart-bar');

    days.forEach((day, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);
        const dateStr = date.toISOString().split('T')[0];
        const minutes = stats[dateStr] || 0;
        const percentage = (minutes / maxMinutes) * 100;

        const bar = chartBars[index];
        bar.style.height = `${Math.max(10, percentage)}%`;
        bar.querySelector('.bar-value').textContent = minutes;
        bar.classList.toggle('active', minutes > 0);
    });
}

function playCurrentTrack() {
    if (folderFiles.length > 0) {
        playTrack(currentTrackIndex);
    } else {
        // Don't load any track by default - user must select music
        updateMusicUI(false);
    }
}

function toggleMusic() {
    if (elements.backgroundMusic.paused) {
        playCurrentTrack();
    } else {
        elements.backgroundMusic.pause();
        updateMusicUI(false);
    }
}

function stopMusic() {
    elements.backgroundMusic.pause();
    elements.backgroundMusic.currentTime = 0;
    updateMusicUI(false);
}

function updateMusicUI(isPlaying) {
    if (isPlaying) {
        elements.playIcon.classList.add('hidden');
        elements.pauseIcon.classList.remove('hidden');
        elements.stopMusicBtn.classList.remove('hidden');
    } else {
        elements.playIcon.classList.remove('hidden');
        elements.pauseIcon.classList.add('hidden');
        elements.stopMusicBtn.classList.add('hidden');
    }
}


// YouTube Lo-Fi Live embeds
const lofiStations = [
    { id: 'lofi1', name: '🎧 Lo-Fi Beats', url: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1', watch: 'https://www.youtube.com/watch?v=jfKfPfyJRdk' },
    { id: 'lofi2', name: '🎹 Synthwave', url: 'https://www.youtube.com/embed/a8n4kHxkL38?autoplay=1&mute=1', watch: 'https://www.youtube.com/watch?v=a8n4kHxkL38' },
    { id: 'lofi3', name: '🧘 Zen Garden', url: 'https://www.youtube.com/embed/HmMn72U1Rls?autoplay=1&mute=1', watch: 'https://www.youtube.com/watch?v=HmMn72U1Rls' },
    { id: 'lofi4', name: '🌃 Night City', url: 'https://www.youtube.com/embed/EcaATjHUQCA?autoplay=1&mute=1', watch: 'https://www.youtube.com/watch?v=EcaATjHUQCA' },
    { id: 'lofi5', name: '💕 Baladas Románticas', url: 'https://www.youtube.com/embed/SVL-Tuk7TAo?autoplay=1&mute=1', watch: 'https://www.youtube.com/watch?v=SVL-Tuk7TAo' },
    { id: 'lofi6', name: '🎻 Violín y Piano', url: 'https://www.youtube.com/embed/NQmHxm87yDA?autoplay=1&mute=1', watch: 'https://www.youtube.com/watch?v=NQmHxm87yDA' },
];

let currentLoFiId = 'lofi1';
let lofiCollapsed = false;

function renderLoFiStations() {
    const list = document.getElementById('lofiStationList');
    if (!list) return;
    list.innerHTML = '';

    const header = document.getElementById('lofiToggle');
    const content = document.getElementById('lofiContent');
    if (header) header.classList.toggle('collapsed', lofiCollapsed);
    if (content) content.classList.toggle('collapsed', lofiCollapsed);

    lofiStations.forEach(station => {
        const btn = document.createElement('button');
        btn.className = `lofi-station-btn ${currentLoFiId === station.id ? 'active' : ''}`;
        btn.textContent = station.name;
        btn.addEventListener('click', () => switchLoFi(station.id));
        list.appendChild(btn);
    });

    // Add direct link for current station
    const current = lofiStations.find(s => s.id === currentLoFiId);
    const player = document.getElementById('lofiPlayer');
    if (player && current) {
        const existing = player.querySelector('.lofi-direct-link');
        if (!existing) {
            const link = document.createElement('a');
            link.className = 'lofi-direct-link';
            link.href = current.watch;
            link.target = '_blank';
            link.textContent = '▶️ Abrir en YouTube';
            player.appendChild(link);
        } else {
            existing.href = current.watch;
        }
    }
}

function switchLoFi(stationId) {
    const station = lofiStations.find(s => s.id === stationId);
    if (!station) return;
    currentLoFiId = stationId;
    const iframe = document.getElementById('lofiIframe');
    iframe.src = station.url;
    renderLoFiStations();
}

// Init LoFi
try {
    const lofiToggle = document.getElementById('lofiToggle');
    if (lofiToggle) {
        lofiToggle.addEventListener('click', () => {
            lofiCollapsed = !lofiCollapsed;
            renderLoFiStations();
        });
    }
    renderLoFiStations();
    if (document.getElementById('lofiIframe')) {
        switchLoFi('lofi1');
    }
} catch(e) {
    console.warn('LoFi init error:', e);
}

// Tasks functionality
function getTasksKey() {
    return currentUser ? `homefocus_tasks_${currentUser.uid}` : 'homefocus_tasks_backup';
}

function initTasks() {
    let key = getTasksKey();
    let saved = localStorage.getItem(key);
    // Migrate from old shared backup if first time with per-user key
    if (!saved && currentUser) {
        const old = localStorage.getItem('homefocus_tasks_backup');
        if (old) {
            localStorage.setItem(key, old);
            localStorage.removeItem('homefocus_tasks_backup');
            saved = old;
        }
    }
    if (saved) {
        try { globalTasks = JSON.parse(saved); } catch(e) { globalTasks = []; }
    }
    checkNewDay();
    renderTaskTable();
    renderGlobalTaskTable();
    populateTaskSelector();

    // Sync with Firestore if available
    if (TASKS_DOC) {
        TASKS_DOC.onSnapshot((snapshot) => {
            if (snapshot.exists) {
                globalTasks = snapshot.data().tasks || [];
                checkNewDay();
                // Solo actualizar localStorage, NO re-guardar en Firestore (evita bucle)
                localStorage.setItem(getTasksKey(), JSON.stringify(globalTasks));
                renderTaskTable();
                renderGlobalTaskTable();
                populateTaskSelector();
            }
        }, () => {});
    }
}

function saveGlobalTasks() {
    localStorage.setItem(getTasksKey(), JSON.stringify(globalTasks));
    if (TASKS_DOC) {
        try {
            TASKS_DOC.set({ tasks: globalTasks, updatedAt: firebase.firestore.FieldValue.serverTimestamp() })
                .catch(() => {});
        } catch(e) {}
    }
}

function checkNewDay() {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = localStorage.getItem('homefocus_last_daily_date');
    if (lastDate && lastDate !== today) {
        // New day: reset daily tasks (remove from daily if not completed)
        globalTasks.forEach(task => {
            if (task.isDaily && !task.dailyCompleted) {
                task.isDaily = false;
            }
        });
        saveGlobalTasks();
    }
    localStorage.setItem('homefocus_last_daily_date', today);
}

function addGlobalTask() {
    const name = elements.globalTaskNameInput.value.trim();
    const priority = elements.globalTaskPriority.value;
    const deadline = elements.globalTaskDeadline.value;

    if (!name) {
        showNotification('Escribe un nombre para la tarea');
        return;
    }

    const task = {
        id: Date.now(),
        name: name,
        priority: priority,
        deadline: deadline || null,
        isDaily: false,
        dailyCompleted: false,
        completed: false,
        completionDate: null,
        pomodoros: 0
    };

    globalTasks.push(task);
    saveGlobalTasks();
    elements.globalTaskNameInput.value = '';
    elements.globalTaskDeadline.value = '';
    renderGlobalTaskTable();
    populateTaskSelector();
    showNotification('Tarea global añadida: ' + name);
}

let editingTaskId = null;

function deleteGlobalTask(taskId) {
    globalTasks = globalTasks.filter(t => t.id !== taskId);
    saveGlobalTasks();
    renderGlobalTaskTable();
    renderTaskTable();
    populateTaskSelector();
    showNotification('Tarea eliminada');
}

function editGlobalTask(taskId) {
    const task = globalTasks.find(t => t.id === taskId);
    if (!task) return;
    editingTaskId = taskId;
    document.getElementById('editTaskName').value = task.name;
    document.getElementById('editTaskPriority').value = task.priority;
    document.getElementById('editTaskDeadline').value = task.deadline || '';
    document.getElementById('editTaskModal').classList.remove('hidden');
}

function saveEditTask() {
    const name = document.getElementById('editTaskName').value.trim();
    if (!name) { showNotification('Escribe un nombre para la tarea'); return; }
    const task = globalTasks.find(t => t.id === editingTaskId);
    if (!task) return;
    task.name = name;
    task.priority = document.getElementById('editTaskPriority').value;
    task.deadline = document.getElementById('editTaskDeadline').value || null;
    saveGlobalTasks();
    renderGlobalTaskTable();
    renderTaskTable();
    populateTaskSelector();
    document.getElementById('editTaskModal').classList.add('hidden');
    editingTaskId = null;
    showNotification('Tarea actualizada');
}

function sendToDaily(taskId) {
    const task = globalTasks.find(t => t.id === taskId);
    if (!task) return;
    task.isDaily = !task.isDaily;
    if (task.isDaily) {
        task.dailyCompleted = false;
    }
    saveGlobalTasks();
    renderGlobalTaskTable();
    renderTaskTable();
    populateTaskSelector();
    showNotification(task.isDaily ? 'Tarea añadida al día' : 'Tarea quitada del día');
}

function toggleDailyCompleted(taskId) {
    const task = globalTasks.find(t => t.id === taskId);
    if (!task) return;
    task.dailyCompleted = !task.dailyCompleted;
    if (task.dailyCompleted) {
        task.completed = true;
        task.completionDate = new Date().toISOString().split('T')[0];
    } else {
        task.completed = false;
        task.completionDate = null;
    }
    if (task.dailyCompleted && task.pomodoros === 0) {
        task.pomodoros = 1;
    }
    saveGlobalTasks();
    renderTaskTable();
    renderGlobalTaskTable();
    populateTaskSelector();
}

function incrementTaskPomodoros(taskId) {
    const task = globalTasks.find(t => t.id === taskId);
    if (task) {
        task.pomodoros = (task.pomodoros || 0) + 1;
        saveGlobalTasks();
        renderTaskTable();
        renderGlobalTaskTable();
    }
}

function renderTaskTable() {
    if (!elements.taskTableBody) return;
    elements.taskTableBody.innerHTML = '';

    const dailyTasks = globalTasks.filter(t => t.isDaily);

    if (dailyTasks.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted)">Sin tareas para hoy. Ve a "Tareas Globales" y añade una tarea al día.</td>';
        elements.taskTableBody.appendChild(row);
        return;
    }

    dailyTasks.sort((a, b) => {
        const order = { 'Alta': 0, 'Media': 1, 'Baja': 2 };
        return (order[a.priority] || 1) - (order[b.priority] || 1);
    });

    dailyTasks.forEach(task => {
        const row = document.createElement('tr');
        const priorityClass = task.priority.toLowerCase();
        const checked = task.dailyCompleted ? 'checked' : '';
        row.innerHTML = `
            <td style="text-align:center"><input type="checkbox" class="task-checkbox" data-task-id="${task.id}" ${checked}></td>
            <td>${task.name}</td>
            <td><span class="priority-tag ${priorityClass}">${task.priority}</span></td>
            <td style="text-align:center"><span class="avances-count">${task.pomodoros || 0}</span></td>
            <td style="text-align:right">
                <button class="task-delete-btn" data-task-id="${task.id}" title="Eliminar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </td>
        `;
        const checkbox = row.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => toggleDailyCompleted(task.id));
        const deleteBtn = row.querySelector('.task-delete-btn');
        deleteBtn.addEventListener('click', () => deleteGlobalTask(task.id));
        elements.taskTableBody.appendChild(row);
    });
}

function renderGlobalTaskTable() {
    if (!elements.globalTaskTableBody) return;
    elements.globalTaskTableBody.innerHTML = '';

    if (globalTasks.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted)">No hay tareas globales. Añade una tarea arriba.</td>';
        elements.globalTaskTableBody.appendChild(row);
        return;
    }

    globalTasks.sort((a, b) => {
        const order = { 'Alta': 0, 'Media': 1, 'Baja': 2 };
        return (order[a.priority] || 1) - (order[b.priority] || 1);
    });

    globalTasks.forEach(task => {
        const row = document.createElement('tr');
        const priorityClass = task.priority.toLowerCase();

        const deadlineDisplay = task.deadline
            ? new Date(task.deadline + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
            : '—';

        row.innerHTML = `
            <td><span class="priority-tag ${priorityClass}">${task.priority}</span></td>
            <td>${task.name}</td>
            <td style="text-align:center;font-size:0.85rem;color:var(--text-muted)">${deadlineDisplay}</td>
            <td style="text-align:center"><span class="avances-count">${task.pomodoros || 0}</span></td>
            <td style="text-align:center">
                <button class="send-today-btn ${task.isDaily ? 'active' : ''}" data-task-id="${task.id}" title="${task.isDaily ? 'Quitar del día' : 'Añadir al día'}">
                    ${task.isDaily ? '✓' : '📅'}
                </button>
            </td>
            <td style="text-align:center;white-space:nowrap">
                <button class="task-action-btn edit-btn" data-task-id="${task.id}" title="Editar">✏️</button>
                <button class="task-action-btn delete-btn" data-task-id="${task.id}" title="Eliminar">🗑️</button>
            </td>
            <td style="text-align:center;font-size:0.9rem">
                ${task.completed
                    ? `<span title="Completado: ${task.completionDate}" style="color:var(--success-color);font-weight:600">✓ ${new Date(task.completionDate + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</span>`
                    : '<span style="color:var(--text-muted)">—</span>'}
            </td>
        `;
        const sendBtn = row.querySelector('.send-today-btn');
        sendBtn.addEventListener('click', () => sendToDaily(task.id));
        const editBtn = row.querySelector('.edit-btn');
        editBtn.addEventListener('click', () => editGlobalTask(task.id));
        const deleteBtn = row.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteGlobalTask(task.id));
        elements.globalTaskTableBody.appendChild(row);
    });
}

function populateTaskSelector() {
    if (!elements.taskSelector) return;
    elements.taskSelector.innerHTML = '<option value="">-- Sin tarea --</option>';
    const dailyTasks = globalTasks.filter(t => t.isDaily && !t.dailyCompleted);
    dailyTasks.forEach(task => {
        const option = document.createElement('option');
        option.value = task.id;
        option.textContent = `${task.name} (${task.pomodoros || 0}🍅)`;
        elements.taskSelector.appendChild(option);
    });
    if (selectedTaskId && globalTasks.some(t => t.id === selectedTaskId)) {
        elements.taskSelector.value = selectedTaskId;
    }
}

function getSelectedTaskId() {
    return elements.taskSelector ? parseInt(elements.taskSelector.value) || null : null;
}

// Initialize everything
function init() {
    loadQuote();
    loadStats();
    setupEventListeners();
    setInterval(updateGreeting, 60000);
    loadAutoMusicSetting();
    loadSavedWallpaper();
    // checkUserName, updateGreeting, initTasks called after auth in afterAuthInit()
}

document.addEventListener('DOMContentLoaded', init);