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
    const firestore = app.firestore();
    this.db = firestore.collection('apps').doc('digital-paper-edit');
    this.storage = app.storage().ref('apps/digital-paper-edit/users');
  }

  dbUsersRef = () => this.db.collection('users');
  dbUserRef = uid => this.dbUsersRef().doc(`${ uid }`);

  user = async uid => await this.dbUserRef(uid).get();
  users = async () => await this.dbUsersRef().get();

  // *** Merge Auth and DB User API *** //

  onAuthUserListener = (next, fallback) =>
    this.auth.onAuthStateChanged(async authUser => {
      if (authUser) {
        const dbdbUserRef = this.dbUserRef(authUser.uid);
        const dbSnapshot = await dbdbUserRef.get();
        const dbUser = dbSnapshot.data();

        if (!dbSnapshot.exists || !dbUser) {
          dbdbUserRef.set({
            projects: [],
            roles: {}
          });
        }

        // merge auth and db user
        const mergeUser = {
          uid: authUser.uid,
          email: authUser.email,
          emailVerified: authUser.emailVerified,
          providerData: authUser.providerData,
          ...dbUser
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
