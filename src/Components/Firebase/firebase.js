import app from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';
import 'firebase-admin';

const config = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  oidc: process.env.REACT_APP_OIDC
};
class Firebase {
  constructor() {
    this.provider = new app.auth.OAuthProvider(config.oidc);
    app.initializeApp(config);
    this.auth = app.auth();

    this.firestore = app.firestore;
    this.db = this.firestore()
      .collection('apps')
      .doc('digital-paper-edit');
    this.storage = app.storage().ref();
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

      // https://firebase.google.com/docs/firestore/data-model
      // Docs / Collections are automatically created if not existing
    }

    return dbUser;
  };

  onOIDCAuthListener = async (next, fallback) => {
    try {
      console.log('called oidc', this.provider);

      const result = await this.auth.signInWithPopup(this.provider);
      console.log('result odic', result);
      next(result);
    } catch (err) {
      console.error(err);
      console.error('you could not log in with OIDC', this.provider);
      fallback(err);
    }
  }

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

  uint8ArrayBlob = (data) => this.firestore.Blob.fromUint8Array(data);
  base64StringBlob = (data) => this.firestore.Blob.fromBase64String(data);
}

export default Firebase;
