//@ts-check
import Collection from './Collection';
import TranscriptCollection from './TranscriptCollection';

class ProjectCollection extends Collection {
  /**
   * @param {any} firebase
   * @param {string} id
   * @param {{ transcripts: any; pTranscriptsCollection: any; paperEdits: any; labels: any; }} asyncBuild
   */
  constructor(firebase, id, asyncBuild) {
    super(firebase, '/projects');

    if (typeof asyncBuild === 'undefined') {
      throw new Error('Cannot be called directly');
    }

    this.id = id;
    this.firebase = firebase;
    this.user = this.firebase.auth.currentUser;
    this.uid = this.user.uid;
    this.email = this.user.email;

    this.projectsTranscriptsCollection = asyncBuild.pTranscriptsCollection;

    this.transcripts = asyncBuild.transcripts.docs;
    this.transcriptsCollection = asyncBuild.transcripts.collection;
    this.labels = asyncBuild.labels.docs;
    this.labelsCollection = asyncBuild.labels.collection;
    this.paperEdits = asyncBuild.paperEdits.docs;
    this.paperEditsCollection = asyncBuild.paperEdits.collection;
  }

  /**
   * @param {any} firebase
   * @param {string} id
   */
  static async build(firebase, id) {
    const projectCollection = new Collection(firebase, 'projects');
    const [ transcripts, paperEdits, labels ] = await Promise.all(
      [ 'transcripts', 'paperedits', 'labels' ].map(async (sub) => {
        const subCollection = projectCollection.getSubCollectionRef(id, sub);

        return {
          docs: await subCollection.getCollection(),
          collection: subCollection
        };
      })
    );

    const pTranscriptsCollection = await
    /**
       * @param {{ id: string; }} tr
       */
    Promise.all(
      transcripts.docs.map(
        async (tr) => await new TranscriptCollection.build(firebase, id, tr.id)
      )
    );

    return new ProjectCollection(firebase, id, {
      transcripts,
      pTranscriptsCollection,
      paperEdits,
      labels,
    });
  }

  //=================== transcript =================//

  /**
   * @param {string} trId
   * @param {any} item
   */
  updateTranscript = (trId, item) => {
    return this.transcriptsCollection.putItem(trId, item);
  };

  /**
   * @param {any} item
   */
  createTranscript = (item) => {
    return this.transcriptsCollection.postItem(item);
  };

  /**
   * @param {string} trId
   */
  deleteTranscript = async (trId) => {
    try {
      await this.transcriptsCollection.deleteItem(trId);
    } catch (e) {
      console.error('Failed to delete item from collection: ', e.code_);
    }
    try {
      await this.firebase.storage
        .child(`users/${ this.uid }/uploads/${ trId }`)
        .delete();
      await this.firebase.storage
        .child(`users/${ this.uid }/audio/${ trId }`)
        .delete();
    } catch (e) {
      console.error('Failed to delete item in storage: ', e.code_);
    }
  };

  //=================== annotations =================//

  /**
   * @param {string} trId
   */
  getProjectTranscriptCollection = (trId) => {
    /**
     * @param {{ id: string; }} c
     */

    return this.projectsTranscriptsCollection.find((c) => c.id === trId);
  };
}

export default ProjectCollection;