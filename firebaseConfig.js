// firebaseConfig.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 1. Tempel config dari Firebase Console di sini
const firebaseConfig = {
    apiKey: "AIzaSyD5S0NA3Aa2mdp1bF7gpCSaB5s676ORXw8",
    authDomain: "campusapp-e72a2.firebaseapp.com",
    projectId: "campusapp-e72a2",
    storageBucket: "campusapp-e72a2.firebasestorage.app",
    messagingSenderId: "819459927654",
    appId: "1:819459927654:web:3d6a0f7fff20d9b2bec7a7",
    measurementId: "G-63T3MW2BG0"
};

// 2. Initialize Firebase
const app = initializeApp(firebaseConfig);

// 3. Initialize Auth dengan persistensi AsyncStorage
// Ini kuncinya: Login akan tetap tersimpan meski aplikasi ditutup
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

// 4. Initialize Firestore
const db = getFirestore(app);

export { auth, db };
