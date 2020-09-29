class Collection {
  constructor(firebase, name) {
    this.firebase = firebase;
    const db = firebase.db;
    this.collectionRef = db.collection(name);
    this.firestore = firebase.firestore;
    this.name = name;
    this.snapshot = [];
  }
  getServerTimestamp = () => this.firestore.FieldValue.serverTimestamp();

  getCollection = async () => {
    return await this.getDocs(this.collectionRef);
  };

  getSubCollectionRef = (id, sub) => {
    return new Collection(this.firebase, `${ this.name }/${ id }/${ sub }`);
  };

   getSubCollection = async (id, sub) => {
     return await this.getSubCollectionRef(id, sub).getCollection();
   };

  /**
   * @param {{ get: () => any; }} collection
   */
  getDocs = async (collection) => {
    const querySnapshot = await collection.get();
    const /**
       * @param {{ data: () => any; id: string; }} doc
       */
      data = querySnapshot.docs.map((doc) => {
        return { ...doc.data(), id: doc.id, display: true };
      });

    // const sorted = data.sort((a, b) => {
    //   const updatedA = a.updated ? a.updated.seconds : 0;
    //   const updatedB = b.updated ? b.updated.seconds : 0;
    //   // b.updated.seconds - a.updated.seconds;

    //   return updatedB - updatedA;
    // });

    // const dict = sorted.reduce((dict, el) => (dict[el.id] = el, dict), {});

    return data;
  };

  getItem = async (id) => {
    const document = this.collectionRef.doc(id);
    const item = await document.get();

    return item.data();
  };

  postItem = async (data) => {
    try {
      const docRef = await this.collectionRef.add({
        ...data,
        created: this.getServerTimestamp(),
      });
      console.log('Document written with ID: ', docRef.id);

      return docRef;
    } catch (error) {
      console.error('Error adding document: ', error);
      throw error;
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
      throw error;
    }
  };

  putItem = async (id, data) => {
    try {
      await this.collectionRef.doc(id).update({
        ...data,
        updated: this.getServerTimestamp(),
      });
    } catch (error) {
      console.error('Error adding document: ', error);
      alert('Error saving document');
      throw error;
    }
  };

  deleteItem = async (id) => {
    await this.collectionRef.doc(id).delete();
  };

  userRef = (userId) =>
    this.collectionRef.where('users', 'array-contains', userId);

  user = async (userId) => await this.userRef(userId).get();

  projectRef = (projectId) =>
    this.collectionRef.where('projectId', '==', projectId);

  project = async (projectId) => await this.userRef(projectId).get();
}

export default Collection;
