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
    this.auth = app.auth();

    this.firestore = app.firestore;
    this.db = this.firestore()
      .collection('apps')
      .doc('digital-paper-edit');
    this.storage = app.storage().ref('apps/digital-paper-edit');
  }

  // *** Merge Auth and DB User API *** //
  initDB = async uid => {
    const dbUserRef = this.db.collection('users').doc(uid);
    const dbSnapshot = await dbUserRef.get();
    const dbUser = dbSnapshot.data();

    if (!dbSnapshot.exists || !dbUser) {
      dbUserRef.set({
        projects: [],
        role: 'USER',
        created: this.getServerTimestamp()
      });

      // also create collection for uploads in the next steps ticket (#5)
    }

    return dbUser;
  };

  onAuthUserListener = (next, fallback) =>
    this.auth.onAuthStateChanged(async authUser => {
      if (authUser) {
        const db = await this.initDB(authUser.uid);

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
}

export default Firebase;
