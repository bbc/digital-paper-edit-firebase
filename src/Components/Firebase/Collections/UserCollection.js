//@ts-check
import { compress, decompressAsync } from '../../../Util/gzip';
import {
  groupWordsInParagraphsBySpeakers,
  ungroupWordsInParagraphsBySpeakers
} from '../../../Util/transcripts';
import Collection from './Collection';
import ProjectCollection from './ProjectCollection';

class UsersCollection extends Collection {
  /**
   * @param {any} firebase
   * @param {any} asyncUserProjects
   * @param {any[]} asyncUserProjectsCollection
   * @param {{ collection: any; docs?: any; }} projects
   */
  constructor(
    firebase,
    projects,
    asyncUserProjects,
    asyncUserProjectsCollection
  ) {
    super(firebase, '/users');

    if (typeof asyncUserProjects === 'undefined') {
      throw new Error('Cannot be called directly');
    }
    this.firebase = firebase;
    this.user = this.firebase.auth.currentUser;
    this.uid = this.user.uid;
    this.email = this.user.email;

    this.projects = projects.docs;
    this.projectsCollection = projects.collection;
    this.userProjects = asyncUserProjects;
    this.userProjectsCollection = asyncUserProjectsCollection;

    this.projects = [];
    this.uploads = 'uploads';
  }

  /**
   * @param {{ auth: { currentUser: any; }; }} firebase
   */
  static async build(firebase) {
    const user = firebase.auth.currentUser;
    const uid = user.uid;

    const projects = {
      collection:  new Collection(firebase, '/projects'),
    };

    projects.docs = await projects.collection.getCollection();

    const userRef = projects.collection.userRef(uid);
    const userProjects = await projects.collection.getDocs(userRef);
    const userProjectsCollection = await
    /**
     * @param {{ id: string; }} p
     */
    Promise.all(
      userProjects.map(
        async (p) => await new ProjectCollection.build(firebase, p.id)
      )
    );

    return new UsersCollection(
      firebase,
      projects,
      userProjects,
      userProjectsCollection
    );
  }

  /**
   * @param {any} item
   */
  updateUser = (item) => {
    this.putItem(this.uid, item);
  };

  updateUserProjects = () => {
    const item = {
      /**
       * @param {{ id: string; }} project
       */
      projects: this.projects.map((project) => project.id),
      email: this.email,
    };
    this.updateUser(item);
  };

  // ==================== Labels ============================= //
  /**
   * @param {string} id
   */
  getProjectLabelsCollection = (id) => {
    return this.getProjectCollection(id).labelsCollection;
  };

  /**
   * @param {string} id
   */
  getProjectLabels = (id) => {
    return this.getProjectCollection(id).labels;
  };

  /**
   * @param {string} pId
   * @param {*} label
   */
  createLabel = async (pId, label) => {
    const item = await this.getProjectLabelsCollection(
      pId
    ).postItem(label);

    label.id = item.id;
    item.update({
      id: item.id,
    });

    return label;
  };

  /**
   * @param {string} pId
   * @param {string} lId
   */
  getLabel = (pId, lId) => {
    /**
     * @param {{ id: string; }} l
     */
    return this.getProjectLabels(pId).find((l) => l.id === lId);
  };

  /**
   * @param {string} pId
   * @param {string} lId
   * @param {any} item
   */
  updateLabel = (pId, lId, item) => {
    return this.getProjectLabelsCollection(pId).putItem(lId, item);
  };

  /**
   * @param {string} pId
   * @param {string} lId
   */
  deleteLabel = (pId, lId) => {
    this.getProjectLabelsCollection(pId).deleteItem(lId);
  };

  // ================= Projects ================================ //

  /**
   * @param {string} id
   */
  getProjectCollection = (id) => {
    /**
     * @param {{ id: string; }} c
     */
    return this.userProjectsCollection.find((c) => c.id === id);
  };

  /**
   * @param {string} id
   */
  getProject = /**
   * @param {{ id: string; }} p
   */
 (id) => this.userProjects.find((p) => p.id === id);

  /**
   * @param {string} id
   * @param {any} item
   */
  updateProject = (id, item) => {
    this.putItem(id, item);
  };

  /**
   * @param {{ users: any[]; url: string; }} item
   */
  createProject = async (item) => {
    item.users = [ this.uid ];
    item.url = '';
    const docRef = await this.projectsCollection.postItem(item);
    docRef.update({
      url: `/projects/${ docRef.id }`,
    });

    const defaultLabel = {
      label: 'Default',
      color: 'yellow',
      value: 'yellow',
      description: '',
    };
    this.createLabel(docRef.id, defaultLabel);
  };

  /**
   * @param {string} id
   */
  deleteProject = (id) => {
    this.projectsCollection.deleteItem(id);
  };

  // ====================== Transcripts =========================== //
  /**
   * @param {string} id
   */
  getTranscriptsCollection = (id) => {
    return this.getProjectCollection(id).transcriptsCollection;
  }
  /**
   * @param {string} id
   */
  getProjectTranscripts = (id) => {
    return this.getProjectCollection(id).transcripts;
  };

  /**
   * @param {string} pId
   * @param {any} item
   */
  createTranscript = (pId, item) => {
    return this.getTranscriptsCollection(pId).postItem(item);
  };

  /**
   * @param {string} pId
   * @param {string} trId
   */
  getTranscriptMediaUrl = async (pId, trId) => {
    const transcript = this.getTranscript(pId, trId);
    const url = transcript.media ? await this.getDownloadURL(transcript.media.ref) : '';

    return url;
  }

  /**
   * @param {{ groupedc: any; paragraphs: any; words: any; }} transcript
   */
  isCompressed = (transcript) => {
    if (transcript.groupedc && !(transcript.paragraphs && transcript.words)) {
      return true;
    }

    return false;
  };

  /**
   * @param {string} pId
   * @param {string} trId
   */
  getTranscript = (pId, trId) => {
    /**
     * @param {{ id: string; }} tr
     */
    return this.getProjectTranscripts(pId).find(
      (tr) => tr.id === trId
    );
  }

  /**
   * @param {string} pId
   * @param {string} trId
   */
  getTranscriptWithDecompression = async (pId, trId) => {
    const transcript = this.getTranscript(pId, trId);

    return this.isCompressed(transcript)
      ? await this.decompressTranscript(transcript)
      : transcript;
  };

  /**
   * @param {{ groupedc: any; }} tr
   */
  decompressTranscript = async (tr) => {
    const compressedData = tr.groupedc;
    const decompressed = await decompressAsync(compressedData);
    const ungrouped = ungroupWordsInParagraphsBySpeakers(decompressed);

    return { ...tr, grouped: decompressed, ...ungrouped };
  };

  /**
   * @param {string} pId
   * @param {string} trId
   * @param {{ grouped: any; paragraphs: any; words: any; }} item
   */
  updateTranscript = (pId, trId, item) => {
    const newItem = { ...item };
    if (item.grouped) {
      newItem.groupedc = this.firebase.uint8ArrayBlob(compress(item.grouped));

    } else if (item.paragraphs && item.words) {
      const data = groupWordsInParagraphsBySpeakers(
        item.words,
        item.paragraphs
      );
      newItem.groupedc = this.firebase.uint8ArrayBlob(compress(data));
    }

    try {
      delete newItem.grouped;
      delete newItem.words;
      delete newItem.paragraphs;
    } finally {
      return this.getTranscriptsCollection(pId).update(trId, newItem);
    }
  };

  /**
   * @param {string} pId
   * @param {string} trId
   */
  deleteTranscript = (pId, trId) => {
    this.getTranscriptsCollection(pId).deleteItem(trId);
  };

  // ===================== Paper Edits ============================ //
  /**
   * @param {string} id
   */
  getPaperEditCollection = (id) => {
    return this.getProjectCollection(id).paperEditsCollection;
  }

  /**
   * @param {string} id
   */
  getProjectPaperEdits = (id) => {
    return this.getProjectCollection(id).paperEdits;
  };

  /**
   * @param {string} pId
   * @param {any} item
   */
  createPaperEdit = (pId, item) => {
    return this.getProjectCollection(pId).createPaperEdit(item);
  };

  /**
   * @param {string} pId
   * @param {string} peId
   */
  getPaperEdit = (pId, peId) => {
    /**
     * @param {{ id: string; }} pe
     */
    return this.getProjectPaperEdits(pId).find((pe) => pe.id === peId);
  };

  /**
   * @param {string} pId
   * @param {string} peId
   * @param {any} item
   */
  updatePaperEdit = (pId, peId, item) => {
    return this.getProjectCollection(pId).updatePaperEdit(peId, item);
  };

  /**
   * @param {string} pId
   * @param {string} peId
   */
  deletePaperEdit = (pId, peId) => {
    this.getProjectCollection(pId).deletePaperEdit(peId);
  };

  // ===================== Annotations =========================//

  /**
   * @param {string} id
   * @param {string} trId
   */
  getAnnotationsCollection = (id, trId) => {
    return this.getProjectCollection(id).getProjectTranscriptCollection(trId);
  };

  /**
   * @param {string} pId
   * @param {string} trId
   * @param {any} item
   */
  createAnnotation = (pId, trId, item) => {
    return this.getAnnotationsCollection(pId, trId).createAnnotation(item);
  };

  /**
   * @param {string} pId
   * @param {string} trId
   */
  getAnnotations = (pId, trId) => {
    return this.getAnnotationsCollection(pId, trId).annotations;
  };

  /**
   * @param {string} pId
   * @param {string} trId
   * @param {string} aId
   */
  getAnnotation = (pId, trId, aId) => {
    /**
     * @param {{ id: string; }} a
     */
    return this.getAnnotationsCollection(pId, trId).annotations.find(
      (a) => a.id === aId
    );
  };

  /**
   * @param {string} pId
   * @param {string} trId
   * @param {string} aId
   * @param {any} item
   */
  updateAnnotation = (pId, trId, aId, item) => {
    return this.getAnnotationsCollection(pId, trId).updateAnnotation(aId, item);
  };

  /**
   * @param {string} pId
   * @param {string} trId
   * @param {string} aId
   */
  deleteAnnotation = (pId, trId, aId) => {
    this.getAnnotationsCollection(pId, trId).deleteAnnotation(aId);
  };

  // ===================== Uploads ============================ //

  /**
   * @param {string} mediaRef
   */
  getDownloadURL = async (mediaRef) => {
    return await this.firebase.storage.storage.ref(mediaRef).getDownloadURL();
  };

  /**
   * @param {string} trId
   */
  getUploadPath = (trId) => {
    return `users/${ this.uid }/${ this.uploads }/${ trId }`;
  };

  /**
   * @param {string} id
   * @param {string} projectId
   * @param {any} duration
   * @param {{ name: string; }} file
   */
  asyncUploadFile = (id, projectId, duration, file) => {
    const path = this.getUploadPath(id);

    const metadata = {
      customMetadata: {
        userId: this.uid,
        id: id,
        projectId: projectId,
        originalName: file.name,
        folder: this.uploads,
        duration: duration,
      },
    };

    return this.firebase.storage.child(path).put(file, metadata);
    // uploadtask
  };
}

export default UsersCollection;