const admin = require('firebase-admin');
require('dotenv').config();

let db = null;
let isInitialized = false;

const initializeFirebase = () => {
  if (isInitialized) return db;

  try {
    // Initialize Firebase Admin with environment variables
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    // Check if required environment variables are present
    if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
      throw new Error('Missing Firebase environment variables. Please check your .env file.');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    db = admin.firestore();
    isInitialized = true;
    
    console.log('✅ Firebase initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    throw error;
  }
};

// Firebase database operations
const firebaseOperations = {
  // Save vehicle data to Firestore
  async saveVehicleData(vehicleData) {
    try {
      const db = initializeFirebase();
      const docRef = db.collection('car_positions').doc(vehicleData.rkey);
      
      const dataToSave = {
        ...vehicleData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await docRef.set(dataToSave, { merge: true });
      console.log('✅ Vehicle data saved to Firebase:', vehicleData.rkey);
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving to Firebase:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all vehicle data from Firestore
  async getAllVehicles() {
    try {
      const db = initializeFirebase();
      const snapshot = await db.collection('car_positions').get();
      
      const vehicles = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        // Convert Firestore timestamp to string if needed
        if (data.updatedAt && data.updatedAt.toDate) {
          data.updatedAt = data.updatedAt.toDate().toISOString();
        }
        if (data.createdAt && data.createdAt.toDate) {
          data.createdAt = data.createdAt.toDate().toISOString();
        }
        vehicles.push({ id: doc.id, ...data });
      });

      console.log(`✅ Retrieved ${vehicles.length} vehicles from Firebase`);
      return vehicles;
    } catch (error) {
      console.error('❌ Error getting vehicles from Firebase:', error);
      return [];
    }
  },

  // Get specific vehicle by rkey
  async getVehicleByRkey(rkey) {
    try {
      const db = initializeFirebase();
      const doc = await db.collection('car_positions').doc(rkey).get();
      
      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      // Convert Firestore timestamp to string if needed
      if (data.updatedAt && data.updatedAt.toDate) {
        data.updatedAt = data.updatedAt.toDate().toISOString();
      }
      
      return { id: doc.id, ...data };
    } catch (error) {
      console.error('❌ Error getting vehicle from Firebase:', error);
      return null;
    }
  }
};

module.exports = {
  admin,
  db: () => initializeFirebase(),
  firebaseOperations,
  initializeFirebase
}; 