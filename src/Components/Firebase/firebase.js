import app from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';

const config = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID
};
class Firebase {
  constructor() {
    app.initializeApp(config);

    this.firestore = app.firestore;
    this.auth = app.auth();
    this.db = app.firestore();
    if (location.hostname === 'localhost') {
      this.db.useEmulator('localhost', 8080);
    } else {
      this.db = this.db
        .collection('apps')
        .doc('digital-paper-edit');
    }
    this.storage = app.storage().ref();
    this.getServerTimestamp = () => this.firestore.FieldValue.serverTimestamp();
  }

  // *** Merge Auth and DB User API *** //
  initDB = async (uid, email) => {
    const dbUserRef = this.db.collection('users').doc(uid);
    const dbSnapshot = await dbUserRef.get();
    const dbUser = dbSnapshot.data();

    if (!dbSnapshot.exists || !dbUser) {
      dbUserRef.set({
        projects: [],
        role: 'USER',
        created: this.getServerTimestamp(),
        email: email
      });

      // https://firebase.google.com/docs/firestore/data-model
      // Docs / Collections are automatically created if not existing
    }

    return dbUser;
  };

  onAuthUserListener = (next, fallback) =>
    this.auth.onAuthStateChanged(async authUser => {
      if (authUser) {
        const db = await this.initDB(authUser.uid, authUser.email);

        const mergeUser = {
          uid: authUser.uid,
          email: authUser.email,
          emailVerified: authUser.emailVerified,
          providerData: authUser.providerData,
          ...db
        };

        next(mergeUser);
      } else {
        fallback();
      }
    });

  // doCreateUserWithEmailAndPassword = (email, password) =>
  // this.auth.createUserWithEmailAndPassword(email, password);
  doSignInWithEmailAndPassword = (email, password) =>
    this.auth.signInWithEmailAndPassword(email, password);
  doSignOut = () => this.auth.signOut();
  doPasswordReset = email => this.auth.sendPasswordResetEmail(email);
  doPasswordUpdate = password => this.auth.currentUser.updatePassword(password);
  doCreateUserWithEmailAndPassword = (email, password) => this.auth.createUserWithEmailAndPassword(email, password)

  uint8ArrayBlob = (data) => this.firestore.Blob.fromUint8Array(data);
  base64StringBlob = (data) => this.firestore.Blob.fromBase64String(data);
}

export default Firebase;
