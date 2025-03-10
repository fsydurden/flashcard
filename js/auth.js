// auth.js - Client-side authentication handling

// In a production app, you'd use a server backend
// This implementation uses localStorage for demonstration

const AUTH_KEY = 'simpleAnki_auth';
const USERS_KEY = 'simpleAnki_users';
const CARDS_KEY = 'simpleAnki_cards';
const DECKS_KEY = 'simpleAnki_decks';
const STATS_KEY = 'simpleAnki_stats';

// Initialize storage if not exists
function initializeStorage() {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(CARDS_KEY)) {
    localStorage.setItem(CARDS_KEY, JSON.stringify({}));
  }
  if (!localStorage.getItem(DECKS_KEY)) {
    localStorage.setItem(DECKS_KEY, JSON.stringify({}));
  }
  if (!localStorage.getItem(STATS_KEY)) {
    localStorage.setItem(STATS_KEY, JSON.stringify({}));
  }
}

// User Authentication Functions
const Auth = {
  // Register a new user
  register: function(name, email, password) {
    return new Promise((resolve, reject) => {
      initializeStorage();
      
      // Get existing users
      const users = JSON.parse(localStorage.getItem(USERS_KEY));
      
      // Check if email already exists
      if (users.some(user => user.email === email)) {
        return reject('Email already registered');
      }
      
      // Create a verification code (in a real app, this would be sent via email)
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Create user object with hashed password (using a simple hash for demo)
      // In a real app, use a proper hashing library like bcrypt
      const hashedPassword = this.simpleHash(password);
      
      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password: hashedPassword,
        verified: false,
        verificationCode,
        createdAt: new Date().toISOString()
      };
      
      // Add user to storage
      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      // Create empty decks and cards containers for the user
      const decks = JSON.parse(localStorage.getItem(DECKS_KEY));
      decks[newUser.id] = [];
      localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
      
      const cards = JSON.parse(localStorage.getItem(CARDS_KEY));
      cards[newUser.id] = {};
      localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
      
      const stats = JSON.parse(localStorage.getItem(STATS_KEY));
      stats[newUser.id] = {
        studiedToday: 0,
        totalSessions: 0,
        lastStudied: null,
        dailyStats: [],
        retention: 0
      };
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
      
      // In a real app, send verification email here
      console.log(`Verification code for ${email}: ${verificationCode}`);
      
      resolve(newUser);
    });
  },
  
  // Verify a user's email
  verifyEmail: function(email, code) {
    return new Promise((resolve, reject) => {
      const users = JSON.parse(localStorage.getItem(USERS_KEY));
      const userIndex = users.findIndex(user => user.email === email);
      
      if (userIndex === -1) {
        return reject('User not found');
      }
      
      if (users[userIndex].verificationCode !== code) {
        return reject('Invalid verification code');
      }
      
      // Update user as verified
      users[userIndex].verified = true;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      resolve(users[userIndex]);
    });
  },
  
  // Login user
  login: function(email, password) {
    return new Promise((resolve, reject) => {
      const users = JSON.parse(localStorage.getItem(USERS_KEY));
      const user = users.find(user => user.email === email);
      
      if (!user) {
        return reject('Invalid email or password');
      }
      
      const hashedPassword = this.simpleHash(password);
      if (user.password !== hashedPassword) {
        return reject('Invalid email or password');
      }
      
      if (!user.verified) {
        return reject('Please verify your email before logging in');
      }
      
      // Store auth session
      const session = {
        userId: user.id,
        name: user.name,
        email: user.email,
        timestamp: Date.now()
      };
      
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      resolve(user);
    });
  },
  
  // Logout user
  logout: function() {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = 'login.html';
  },
  
  // Check if user is logged in
  isLoggedIn: function() {
    const session = localStorage.getItem(AUTH_KEY);
    if (!session) return false;
    
    // In a real app, check token expiration, validate with server, etc.
    return true;
  },
  
  // Get current user
  getCurrentUser: function() {
    if (!this.isLoggedIn()) return null;
    
    const session = JSON.parse(localStorage.getItem(AUTH_KEY));
    return session;
  },
  
  // Update user profile
  updateProfile: function(name) {
    return new Promise((resolve, reject) => {
      if (!this.isLoggedIn()) {
        return reject('Not authenticated');
      }
      
      const session = JSON.parse(localStorage.getItem(AUTH_KEY));
      const users = JSON.parse(localStorage.getItem(USERS_KEY));
      const userIndex = users.findIndex(user => user.id === session.userId);
      
      if (userIndex === -1) {
        return reject('User not found');
      }
      
      // Update name
      users[userIndex].name = name;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      // Update session
      session.name = name;
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      
      resolve();
    });
  },
  
  // Change password
  changePassword: function(currentPassword, newPassword) {
    return new Promise((resolve, reject) => {
      if (!this.isLoggedIn()) {
        return reject('Not authenticated');
      }
      
      const session = JSON.parse(localStorage.getItem(AUTH_KEY));
      const users = JSON.parse(localStorage.getItem(USERS_KEY));
      const userIndex = users.findIndex(user => user.id === session.userId);
      
      if (userIndex === -1) {
        return reject('User not found');
      }
      
      const hashedCurrentPassword = this.simpleHash(currentPassword);
      if (users[userIndex].password !== hashedCurrentPassword) {
        return reject('Current password is incorrect');
      }
      
      // Update password
      users[userIndex].password = this.simpleHash(newPassword);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      resolve();
    });
  },
  
  // Delete account
  deleteAccount: function() {
    return new Promise((resolve, reject) => {
      if (!this.isLoggedIn()) {
        return reject('Not authenticated');
      }
      
      const session = JSON.parse(localStorage.getItem(AUTH_KEY));
      const userId = session.userId;
      
      // Remove user from users list
      const users = JSON.parse(localStorage.getItem(USERS_KEY));
      const updatedUsers = users.filter(user => user.id !== userId);
      localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
      
      // Remove user's decks
      const decks = JSON.parse(localStorage.getItem(DECKS_KEY));
      delete decks[userId];
      localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
      
      // Remove user's cards
      const cards = JSON.parse(localStorage.getItem(CARDS_KEY));
      delete cards[userId];
      localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
      
      // Remove user's stats
      const stats = JSON.parse(localStorage.getItem(STATS_KEY));
      delete stats[userId];
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
      
      // Clear auth session
      localStorage.removeItem(AUTH_KEY);
      
      resolve();
    });
  },
  
  // A simple hashing function for demonstration
  // In a real app, use a proper secure hashing library
  simpleHash: function(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }
};

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeStorage();
  
  // Login form handling
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const errorElement = document.getElementById('login-error');
      
      Auth.login(email, password)
        .then(() => {
          window.location.href = 'app.html';
        })
        .catch(error => {
          errorElement.textContent = error;
          errorElement.style.display = 'block';
        });
    });
  }
  
  // Signup form handling
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('signup-confirm').value;
      const errorElement = document.getElementById('signup-error');
      
      if (password !== confirmPassword) {
        errorElement.textContent = 'Passwords do not match';
        errorElement.style.display = 'block';
        return;
      }
      
      Auth.register(name, email, password)
        .then(() => {
          // Save email in session for verification
          sessionStorage.setItem('verifyEmail', email);
          window.location.href = 'verify.html';
        })
        .catch(error => {
          errorElement.textContent = error;
          errorElement.style.display = 'block';
        });
    });
  }
  
  // Check auth status for protected pages
  if (window.location.pathname.includes('app.html')) {
    if (!Auth.isLoggedIn()) {
      window.location.href = 'login.html';
    }
  }
});