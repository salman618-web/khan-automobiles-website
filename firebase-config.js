const admin = require('firebase-admin');

// Firebase configuration
let db = null;
let isInitialized = false;

// Initialize Firebase Admin SDK
function initializeFirebase() {
    try {
        // Check if Firebase is already initialized
        if (isInitialized && db) {
            console.log('🔥 Firebase already initialized');
            return db;
        }

        // Firebase config from environment variables
        const firebaseConfig = {
            type: "service_account",
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : null,
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
        };

        // Check if all required Firebase environment variables are present
        const requiredFields = ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL'];
        const missingFields = requiredFields.filter(field => !process.env[field]);
        
        if (missingFields.length > 0) {
            console.log('⚠️  Firebase environment variables missing:', missingFields);
            console.log('🔄 Falling back to JSON file storage');
            return null;
        }

        // Initialize Firebase Admin
        admin.initializeApp({
            credential: admin.credential.cert(firebaseConfig),
            projectId: process.env.FIREBASE_PROJECT_ID
        });

        db = admin.firestore();
        isInitialized = true;

        console.log('🔥 Firebase Firestore initialized successfully');
        console.log(`📋 Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
        
        return db;
    } catch (error) {
        console.error('❌ Firebase initialization error:', error.message);
        console.log('🔄 Falling back to JSON file storage');
        return null;
    }
}

// Firestore Database Operations
class FirestoreService {
    constructor() {
        this.db = initializeFirebase();
        this.collections = {
            sales: 'sales',
            purchases: 'purchases', 
            users: 'users'
        };
    }

    // Check if Firebase is available
    isAvailable() {
        return this.db !== null;
    }

    // Helper: Convert Firestore Timestamps to ISO strings for JavaScript compatibility
    convertTimestamps(obj) {
        if (!obj) return obj;
        
        const converted = { ...obj };
        Object.keys(converted).forEach(key => {
            if (converted[key] && typeof converted[key].toDate === 'function') {
                // This is a Firestore Timestamp - convert to ISO string
                converted[key] = converted[key].toDate().toISOString();
            }
        });
        return converted;
    }

    // Generic get all documents from collection
    async getAll(collection) {
        try {
            if (!this.db) throw new Error('Firestore not initialized');
            
            const snapshot = await this.db.collection(collection).orderBy('created_at', 'desc').get();
            const documents = [];
            
            snapshot.forEach(doc => {
                documents.push({
                    id: doc.id,
                    ...this.convertTimestamps(doc.data())
                });
            });
            
            console.log(`📖 Retrieved ${documents.length} documents from ${collection}`);
            return documents;
        } catch (error) {
            console.error(`❌ Error getting ${collection}:`, error.message);
            throw error;
        }
    }

    // Generic add document to collection
    async add(collection, data) {
        try {
            if (!this.db) throw new Error('Firestore not initialized');
            
            const docData = {
                ...data,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
                updated_at: admin.firestore.FieldValue.serverTimestamp()
            };
            
            const docRef = await this.db.collection(collection).add(docData);
            console.log(`📝 Added document to ${collection} with ID: ${docRef.id}`);
            
            return {
                id: docRef.id,
                ...data,
                created_at: new Date().toISOString()
            };
        } catch (error) {
            console.error(`❌ Error adding to ${collection}:`, error.message);
            throw error;
        }
    }

    // Generic update document in collection
    async update(collection, id, data) {
        try {
            if (!this.db) throw new Error('Firestore not initialized');
            
            const updateData = {
                ...data,
                updated_at: admin.firestore.FieldValue.serverTimestamp()
            };
            
            await this.db.collection(collection).doc(id).update(updateData);
            console.log(`📝 Updated document ${id} in ${collection}`);
            
            return { id, ...data };
        } catch (error) {
            console.error(`❌ Error updating ${collection}:`, error.message);
            throw error;
        }
    }

    // Generic delete document from collection
    async delete(collection, id) {
        try {
            if (!this.db) throw new Error('Firestore not initialized');
            
            await this.db.collection(collection).doc(id).delete();
            console.log(`🗑️  Deleted document ${id} from ${collection}`);
            
            return { success: true };
        } catch (error) {
            console.error(`❌ Error deleting from ${collection}:`, error.message);
            throw error;
        }
    }

    // Get document by ID
    async getById(collection, id) {
        try {
            if (!this.db) throw new Error('Firestore not initialized');
            
            const doc = await this.db.collection(collection).doc(id).get();
            if (!doc.exists) {
                throw new Error(`Document ${id} not found in ${collection}`);
            }
            
            return {
                id: doc.id,
                ...this.convertTimestamps(doc.data())
            };
        } catch (error) {
            console.error(`❌ Error getting document ${id} from ${collection}:`, error.message);
            throw error;
        }
    }

    // Specific methods for each collection
    async getSales() {
        return this.getAll(this.collections.sales);
    }

    async addSale(saleData) {
        return this.add(this.collections.sales, saleData);
    }

    async updateSale(id, saleData) {
        return this.update(this.collections.sales, id, saleData);
    }

    async deleteSale(id) {
        return this.delete(this.collections.sales, id);
    }

    async getPurchases() {
        return this.getAll(this.collections.purchases);
    }

    async addPurchase(purchaseData) {
        return this.add(this.collections.purchases, purchaseData);
    }

    async updatePurchase(id, purchaseData) {
        return this.update(this.collections.purchases, id, purchaseData);
    }

    async deletePurchase(id) {
        return this.delete(this.collections.purchases, id);
    }

    async getUsers() {
        return this.getAll(this.collections.users);
    }

    async addUser(userData) {
        return this.add(this.collections.users, userData);
    }

    async updateUser(id, userData) {
        return this.update(this.collections.users, id, userData);
    }

    // Get user by username (for login)
    async getUserByUsername(username) {
        try {
            if (!this.db) throw new Error('Firestore not initialized');
            
            const snapshot = await this.db.collection(this.collections.users)
                .where('username', '==', username)
                .limit(1)
                .get();
            
            if (snapshot.empty) {
                return null;
            }
            
            const doc = snapshot.docs[0];
            return {
                id: doc.id,
                ...this.convertTimestamps(doc.data())
            };
        } catch (error) {
            console.error('❌ Error getting user by username:', error.message);
            throw error;
        }
    }

    // Migrate data from JSON to Firestore
    async migrateData(salesData, purchasesData, usersData) {
        try {
            if (!this.db) throw new Error('Firestore not initialized');
            
            console.log('🔄 Starting data migration to Firestore...');
            
            // Migrate sales
            if (salesData && salesData.length > 0) {
                for (const sale of salesData) {
                    const { id, ...saleData } = sale; // Remove ID, Firestore will generate new ones
                    await this.addSale(saleData);
                }
                console.log(`✅ Migrated ${salesData.length} sales records`);
            }
            
            // Migrate purchases
            if (purchasesData && purchasesData.length > 0) {
                for (const purchase of purchasesData) {
                    const { id, ...purchaseData } = purchase; // Remove ID, Firestore will generate new ones
                    await this.addPurchase(purchaseData);
                }
                console.log(`✅ Migrated ${purchasesData.length} purchase records`);
            }
            
            // Migrate users
            if (usersData && usersData.length > 0) {
                for (const user of usersData) {
                    const { id, ...userData } = user; // Remove ID, Firestore will generate new ones
                    await this.addUser(userData);
                }
                console.log(`✅ Migrated ${usersData.length} user records`);
            }
            
            console.log('🎉 Data migration completed successfully!');
            return true;
        } catch (error) {
            console.error('❌ Data migration failed:', error.message);
            throw error;
        }
    }
}

module.exports = new FirestoreService(); 