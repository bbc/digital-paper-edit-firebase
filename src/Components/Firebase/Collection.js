class Collection {
  constructor(firebase, name) {
    const db = firebase.db;
    this.collectionRef = db.collection(name);
    this.firestore = firebase.firestore;
    this.name = name;
    this.snapshot = [];
  }
  getServerTimestamp = () => this.firestore.FieldValue.serverTimestamp();

  getCollection = async () => {
    const querySnapshot = await this.collectionRef.get();
    const docs = querySnapshot.docs;

    return docs.map(doc => {
      const data = doc.data();
      data.id = doc.id;

      return data;
    });
  };

  getItem = async id => {
    const document = this.collectionRef.doc(id);
    const item = await document.get();

    return item.data();
  };

  postItem = async data => {
    try {
      const docRef = await this.collectionRef.add({
        ...data,
        created: this.getServerTimestamp()
      });
      console.log('Document written with ID: ', docRef.id);

      return docRef;
    } catch (error) {
      console.error('Error adding document: ', error);
    }
  };

  setItem = async (id, data) => {
    try {
      await this.collectionRef
        .doc(id)
        .set({ ...data, created: this.getServerTimestamp() });
      console.log('Document written with ID: ', id);
    } catch (error) {
      console.error('Error adding document: ', error);
    }
  };

  putItem = async (id, data) => {
    try {
      await this.collectionRef.doc(id).update({
        ...data,
        updated: this.getServerTimestamp()
      });
    } catch (error) {
      console.error('Error adding document: ', error);
      alert('Error saving document');
    }
  };

  deleteItem = async id => {
    await this.collectionRef.doc(id).delete();
  };

  userRef = userId =>
    this.collectionRef.where('users', 'array-contains', userId);
  user = async userId => await this.userRef(userId).get();

  projectRef = projectId =>
    this.collectionRef.where('projectId', '==', projectId);
  project = async projectId => await this.userRef(projectId).get();
}

export default Collection;
