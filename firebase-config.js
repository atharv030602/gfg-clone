// Firebase Configuration
// Replace with your actual Firebase config when you create a Firebase project
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id"
};

// Initialize Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore Database
export const db = getFirestore(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Firebase Helper Functions
export const firebaseHelpers = {
    // Contact Messages
    async saveContactMessage(messageData) {
        try {
            const docRef = await addDoc(collection(db, 'contactMessages'), {
                ...messageData,
                timestamp: serverTimestamp(),
                status: 'unread'
            });
            console.log('Contact message saved with ID: ', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Error saving contact message: ', error);
            throw error;
        }
    },

    async getContactMessages() {
        try {
            const q = query(collection(db, 'contactMessages'), orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(q);
            const messages = [];
            querySnapshot.forEach((doc) => {
                messages.push({ id: doc.id, ...doc.data() });
            });
            return messages;
        } catch (error) {
            console.error('Error getting contact messages: ', error);
            throw error;
        }
    },

    // Newsletter Subscribers
    async saveNewsletterSubscriber(email) {
        try {
            const docRef = await addDoc(collection(db, 'newsletterSubscribers'), {
                email: email,
                timestamp: serverTimestamp(),
                status: 'active'
            });
            console.log('Newsletter subscriber saved with ID: ', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Error saving newsletter subscriber: ', error);
            throw error;
        }
    },

    async getNewsletterSubscribers() {
        try {
            const q = query(collection(db, 'newsletterSubscribers'), orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(q);
            const subscribers = [];
            querySnapshot.forEach((doc) => {
                subscribers.push({ id: doc.id, ...doc.data() });
            });
            return subscribers;
        } catch (error) {
            console.error('Error getting newsletter subscribers: ', error);
            throw error;
        }
    },

    // Forum Posts
    async saveForumPost(postData) {
        try {
            const docRef = await addDoc(collection(db, 'forumPosts'), {
                ...postData,
                timestamp: serverTimestamp(),
                likes: 0,
                replies: 0,
                views: 0
            });
            console.log('Forum post saved with ID: ', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Error saving forum post: ', error);
            throw error;
        }
    },

    async getForumPosts() {
        try {
            const q = query(collection(db, 'forumPosts'), orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(q);
            const posts = [];
            querySnapshot.forEach((doc) => {
                posts.push({ id: doc.id, ...doc.data() });
            });
            return posts;
        } catch (error) {
            console.error('Error getting forum posts: ', error);
            throw error;
        }
    },

    // User Authentication
    async signUp(email, password, displayName) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Save user profile to Firestore
            await addDoc(collection(db, 'users'), {
                uid: user.uid,
                email: email,
                displayName: displayName,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                progress: {
                    articlesRead: 0,
                    problemsSolved: 0,
                    streak: 0
                }
            });
            
            return user;
        } catch (error) {
            console.error('Error creating user: ', error);
            throw error;
        }
    },

    async signIn(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (error) {
            console.error('Error signing in: ', error);
            throw error;
        }
    },

    async signOut() {
        try {
            await signOut(auth);
            console.log('User signed out successfully');
        } catch (error) {
            console.error('Error signing out: ', error);
            throw error;
        }
    },

    // Monitor auth state changes
    onAuthStateChange(callback) {
        return onAuthStateChanged(auth, callback);
    }
};

// Fallback for when Firebase is not available (development/offline)
export const fallbackToLocalStorage = {
    saveContactMessage(data) {
        const messages = JSON.parse(localStorage.getItem('contactMessages')) || [];
        messages.push({
            ...data,
            id: Date.now(),
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('contactMessages', JSON.stringify(messages));
        return Promise.resolve(Date.now().toString());
    },

    saveNewsletterSubscriber(email) {
        const subscribers = JSON.parse(localStorage.getItem('newsletterSubscribers')) || [];
        if (!subscribers.find(sub => sub.email === email)) {
            subscribers.push({
                email: email,
                timestamp: new Date().toISOString(),
                status: 'active'
            });
            localStorage.setItem('newsletterSubscribers', JSON.stringify(subscribers));
            return Promise.resolve(Date.now().toString());
        } else {
            return Promise.reject(new Error('Email already subscribed'));
        }
    }
};

// Check if Firebase is properly configured
export const isFirebaseConfigured = () => {
    return firebaseConfig.apiKey !== "your-api-key-here";
};

console.log('Firebase configuration loaded');