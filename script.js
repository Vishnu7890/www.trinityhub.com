// Global State Management
class AppState {
  constructor() {
    this.user = null;
    this.cart = [];
    this.progress = {
      alphabetGame: 0,
      colorSplash: 0,
      storytime: 0,
      musicRoom: 0,
      lecturesWatched: 0
    };
    this.completedLectures = [];
    this.init();
  }

  init() {
    this.loadFromStorage();
    this.updateUI();
  }

  loadFromStorage() {
    // Load user
    const userData = localStorage.getItem('kidslearn_user');
    if (userData) {
      this.user = JSON.parse(userData);
    }

    // Load cart
    const cartData = localStorage.getItem('kidslearn_cart');
    if (cartData) {
      this.cart = JSON.parse(cartData);
    }

    // Load progress
    const progressData = localStorage.getItem('kidslearn_progress');
    if (progressData) {
      this.progress = { ...this.progress, ...JSON.parse(progressData) };
    }

    // Load completed lectures
    const lecturesData = localStorage.getItem('kidslearn_completed_lectures');
    if (lecturesData) {
      this.completedLectures = JSON.parse(lecturesData);
    }
  }

  saveToStorage() {
    if (this.user) {
      localStorage.setItem('kidslearn_user', JSON.stringify(this.user));
    }
    localStorage.setItem('kidslearn_cart', JSON.stringify(this.cart));
    localStorage.setItem('kidslearn_progress', JSON.stringify(this.progress));
    localStorage.setItem('kidslearn_completed_lectures', JSON.stringify(this.completedLectures));
  }

  setUser(user) {
    this.user = user;
    this.saveToStorage();
    this.updateUI();
  }

  logout() {
    this.user = null;
    localStorage.removeItem('kidslearn_user');
    this.updateUI();
    router.navigate('#/');
  }

  updateProgress(gameType, score) {
    const gameKey = gameType.replace('-', '');
    this.progress[gameKey] = Math.max(this.progress[gameKey] || 0, score);
    this.saveToStorage();
    this.updateUI();
  }

  addToCart(product) {
    const existing = this.cart.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.cart.push({ ...product, quantity: 1 });
    }
    this.saveToStorage();
    this.updateUI();
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(item => item.id !== productId);
    this.saveToStorage();
    this.updateUI();
  }

  updateCartQuantity(productId, quantity) {
    if (quantity <= 0) {
      this.removeFromCart(productId);
    } else {
      const item = this.cart.find(item => item.id === productId);
      if (item) {
        item.quantity = quantity;
        this.saveToStorage();
        this.updateUI();
      }
    }
  }

  getCartItemCount() {
    return this.cart.reduce((total, item) => total + item.quantity, 0);
  }

  getCartTotal() {
    return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  resetProgress() {
    this.progress = {
      alphabetGame: 0,
      colorSplash: 0,
      storytime: 0,
      musicRoom: 0,
      lecturesWatched: 0
    };
    this.completedLectures = [];
    localStorage.removeItem('kidslearn_completed_lectures');
    this.saveToStorage();
    this.updateUI();
  }

  updateUI() {
    this.updateNavigation();
    this.updateCartBadges();
  }

  updateNavigation() {
    const loggedOutElements = document.querySelectorAll('.auth-logged-out');
    const loggedInElements = document.querySelectorAll('.auth-logged-in');
    const userNameElements = document.querySelectorAll('.user-name, .mobile-user-name');

    if (this.user) {
      loggedOutElements.forEach(el => el.style.display = 'none');
      loggedInElements.forEach(el => el.style.display = 'flex');
      userNameElements.forEach(el => el.textContent = this.user.name);
    } else {
      loggedOutElements.forEach(el => el.style.display = 'flex');
      loggedInElements.forEach(el => el.style.display = 'none');
    }
  }

  updateCartBadges() {
    const cartBadges = document.querySelectorAll('.cart-badge, #store-cart-badge');
    const count = this.getCartItemCount();
    cartBadges.forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    });
  }
}

// Router
class Router {
  constructor() {
    this.routes = {
      '': 'page-home',
      'home': 'page-home',
      'about': 'page-about',
      'login': 'page-login',
      'signup': 'page-signup',
      'games': 'page-games',
      'lectures': 'page-lectures',
      'dashboard': 'page-dashboard',
      'purchases': 'page-purchases'
    };
    this.currentPage = '';
    this.init();
  }

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  }

  handleRoute() {
    const hash = window.location.hash.slice(1);
    const route = hash.split('/')[1] || '';
    this.navigate(route, false);
  }

  navigate(route, updateHash = true) {
    if (updateHash) {
      window.location.hash = route ? `#/${route}` : '#/';
      return;
    }

    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
      page.style.display = 'none';
    });

    // Show target page
    const pageId = this.routes[route] || 'page-home';
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
      targetPage.style.display = 'block';
      this.currentPage = route;
      this.updateActiveNavLinks();
      this.handlePageSpecificLogic(route);
    }
  }

  updateActiveNavLinks() {
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href === `#/${this.currentPage}` || (this.currentPage === '' && href === '#/')) {
        link.classList.add('active');
      }
    });
  }

  handlePageSpecificLogic(route) {
    switch (route) {
      case 'dashboard':
        if (!appState.user) {
          this.navigate('login');
          return;
        }
        dashboardManager.updateDashboard();
        break;
      case 'games':
        gamesManager.updateProgress();
        break;
      case 'lectures':
        lecturesManager.renderLectures();
        break;
      case 'purchases':
        storeManager.renderProducts();
        break;
    }
  }
}

// Mobile Navigation
class MobileNav {
  constructor() {
    this.isOpen = false;
    this.init();
  }

  init() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    
    menuBtn.addEventListener('click', () => this.toggle());
    
    // Close menu when clicking nav links
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => this.close());
    });
  }

  toggle() {
    this.isOpen = !this.isOpen;
    const mobileNav = document.getElementById('mobile-nav');
    const hamburgerIcon = document.querySelector('.hamburger-icon');
    const closeIcon = document.querySelector('.close-icon');
    
    if (this.isOpen) {
      mobileNav.style.display = 'block';
      hamburgerIcon.style.display = 'none';
      closeIcon.style.display = 'inline';
    } else {
      mobileNav.style.display = 'none';
      hamburgerIcon.style.display = 'inline';
      closeIcon.style.display = 'none';
    }
  }

  close() {
    this.isOpen = false;
    const mobileNav = document.getElementById('mobile-nav');
    const hamburgerIcon = document.querySelector('.hamburger-icon');
    const closeIcon = document.querySelector('.close-icon');
    
    mobileNav.style.display = 'none';
    hamburgerIcon.style.display = 'inline';
    closeIcon.style.display = 'none';
  }
}

// Authentication Manager
class AuthManager {
  constructor() {
    this.init();
  }

  init() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    // Signup form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => this.handleSignup(e));
    }

    // Password toggles
    document.querySelectorAll('.password-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => this.togglePassword(e));
    });

    // Logout buttons
    document.querySelectorAll('#logout-btn, #mobile-logout-btn, #dashboard-logout-btn').forEach(btn => {
      btn.addEventListener('click', () => appState.logout());
    });
  }

  async handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');
    
    this.setLoading(true, 'login');
    this.clearError('login');

    // Simulate network delay
    await this.delay(1000);

    // Check credentials
    const users = JSON.parse(localStorage.getItem('kidslearn_users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      appState.setUser(user);
      router.navigate('dashboard');
    } else {
      this.showError('login', 'Invalid email or password. Please try again.');
    }

    this.setLoading(false, 'login');
  }

  async handleSignup(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    
    this.setLoading(true, 'signup');
    this.clearError('signup');

    // Validation
    if (!name || name.trim().length < 2) {
      this.showError('signup', 'Please enter a valid name (at least 2 characters).');
      this.setLoading(false, 'signup');
      return;
    }

    if (!email || !email.includes('@')) {
      this.showError('signup', 'Please enter a valid email address.');
      this.setLoading(false, 'signup');
      return;
    }

    if (!password || password.length < 6) {
      this.showError('signup', 'Password must be at least 6 characters long.');
      this.setLoading(false, 'signup');
      return;
    }

    // Simulate network delay
    await this.delay(1000);

    // Check if user exists
    const users = JSON.parse(localStorage.getItem('kidslearn_users') || '[]');
    if (users.find(u => u.email === email)) {
      this.showError('signup', 'An account with this email already exists.');
      this.setLoading(false, 'signup');
      return;
    }

    // Create user
    const newUser = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email,
      password: password,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('kidslearn_users', JSON.stringify(users));
    
    // Initialize progress
    const initialProgress = {
      alphabetGame: 0,
      colorSplash: 0,
      storytime: 0,
      musicRoom: 0,
      lecturesWatched: 0
    };
    localStorage.setItem('kidslearn_progress', JSON.stringify(initialProgress));

    appState.setUser(newUser);
    router.navigate('dashboard');
    this.setLoading(false, 'signup');
  }

  togglePassword(e) {
    const button = e.target;
    const input = button.parentElement.querySelector('input');
    
    if (input.type === 'password') {
      input.type = 'text';
      button.textContent = '🙈';
    } else {
      input.type = 'password';
      button.textContent = '👁️';
    }
  }

  setLoading(loading, type) {
    const submitBtn = document.getElementById(`${type}-submit`);
    if (submitBtn) {
      submitBtn.disabled = loading;
      submitBtn.textContent = loading ? 'Please wait...' : (type === 'login' ? 'Sign In' : 'Create Account');
    }
  }

  showError(type, message) {
    const errorElement = document.getElementById(`${type}-error`);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  clearError(type) {
    const errorElement = document.getElementById(`${type}-error`);
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Games Manager
class GamesManager {
  constructor() {
    this.activeGame = 'alphabet';
    this.completedGames = [];
    this.alphabetOrder = [];
    this.selectedColor = 'red';
    this.shapesColored = {};
    this.currentStory = 0;
    this.isReading = false;
    this.audioContext = null;
    this.init();
  }

  init() {
    // Game tabs
    document.querySelectorAll('.game-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const gameType = e.target.dataset.game;
        this.switchGame(gameType);
      });
    });

    this.initAlphabetGame();
    this.initColorSplashGame();
    this.initStorytimeGame();
    this.initMusicRoomGame();
    this.loadProgress();
  }

  switchGame(gameType) {
    this.activeGame = gameType;
    
    // Update tabs
    document.querySelectorAll('.game-tab').forEach(tab => {
      tab.classList.remove('active');
      if (tab.dataset.game === gameType) {
        tab.classList.add('active');
      }
    });

    // Show/hide game content
    document.querySelectorAll('.game-content').forEach(content => {
      content.style.display = 'none';
    });
    
    const activeContent = document.getElementById(`game-${gameType}`);
    if (activeContent) {
      activeContent.style.display = 'block';
    }
  }

  initAlphabetGame() {
    const dropZone = document.getElementById('alphabet-drop-zone');
    const letters = document.querySelectorAll('.letter-btn');
    const resetBtn = document.getElementById('alphabet-reset');

    // Drag and drop handlers
    letters.forEach(letter => {
      letter.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', e.target.dataset.letter);
        e.target.classList.add('dragging');
      });

      letter.addEventListener('dragend', (e) => {
        e.target.classList.remove('dragging');
      });
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      
      const letter = e.dataTransfer.getData('text/plain');
      if (letter && !this.alphabetOrder.includes(letter)) {
        this.addLetterToOrder(letter);
      }
    });

    resetBtn.addEventListener('click', () => this.resetAlphabetGame());
  }

  addLetterToOrder(letter) {
    this.alphabetOrder.push(letter);
    this.updateDropZone();
    
    // Hide the dragged letter
    const letterBtn = document.querySelector(`[data-letter="${letter}"]`);
    if (letterBtn) {
      letterBtn.style.display = 'none';
    }

    // Check completion
    if (this.alphabetOrder.length === 5) {
      const isCorrect = this.alphabetOrder.every((letter, index) => letter === ['A', 'B', 'C', 'D', 'E'][index]);
      if (isCorrect) {
        this.completeAlphabetGame();
      }
    }
  }

  updateDropZone() {
    const droppedLetters = document.getElementById('dropped-letters');
    const dropZoneText = document.querySelector('.drop-zone-text');
    
    if (this.alphabetOrder.length > 0) {
      dropZoneText.style.display = 'none';
      droppedLetters.innerHTML = this.alphabetOrder.map(letter => 
        `<span class="dropped-letter">${letter}</span>`
      ).join('');
    } else {
      dropZoneText.style.display = 'block';
      droppedLetters.innerHTML = '';
    }
  }

  completeAlphabetGame() {
    const completion = document.getElementById('alphabet-completion');
    completion.style.display = 'block';
    
    if (!this.completedGames.includes('alphabet')) {
      this.completedGames.push('alphabet');
      appState.updateProgress('alphabet', 100);
      this.updateGameTab('alphabet');
    }
  }

  resetAlphabetGame() {
    this.alphabetOrder = [];
    this.updateDropZone();
    
    // Show all letters
    document.querySelectorAll('.letter-btn').forEach(btn => {
      btn.style.display = 'block';
    });
    
    // Hide completion
    document.getElementById('alphabet-completion').style.display = 'none';
  }

  initColorSplashGame() {
    // Color selection
    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedColor = btn.dataset.color;
      });
    });

    // Shape coloring
    document.querySelectorAll('.shape-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const shape = btn.dataset.shape;
        this.colorShape(shape, btn);
      });
    });

    // Reset button
    document.getElementById('colors-reset').addEventListener('click', () => this.resetColorGame());
  }

  colorShape(shape, button) {
    this.shapesColored[shape] = this.selectedColor;
    button.style.backgroundColor = this.selectedColor;
    button.style.color = 'white';
    button.classList.add('colored');
    
    // Speak color name
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(this.selectedColor);
      speechSynthesis.speak(utterance);
    }
    
    // Check completion
    const coloredCount = Object.keys(this.shapesColored).length;
    if (coloredCount === 4 && !this.completedGames.includes('color-splash')) {
      this.completedGames.push('color-splash');
      appState.updateProgress('colorSplash', 100);
      this.updateGameTab('color-splash');
    }
  }

  resetColorGame() {
    this.shapesColored = {};
    document.querySelectorAll('.shape-btn').forEach(btn => {
      btn.style.backgroundColor = '';
      btn.style.color = '';
      btn.classList.remove('colored');
    });
  }

  initStorytimeGame() {
    this.stories = [
      {
        title: "The Little Owl's Adventure",
        content: "Once upon a time, a little owl named Hoot loved to learn new things every day. He would fly around the forest, discovering letters, numbers, and colors!"
      },
      {
        title: "Rainbow Colors",
        content: "In a magical land, all the colors lived together in harmony. Red roses, blue skies, green grass, and yellow sunshine made the world beautiful!"
      },
      {
        title: "Counting Stars",
        content: "Every night, Luna the cat would count the stars in the sky. One star, two stars, three stars, and more! Can you count along with Luna?"
      }
    ];

    document.getElementById('story-prev').addEventListener('click', () => this.previousStory());
    document.getElementById('story-next').addEventListener('click', () => this.nextStory());
    document.getElementById('story-read').addEventListener('click', () => this.toggleReading());
    
    this.updateStoryDisplay();
  }

  updateStoryDisplay() {
    const story = this.stories[this.currentStory];
    document.getElementById('story-title').textContent = story.title;
    document.getElementById('story-content').textContent = story.content;
    document.getElementById('story-current').textContent = this.currentStory + 1;
    document.getElementById('story-total').textContent = this.stories.length;
  }

  previousStory() {
    this.currentStory = (this.currentStory - 1 + this.stories.length) % this.stories.length;
    this.stopReading();
    this.updateStoryDisplay();
  }

  nextStory() {
    this.currentStory = (this.currentStory + 1) % this.stories.length;
    this.stopReading();
    this.updateStoryDisplay();
  }

  toggleReading() {
    if (this.isReading) {
      this.stopReading();
    } else {
      this.startReading();
    }
  }

  startReading() {
    if ('speechSynthesis' in window) {
      const story = this.stories[this.currentStory];
      const utterance = new SpeechSynthesisUtterance(story.content);
      
      utterance.onend = () => {
        this.isReading = false;
        this.updateReadButton();
        if (!this.completedGames.includes('storytime')) {
          this.completedGames.push('storytime');
          appState.updateProgress('storytime', 100);
          this.updateGameTab('storytime');
        }
      };
      
      speechSynthesis.speak(utterance);
      this.isReading = true;
      this.updateReadButton();
    }
  }

  stopReading() {
    if (speechSynthesis) {
      speechSynthesis.cancel();
    }
    this.isReading = false;
    this.updateReadButton();
  }

  updateReadButton() {
    const readBtn = document.getElementById('story-read');
    const icon = readBtn.querySelector('.btn-icon');
    const text = readBtn.querySelector('.read-text');
    
    if (this.isReading) {
      icon.textContent = '⏸️';
      text.textContent = 'Stop Reading';
    } else {
      icon.textContent = '🔊';
      text.textContent = 'Read Aloud';
    }
  }

  initMusicRoomGame() {
    document.querySelectorAll('.piano-key').forEach(key => {
      key.addEventListener('click', (e) => {
        const note = e.target.dataset.note;
        const frequency = parseFloat(e.target.dataset.frequency);
        this.playNote(note, frequency, e.target);
      });
    });
  }

  async playNote(note, frequency, keyElement) {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 1);
      
      // Visual feedback
      keyElement.classList.add('playing');
      setTimeout(() => {
        keyElement.classList.remove('playing');
      }, 300);
      
      // Update progress
      if (!this.completedGames.includes('music-room')) {
        const currentProgress = appState.progress.musicRoom || 0;
        const newProgress = Math.min(currentProgress + 10, 100);
        appState.updateProgress('musicRoom', newProgress);
        
        if (newProgress >= 50 && !this.completedGames.includes('music-room')) {
          this.completedGames.push('music-room');
          this.updateGameTab('music-room');
        }
      }
      
    } catch (error) {
      console.log('Audio not supported');
    }
  }

  updateGameTab(gameType) {
    const tab = document.querySelector(`[data-game="${gameType}"]`);
    if (tab) {
      const check = tab.querySelector('.completion-check');
      if (check) {
        check.style.display = 'inline';
      }
    }
  }

  updateProgress() {
    const completedCount = this.completedGames.length;
    const progressBar = document.getElementById('games-progress');
    const completedText = document.getElementById('completed-games');
    
    if (progressBar) {
      progressBar.style.width = `${(completedCount / 4) * 100}%`;
    }
    
    if (completedText) {
      completedText.textContent = completedCount;
    }

    // Update tabs based on progress
    Object.keys(appState.progress).forEach(key => {
      if (appState.progress[key] >= 100) {
        const gameType = key === 'alphabetGame' ? 'alphabet' : 
                       key === 'colorSplash' ? 'color-splash' :
                       key === 'storytime' ? 'storytime' : 
                       key === 'musicRoom' ? 'music-room' : null;
        if (gameType && !this.completedGames.includes(gameType)) {
          this.completedGames.push(gameType);
          this.updateGameTab(gameType);
        }
      }
    });
  }

  loadProgress() {
    // Load completed games from progress
    Object.keys(appState.progress).forEach(key => {
      if (appState.progress[key] >= 100) {
        const gameType = key === 'alphabetGame' ? 'alphabet' : 
                       key === 'colorSplash' ? 'color-splash' :
                       key === 'storytime' ? 'storytime' : 
                       key === 'musicRoom' ? 'music-room' : null;
        if (gameType && !this.completedGames.includes(gameType)) {
          this.completedGames.push(gameType);
          this.updateGameTab(gameType);
        }
      }
    });
    this.updateProgress();
  }
}

// Lectures Manager
class LecturesManager {
  constructor() {
    this.selectedCategory = 'all';
    this.selectedLecture = null;
    this.lectures = [
      {
        id: '1',
        title: 'Learning the Alphabet Song',
        description: 'Sing along with the classic ABC song and learn letter recognition',
        category: 'alphabet',
        duration: '3 min',
        ageGroup: '3-5 years',
        thumbnail: 'attached_assets/generated_images/Educational_lecture_thumbnails_collection_43d8f295.png',
        content: 'Join us as we sing the alphabet song together! A, B, C, D, E, F, G... This classic song helps children learn letter recognition and sequence.'
      },
      {
        id: '2',
        title: 'Counting to 10',
        description: 'Learn numbers 1-10 with fun animations and examples',
        category: 'numbers',
        duration: '4 min',
        ageGroup: '3-6 years',
        thumbnail: 'attached_assets/generated_images/Educational_lecture_thumbnails_collection_43d8f295.png',
        content: 'Let\'s count together! 1, 2, 3, 4, 5, 6, 7, 8, 9, 10! We\'ll use fun examples like counting apples, stars, and toys.'
      },
      {
        id: '3',
        title: 'Colors All Around Us',
        description: 'Discover colors in nature, toys, and everyday objects',
        category: 'colors',
        duration: '5 min',
        ageGroup: '2-5 years',
        thumbnail: 'attached_assets/generated_images/Educational_lecture_thumbnails_collection_43d8f295.png',
        content: 'Look around and see the beautiful colors! Red roses, blue sky, green grass, yellow sun. Colors make our world amazing!'
      },
      {
        id: '4',
        title: 'Musical Instruments',
        description: 'Learn about different instruments and their sounds',
        category: 'music',
        duration: '6 min',
        ageGroup: '4-6 years',
        thumbnail: 'attached_assets/generated_images/Educational_lecture_thumbnails_collection_43d8f295.png',
        content: 'Let\'s explore musical instruments! The piano goes ding-dong, the drums go boom-boom, and the violin makes beautiful melodies.'
      },
      {
        id: '5',
        title: 'The Three Little Pigs',
        description: 'Listen to this classic fairy tale with colorful illustrations',
        category: 'stories',
        duration: '8 min',
        ageGroup: '3-6 years',
        thumbnail: 'attached_assets/generated_images/Educational_lecture_thumbnails_collection_43d8f295.png',
        content: 'Once upon a time, there were three little pigs who each built a house. One built with straw, one with sticks, and one with bricks...'
      },
      {
        id: '6',
        title: 'Shapes in Our World',
        description: 'Identify circles, squares, triangles, and other shapes',
        category: 'shapes',
        duration: '4 min',
        ageGroup: '3-5 years',
        thumbnail: 'attached_assets/generated_images/Educational_lecture_thumbnails_collection_43d8f295.png',
        content: 'Shapes are everywhere! Circles like wheels, squares like windows, triangles like rooftops. Let\'s find shapes together!'
      }
    ];
    this.init();
  }

  init() {
    // Category filter
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = e.target.dataset.category;
        this.filterByCategory(category);
      });
    });

    // Modal controls
    const modal = document.getElementById('lecture-modal');
    const closeBtn = document.getElementById('modal-close');
    const playBtn = document.getElementById('modal-play-btn');

    closeBtn.addEventListener('click', () => this.closeModal());
    playBtn.addEventListener('click', () => this.toggleLecturePlay());
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal();
      }
    });

    this.renderLectures();
  }

  filterByCategory(category) {
    this.selectedCategory = category;
    
    // Update filter buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.category === category) {
        btn.classList.add('active');
      }
    });

    this.renderLectures();
  }

  renderLectures() {
    const grid = document.getElementById('lectures-grid');
    const noLecturesMsg = document.getElementById('no-lectures');
    
    const filteredLectures = this.selectedCategory === 'all' 
      ? this.lectures 
      : this.lectures.filter(lecture => lecture.category === this.selectedCategory);

    if (filteredLectures.length === 0) {
      grid.style.display = 'none';
      noLecturesMsg.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    noLecturesMsg.style.display = 'none';

    grid.innerHTML = filteredLectures.map(lecture => `
      <div class="lecture-card" data-lecture-id="${lecture.id}" data-testid="card-lecture-${lecture.id}">
        <div class="lecture-thumbnail">
          <img src="${lecture.thumbnail}" alt="${lecture.title}">
          <div class="lecture-overlay">
            <div class="play-icon">▶</div>
          </div>
          <div class="lecture-duration">${lecture.duration}</div>
        </div>
        
        <div class="lecture-info">
          <div class="lecture-header">
            <h3 class="lecture-title">${lecture.title}</h3>
            <div class="lecture-age-group">${lecture.ageGroup}</div>
          </div>
          <p class="lecture-description">${lecture.description}</p>
          
          <div class="lecture-footer">
            <div class="lecture-category">${lecture.category}</div>
            <div class="lecture-time">
              <span>⏱️</span>
              ${lecture.duration}
            </div>
          </div>
        </div>
      </div>
    `).join('');

    // Add click handlers
    grid.querySelectorAll('.lecture-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const lectureId = e.currentTarget.dataset.lectureId;
        this.openLecture(lectureId);
      });
    });
  }

  openLecture(lectureId) {
    const lecture = this.lectures.find(l => l.id === lectureId);
    if (!lecture) return;

    this.selectedLecture = lecture;
    this.showModal();
  }

  showModal() {
    const modal = document.getElementById('lecture-modal');
    const lecture = this.selectedLecture;
    
    document.getElementById('modal-lecture-title').textContent = lecture.title;
    document.getElementById('modal-lecture-description').textContent = lecture.description;
    document.getElementById('modal-lecture-image').src = lecture.thumbnail;
    document.getElementById('modal-lecture-image').alt = lecture.title;
    document.getElementById('modal-duration').textContent = lecture.duration;
    document.getElementById('modal-age-group').textContent = lecture.ageGroup;
    document.getElementById('modal-category').textContent = lecture.category;
    document.getElementById('modal-content-text').textContent = lecture.content;
    
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    const modal = document.getElementById('lecture-modal');
    modal.classList.remove('open');
    document.body.style.overflow = '';
    this.selectedLecture = null;
    
    // Reset play state
    const playBtn = document.getElementById('modal-play-btn');
    const playIcon = playBtn.querySelector('.btn-icon');
    const playText = playBtn.querySelector('.play-text');
    const content = document.getElementById('modal-lecture-content');
    
    playIcon.textContent = '▶';
    playText.textContent = 'Start Lecture';
    content.style.display = 'none';
  }

  toggleLecturePlay() {
    const playBtn = document.getElementById('modal-play-btn');
    const playIcon = playBtn.querySelector('.btn-icon');
    const playText = playBtn.querySelector('.play-text');
    const content = document.getElementById('modal-lecture-content');
    
    if (content.style.display === 'none') {
      // Start playing
      playIcon.textContent = '🎨';
      playText.textContent = 'Playing...';
      content.style.display = 'block';
      
      // Mark as completed after a delay
      setTimeout(() => {
        if (!appState.completedLectures.includes(this.selectedLecture.id)) {
          appState.completedLectures.push(this.selectedLecture.id);
          appState.progress.lecturesWatched = (appState.progress.lecturesWatched || 0) + 1;
          appState.saveToStorage();
        }
      }, 2000);
    }
  }
}

// Dashboard Manager
class DashboardManager {
  constructor() {
    this.init();
  }

  init() {
    // Reset progress handlers
    document.getElementById('reset-progress-btn').addEventListener('click', () => {
      this.showResetAlert();
    });

    document.getElementById('confirm-reset').addEventListener('click', () => {
      this.confirmReset();
    });

    document.getElementById('cancel-reset').addEventListener('click', () => {
      this.hideResetAlert();
    });
  }

  showResetAlert() {
    document.getElementById('reset-alert').style.display = 'block';
  }

  hideResetAlert() {
    document.getElementById('reset-alert').style.display = 'none';
  }

  confirmReset() {
    appState.resetProgress();
    this.hideResetAlert();
    this.updateDashboard();
  }

  updateDashboard() {
    this.updateUserInfo();
    this.updateOverviewCards();
    this.updateActivityProgress();
    this.updateAchievements();
  }

  updateUserInfo() {
    const userNameElement = document.getElementById('dashboard-user-name');
    if (userNameElement && appState.user) {
      userNameElement.textContent = appState.user.name;
    }
  }

  updateOverviewCards() {
    const progress = appState.progress;
    const activities = ['alphabetGame', 'colorSplash', 'storytime', 'musicRoom'];
    
    // Calculate overall progress
    const totalProgress = activities.reduce((sum, activity) => sum + (progress[activity] || 0), 0) / activities.length;
    
    // Update overall progress
    document.getElementById('overall-progress').textContent = `${Math.round(totalProgress)}%`;
    document.getElementById('overall-progress-bar').style.width = `${totalProgress}%`;
    
    // Update activities completed
    const completedActivities = activities.filter(activity => (progress[activity] || 0) >= 100).length;
    document.getElementById('activities-completed').textContent = `${completedActivities} / ${activities.length}`;
    
    // Update lectures watched
    document.getElementById('lectures-watched').textContent = progress.lecturesWatched || 0;
    
    // Update learning level
    const level = this.getLearningLevel(totalProgress);
    document.getElementById('learning-level').textContent = level.level;
    
    const levelBadge = document.getElementById('level-badge');
    levelBadge.className = `level-badge ${level.badge}`;
  }

  getLearningLevel(progress) {
    if (progress >= 90) return { level: 'Expert', badge: 'expert' };
    if (progress >= 70) return { level: 'Advanced', badge: 'advanced' };
    if (progress >= 50) return { level: 'Intermediate', badge: 'intermediate' };
    if (progress >= 25) return { level: 'Beginner', badge: 'beginner' };
    return { level: 'Getting Started', badge: 'getting-started' };
  }

  updateActivityProgress() {
    const progressContainer = document.getElementById('activities-progress');
    const progress = appState.progress;
    
    const activities = [
      { key: 'alphabetGame', name: 'Alphabet Adventure', icon: '⭐', color: 'alphabet' },
      { key: 'colorSplash', name: 'Color Splash', icon: '🎨', color: 'colors' },
      { key: 'storytime', name: 'Story Time', icon: '📚', color: 'stories' },
      { key: 'musicRoom', name: 'Music Room', icon: '🎵', color: 'music' }
    ];

    progressContainer.innerHTML = activities.map(activity => {
      const activityProgress = progress[activity.key] || 0;
      const isComplete = activityProgress >= 100;
      
      return `
        <div class="activity-progress">
          <div class="activity-progress-header">
            <div class="activity-progress-info">
              <div class="activity-progress-icon ${activity.color}-icon">
                ${activity.icon}
              </div>
              <div class="activity-progress-details">
                <h3>${activity.name}</h3>
                <p>${activityProgress}% complete</p>
              </div>
            </div>
            ${isComplete ? `
              <div class="activity-complete-badge">
                <span>🏆</span>
                Complete
              </div>
            ` : ''}
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${activityProgress}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  updateAchievements() {
    const achievementsContainer = document.getElementById('achievements-grid');
    const progress = appState.progress;
    
    const achievements = [
      { 
        name: 'First Letter', 
        description: 'Completed first alphabet game', 
        earned: (progress.alphabetGame || 0) > 0 
      },
      { 
        name: 'Color Master', 
        description: 'Completed 5 color games', 
        earned: (progress.colorSplash || 0) >= 50 
      },
      { 
        name: 'Story Listener', 
        description: 'Listened to 3 stories', 
        earned: (progress.storytime || 0) >= 60 
      },
      { 
        name: 'Music Maker', 
        description: 'Played 10 songs', 
        earned: (progress.musicRoom || 0) >= 40 
      },
      { 
        name: 'Learning Star', 
        description: 'Reached 75% overall progress', 
        earned: this.getOverallProgress() >= 75 
      }
    ];

    achievementsContainer.innerHTML = achievements.map(achievement => `
      <div class="achievement ${achievement.earned ? 'earned' : 'not-earned'}" 
           data-testid="achievement-${achievement.name.replace(/\s+/g, '-').toLowerCase()}">
        <div class="achievement-content">
          <div class="achievement-icon ${achievement.earned ? 'earned' : 'not-earned'}">
            🏆
          </div>
          <div class="achievement-details">
            <h4>${achievement.name}</h4>
            <p>${achievement.description}</p>
          </div>
        </div>
      </div>
    `).join('');
  }

  getOverallProgress() {
    const progress = appState.progress;
    const activities = ['alphabetGame', 'colorSplash', 'storytime', 'musicRoom'];
    return activities.reduce((sum, activity) => sum + (progress[activity] || 0), 0) / activities.length;
  }
}

// Store Manager
class StoreManager {
  constructor() {
    this.selectedCategory = 'all';
    this.products = [
      {
        id: '1',
        name: 'Alphabet Flashcards',
        description: 'Colorful flashcards with letters and pictures to help learn the alphabet',
        price: 12.99,
        category: 'educational',
        rating: 4.8,
        ageGroup: '3-5 years',
        emoji: '📝'
      },
      {
        id: '2',
        name: 'Number Puzzle Set',
        description: 'Fun wooden puzzles for learning numbers 1-20 with beautiful illustrations',
        price: 18.99,
        category: 'puzzles',
        rating: 4.9,
        ageGroup: '4-6 years',
        emoji: '🧩'
      },
      {
        id: '3',
        name: 'Color Recognition Game',
        description: 'Interactive board game to learn colors and matching skills',
        price: 15.99,
        category: 'games',
        rating: 4.7,
        ageGroup: '3-5 years',
        emoji: '🎲'
      },
      {
        id: '4',
        name: 'Musical Instruments Set',
        description: 'Child-safe instruments including tambourine, maracas, and triangle',
        price: 24.99,
        category: 'music',
        rating: 4.6,
        ageGroup: '2-6 years',
        emoji: '🎵'
      },
      {
        id: '5',
        name: 'Bedtime Stories Collection',
        description: 'Beautiful illustrated book with 10 classic bedtime stories',
        price: 16.99,
        category: 'books',
        rating: 4.9,
        ageGroup: '3-7 years',
        emoji: '📚'
      },
      {
        id: '6',
        name: 'Shape Sorting Toy',
        description: 'Wooden shape sorter with geometric shapes and matching holes',
        price: 22.99,
        category: 'educational',
        rating: 4.8,
        ageGroup: '2-4 years',
        emoji: '⭐'
      }
    ];
    this.init();
  }

  init() {
    // Category filter
    document.querySelectorAll('.store-category-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = e.target.dataset.category;
        this.filterByCategory(category);
      });
    });

    // Cart modal
    document.getElementById('view-cart-btn').addEventListener('click', () => this.showCartModal());
    document.getElementById('cart-modal-close').addEventListener('click', () => this.hideCartModal());
    
    const cartModal = document.getElementById('cart-modal');
    cartModal.addEventListener('click', (e) => {
      if (e.target === cartModal) {
        this.hideCartModal();
      }
    });

    this.renderProducts();
  }

  filterByCategory(category) {
    this.selectedCategory = category;
    
    // Update filter buttons
    document.querySelectorAll('.store-category-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.category === category) {
        btn.classList.add('active');
      }
    });

    this.renderProducts();
  }

  renderProducts() {
    const grid = document.getElementById('products-grid');
    const noProductsMsg = document.getElementById('no-products');
    
    const filteredProducts = this.selectedCategory === 'all' 
      ? this.products 
      : this.products.filter(product => product.category === this.selectedCategory);

    if (filteredProducts.length === 0) {
      grid.style.display = 'none';
      noProductsMsg.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    noProductsMsg.style.display = 'none';

    grid.innerHTML = filteredProducts.map(product => `
      <div class="product-card" data-testid="card-product-${product.id}">
        <div class="product-image">
          <div class="product-emoji">${product.emoji}</div>
          <p class="product-image-text">Product Image</p>
          <div class="product-price">$${product.price}</div>
        </div>
        
        <div class="product-info">
          <div class="product-header">
            <h3 class="product-title">${product.name}</h3>
            <div class="product-rating">
              <span class="rating-star">⭐</span>
              <span class="rating-value">${product.rating}</span>
            </div>
          </div>
          <p class="product-description">${product.description}</p>
          
          <div class="product-footer">
            <div class="lecture-age-group">${product.ageGroup}</div>
            <div class="lecture-category">${product.category}</div>
          </div>
          
          <button class="btn btn-primary btn-full" data-product-id="${product.id}" data-testid="button-add-to-cart-${product.id}">
            <span class="btn-icon">➕</span>
            Add to Cart - $${product.price}
          </button>
        </div>
      </div>
    `).join('');

    // Add click handlers for add to cart buttons
    grid.querySelectorAll('button[data-product-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const productId = e.target.dataset.productId;
        const product = this.products.find(p => p.id === productId);
        if (product) {
          appState.addToCart(product);
        }
      });
    });
  }

  showCartModal() {
    const modal = document.getElementById('cart-modal');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    this.renderCart();
  }

  hideCartModal() {
    const modal = document.getElementById('cart-modal');
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  renderCart() {
    const cartContent = document.getElementById('cart-content');
    const cartEmpty = document.getElementById('cart-empty');
    const cartFooter = document.getElementById('cart-footer');
    const itemCount = document.getElementById('cart-item-count');
    const cartTotal = document.getElementById('cart-total');
    
    const cart = appState.cart;
    itemCount.textContent = appState.getCartItemCount();

    if (cart.length === 0) {
      cartContent.style.display = 'none';
      cartEmpty.style.display = 'block';
      cartFooter.style.display = 'none';
      return;
    }

    cartContent.style.display = 'block';
    cartEmpty.style.display = 'none';
    cartFooter.style.display = 'block';

    cartContent.innerHTML = cart.map(item => `
      <div class="cart-item" data-testid="cart-item-${item.id}">
        <div class="cart-item-info">
          <h4 class="cart-item-title">${item.name}</h4>
          <p class="cart-item-price">$${item.price} each</p>
        </div>
        
        <div class="cart-item-controls">
          <button class="quantity-btn" data-action="decrease" data-item-id="${item.id}" data-testid="button-decrease-${item.id}">-</button>
          <span class="quantity-display">${item.quantity}</span>
          <button class="quantity-btn" data-action="increase" data-item-id="${item.id}" data-testid="button-increase-${item.id}">+</button>
          <button class="remove-btn" data-item-id="${item.id}" data-testid="button-remove-${item.id}">🗑️</button>
        </div>
      </div>
    `).join('');

    cartTotal.textContent = `$${appState.getCartTotal().toFixed(2)}`;

    // Add event listeners
    cartContent.querySelectorAll('.quantity-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemId = e.target.dataset.itemId;
        const action = e.target.dataset.action;
        const item = cart.find(i => i.id === itemId);
        
        if (item) {
          const newQuantity = action === 'increase' ? item.quantity + 1 : item.quantity - 1;
          appState.updateCartQuantity(itemId, newQuantity);
          this.renderCart();
        }
      });
    });

    cartContent.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemId = e.target.dataset.itemId;
        appState.removeFromCart(itemId);
        this.renderCart();
      });
    });
  }
}

// Hero Section Manager
class HeroManager {
  constructor() {
    this.init();
  }

  init() {
    // Get started button
    document.getElementById('get-started-btn').addEventListener('click', () => {
      if (appState.user) {
        router.navigate('games');
      } else {
        router.navigate('signup');
      }
    });

    // About page get started buttons
    document.getElementById('about-get-started')?.addEventListener('click', () => {
      if (appState.user) {
        router.navigate('games');
      } else {
        router.navigate('signup');
      }
    });

    document.getElementById('about-start-learning')?.addEventListener('click', () => {
      if (appState.user) {
        router.navigate('games');
      } else {
        router.navigate('signup');
      }
    });

    // Activity cards
    document.querySelectorAll('.activity-card').forEach(card => {
      card.addEventListener('click', () => {
        router.navigate('games');
      });
    });
  }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize global state
  window.appState = new AppState();
  
  // Initialize managers
  window.router = new Router();
  window.mobileNav = new MobileNav();
  window.authManager = new AuthManager();
  window.gamesManager = new GamesManager();
  window.lecturesManager = new LecturesManager();
  window.dashboardManager = new DashboardManager();
  window.storeManager = new StoreManager();
  window.heroManager = new HeroManager();
  
  console.log('KidsLearn Interactive Learning Platform initialized!');
});