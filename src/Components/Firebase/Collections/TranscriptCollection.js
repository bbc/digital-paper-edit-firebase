//@ts-check
import Collection from './Collection';

class TranscriptCollection extends Collection {
  /**
   * @param {any} firebase
   * @param {string} projectId
   * @param {string} id
   * @param {any} asyncBuild
   */
  constructor(firebase, projectId, id, asyncBuild) {
    super(firebase, `/projects/${ projectId }/transcripts`);

    if (typeof asyncBuild === 'undefined') {
      throw new Error('Cannot be called directly');
    }

    this.id = id;
    this.projectId = projectId;
    this.firebase = firebase;
    this.user = this.firebase.auth.currentUser;
    this.uid = this.user.uid;
    this.email = this.user.email;

    this.annotations = asyncBuild.docs;
    this.annotationsCollection = asyncBuild.collection;
  }

  /**
   * @param {any} firebase
   * @param {string} projectId
   * @param {string} id
   */
  static async build(firebase, projectId, id) {
    const annotationsCollection = new Collection(
      firebase,
      `/projects/${ projectId }/transcripts/${ id }/annotations`
    );

    const annotations = {
      collection: annotationsCollection,
      docs: await annotationsCollection.getCollection()
    };

    return new TranscriptCollection(firebase, projectId, id, annotations);
  }

  /**
   * @param {string} trId
   * @param {any} item
   */
  updateAnnotation = (trId, item) => {
    return this.annotationsCollection.putItem(trId, item);
  };

  /**
   * @param {any} item
   */
  createAnnotation = (item) => {
    return this.annotationsCollection.postItem(item);
  };

  /**
   * @param {string} trId
   */
  deleteAnnotation = (trId) => {
    this.annotationsCollection.deleteItem(trId);
  };
}

export default TranscriptCollection;