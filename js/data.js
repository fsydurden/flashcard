// data.js - Flashcard data management

const FlashcardManager = {
    // Get all decks for current user
    getDecks: function() {
      return new Promise((resolve, reject) => {
        if (!Auth.isLoggedIn()) {
          return reject('Not authenticated');
        }
        
        const userId = Auth.getCurrentUser().userId;
        const decks = JSON.parse(localStorage.getItem(DECKS_KEY));
        
        resolve(decks[userId] || []);
      });
    },
    
    // Create a new deck
    createDeck: function(name) {
      return new Promise((resolve, reject) => {
        if (!Auth.isLoggedIn()) {
          return reject('Not authenticated');
        }
        
        const userId = Auth.getCurrentUser().userId;
        const decks = JSON.parse(localStorage.getItem(DECKS_KEY));
        
        // Ensure user has a decks array
        if (!decks[userId]) {
          decks[userId] = [];
        }
        
        // Check if deck name already exists
        if (decks[userId].some(deck => deck.name === name)) {
          return reject('A deck with this name already exists');
        }
        
        // Create new deck
        const newDeck = {
          id: Date.now().toString(),
          name,
          createdAt: new Date().toISOString(),
          lastStudied: null,
          cardCount: 0
        };
        
        decks[userId].push(newDeck);
        localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
        
        // Create cards container for this deck
        const cards = JSON.parse(localStorage.getItem(CARDS_KEY));
        if (!cards[userId]) {
          cards[userId] = {};
        }
        cards[userId][newDeck.id] = [];
        localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
        
        resolve(newDeck);
      });
    },
    
    // Update a deck
    updateDeck: function(deckId, name) {
      return new Promise((resolve, reject) => {
        if (!Auth.isLoggedIn()) {
          return reject('Not authenticated');
        }
        
        const userId = Auth.getCurrentUser().userId;
        const decks = JSON.parse(localStorage.getItem(DECKS_KEY));
        
        if (!decks[userId]) {
          return reject('No decks found');
        }
        
        const deckIndex = decks[userId].findIndex(deck => deck.id === deckId);
        if (deckIndex === -1) {
          return reject('Deck not found');
        }
        
        // Check if new name already exists in another deck
        if (decks[userId].some(deck => deck.name === name && deck.id !== deckId)) {
          return reject('A deck with this name already exists');
        }
        
        decks[userId][deckIndex].name = name;
        localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
        
        resolve(decks[userId][deckIndex]);
      });
    },
    
    // Delete a deck
    deleteDeck: function(deckId) {
      return new Promise((resolve, reject) => {
        if (!Auth.isLoggedIn()) {
          return reject('Not authenticated');
        }
        
        const userId = Auth.getCurrentUser().userId;
        const decks = JSON.parse(localStorage.getItem(DECKS_KEY));
        const cards = JSON.parse(localStorage.getItem(CARDS_KEY));
        
        if (!decks[userId]) {
          return reject('No decks found');
        }
        
        // Remove deck
        decks[userId] = decks[userId].filter(deck => deck.id !== deckId);
        localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
        
        // Remove cards for this deck
        if (cards[userId] && cards[userId][deckId]) {
          delete cards[userId][deckId];
          localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
        }
        
        resolve();
      });
    },
    
    // Get all cards for a deck
    getCards: function(deckId) {
      return new Promise((resolve, reject) => {
        if (!Auth.isLoggedIn()) {
          return reject('Not authenticated');
        }
        
        const userId = Auth.getCurrentUser().userId;
        const cards = JSON.parse(localStorage.getItem(CARDS_KEY));
        
        if (!cards[userId] || !cards[userId][deckId]) {
          resolve([]);
        } else {
          resolve(cards[userId][deckId]);
        }
      });
    },
    
    // Add a card to a deck
    addCard: function(deckId, front, back) {
      return new Promise((resolve, reject) => {
        if (!Auth.isLoggedIn()) {
          return reject('Not authenticated');
        }
        
        const userId = Auth.getCurrentUser().userId;
        const cards = JSON.parse(localStorage.getItem(CARDS_KEY));
        const decks = JSON.parse(localStorage.getItem(DECKS_KEY));
        
        // Ensure containers exist
        if (!cards[userId]) {
          cards[userId] = {};
        }
        if (!cards[userId][deckId]) {
          cards[userId][deckId] = [];
        }
        
        // Create new card
        const newCard = {
          id: Date.now().toString(),
          front,
          back,
          createdAt: new Date().toISOString(),
          lastReviewed: null,
          ease: 2.5, // Initial ease factor (for SM-2 algorithm)
          interval: 0, // Days until next review
          repetitions: 0, // Number of successful reviews in a row
          dueDate: new Date().toISOString() // Due for review immediately
        };
        
        cards[userId][deckId].push(newCard);
        localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
        
        // Update card count in deck
        const deckIndex = decks[userId].findIndex(deck => deck.id === deckId);
        if (deckIndex !== -1) {
          decks[userId][deckIndex].cardCount = (decks[userId][deckIndex].cardCount || 0) + 1;
          localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
        }
        
        resolve(newCard);
      });
    },
    
    // Update a card
    updateCard: function(deckId, cardId, front, back) {
      return new Promise((resolve, reject) => {
        if (!Auth.isLoggedIn()) {
          return reject('Not authenticated');
        }
        
        const userId = Auth.getCurrentUser().userId;
        const cards = JSON.parse(localStorage.getItem(CARDS_KEY));
        
        if (!cards[userId] || !cards[userId][deckId]) {
          return reject('Deck not found');
        }
        
        const cardIndex = cards[userId][deckId].findIndex(card => card.id === cardId);
        if (cardIndex === -1) {
          return reject('Card not found');
        }
        
        cards[userId][deckId][cardIndex].front = front;
        cards[userId][deckId][cardIndex].back = back;
        localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
        
        resolve(cards[userId][deckId][cardIndex]);
      });
    },
    
    // Delete a card
    deleteCard: function(deckId, cardId) {
      return new Promise((resolve, reject) => {
        if (!Auth.isLoggedIn()) {
          return reject('Not authenticated');
        }
        
        const userId = Auth.getCurrentUser().userId;
        const cards = JSON.parse(localStorage.getItem(CARDS_KEY));
        const decks = JSON.parse(localStorage.getItem(DECKS_KEY));
        
        if (!cards[userId] || !cards[userId][deckId]) {
          return reject('Deck not found');
        }
        
        // Remove card
        cards[userId][deckId] = cards[userId][deckId].filter(card => card.id !== cardId);
        localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
        
        // Update card count in deck
        const deckIndex = decks[userId].findIndex(deck => deck.id === deckId);
        if (deckIndex !== -1) {
          decks[userId][deckIndex].cardCount = Math.max(0, (decks[userId][deckIndex].cardCount || 0) - 1);
          localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
        }
        
        resolve();
      });
    },
    
    // Get cards due for review
    getDueCards: function(deckId) {
      return new Promise((resolve, reject) => {
        if (!Auth.isLoggedIn()) {
          return reject('Not authenticated');
        }
        
        const userId = Auth.getCurrentUser().userId;
        const cards = JSON.parse(localStorage.getItem(CARDS_KEY));
        
        if (!cards[userId] || !cards[userId][deckId]) {
          return resolve([]);
        }
        
        const now = new Date();
        const dueCards = cards[userId][deckId].filter(card => {
          if (!card.dueDate) return true;
          return new Date(card.dueDate) <= now;
        });
        
        resolve(dueCards);
      });
    },
    
    // Record review of a card (using SM-2 algorithm)
    reviewCard: function(deckId, cardId, quality) {
      return new Promise((resolve, reject) => {
        if (!Auth.isLoggedIn()) {
          return reject('Not authenticated');
        }
        
        // Quality is 1-4: 1=again, 2=hard, 3=good, 4=easy
        if (quality < 1 || quality > 4) {
          return reject('Invalid quality rating');
        }
        
        const userId = Auth.getCurrentUser().userId;
        const cards = JSON.parse(localStorage.getItem(CARDS_KEY));
        const decks = JSON.parse(localStorage.getItem(DECKS_KEY));
        const stats = JSON.parse(localStorage.getItem(STATS_KEY));
        
        if (!cards[userId] || !cards[userId][deckId]) {
          return reject('Deck not found');
        }
        
        const cardIndex = cards[userId][deckId].findIndex(card => card.id === cardId);
        if (cardIndex === -1) {
          return reject('Card not found');
        }
        
        const card = cards[userId][deckId][cardIndex];
        const now = new Date();
        const nowISO = now.toISOString();
        
        // Implement SM-2 algorithm
        const pass = quality >= 3; // 3 and 4 are passing grades
        let interval, repetitions, ease;
        
        if (pass) {
          // Successful recall
          if (card.repetitions === 0) {
            interval = 1; // 1 day
          } else if (card.repetitions === 1) {
            interval = 6; // 6 days
          } else {
            interval = Math.round(card.interval * card.ease);
          }
          repetitions = card.repetitions + 1;
        } else {
          // Failed recall
          interval = 0; // Review again today
          repetitions = 0;
        }
        
        // Adjust ease based on performance
        ease = card.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        
        // Ensure ease doesn't go below 1.3
        ease = Math.max(1.3, ease);
        
        // Calculate new due date
        const dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() + interval);
        
        // Update card
        cards[userId][deckId][cardIndex] = {
          ...card,
          lastReviewed: nowISO,
          ease,
          interval,
          repetitions,
          dueDate: dueDate.toISOString()
        };
        
        localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
        
        // Update deck's last studied timestamp
        const deckIndex = decks[userId].findIndex(deck => deck.id === deckId);
        if (deckIndex !== -1) {
          decks[userId][deckIndex].lastStudied = nowISO;
          localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
        }
        
        // Update user stats
        if (!stats[userId]) {
          stats[userId] = {
            studiedToday: 0,
            totalSessions: 0,
            lastStudied: null,
            dailyStats: [],
            retention: 0
          };
        }
        
        // Check if this is a new day
        const lastStudiedDate = stats[userId].lastStudied ? new Date(stats[userId].lastStudied) : null;
        const isNewDay = !lastStudiedDate || 
                        lastStudiedDate.getDate() !== now.getDate() ||
                        lastStudiedDate.getMonth() !== now.getMonth() ||
                        lastStudiedDate.getFullYear() !== now.getFullYear();
        
        if (isNewDay) {
          stats[userId].studiedToday = 1;
          
          // Add new daily stat
          const dailyStat = {
            date: nowISO.split('T')[0], // Just the date part
            count: 1,
            correct: pass ? 1 : 0
          };
          
          stats[userId].dailyStats.push(dailyStat);
          
          // Keep only last 30 days
          if (stats[userId].dailyStats.length > 30) {
            stats[userId].dailyStats.shift();
          }
        } else {
          stats[userId].studiedToday++;
          
          // Update today's stats
          const latestDayIndex = stats[userId].dailyStats.length - 1;
          if (latestDayIndex >= 0) {
            stats[userId].dailyStats[latestDayIndex].count++;
            if (pass) {
              stats[userId].dailyStats[latestDayIndex].correct++;
            }
          }
        }
        
        // Calculate retention rate
        let totalCards = 0;
        let totalCorrect = 0;
        
        stats[userId].dailyStats.forEach(day => {
          totalCards += day.count;
          totalCorrect += day.correct;
        });
        
        stats[userId].retention = totalCards > 0 ? Math.round((totalCorrect / totalCards) * 100) : 0;
        stats[userId].lastStudied = nowISO;
        
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
        
        resolve();
      });
    },
    
    // Get user statistics
    getStats: function() {
      return new Promise((resolve, reject) => {
        if (!Auth.isLoggedIn()) {
          return reject('Not authenticated');
        }
        
        const userId = Auth.getCurrentUser().userId;
        const stats = JSON.parse(localStorage.getItem(STATS_KEY));
        
        if (!stats[userId]) {
          stats[userId] = {
            studiedToday: 0,
            totalSessions: 0,
            lastStudied: null,
            dailyStats: [],
            retention: 0
          };
          localStorage.setItem(STATS_KEY, JSON.stringify(stats));
        }
        
        resolve(stats[userId]);
      });
    }
  };