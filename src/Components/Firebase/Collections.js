import Collection from './Collection';

const getDocs = async (pc) => {
  const projects = await pc.get();
  const data = projects.docs.map((doc) => {
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

const getProjectSubCollections = async (firebase, id, c) => {
  const collection = new Collection(firebase, `/projects/${ id }/${ c }`);

  return await getDocs(collection.collectionRef);
};

class ProjectCollection extends Collection {
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

    this.transcripts = asyncBuild.transcripts;
    this.transcriptsCollection = new Collection(
      firebase,
      `/projects/${ id }/transcripts`
    );
    this.labels = asyncBuild.labels;
    this.labelsCollection = new Collection(firebase, `/projects/${ id }/labels`);
    this.paperEdits = asyncBuild.paperEdits;
    this.paperEditsCollection = new Collection(
      firebase,
      `/projects/${ id }/paperedits`
    );
    this.uploads = 'uploads';
  }

  static async build(firebase, id) {
    const [ transcripts, paperEdits, labels ] = await Promise.all(
      [ 'transcripts', 'paperedits', 'labels' ].map(
        async (c) => await getProjectSubCollections(firebase, id, c)
      )
    );

    return new ProjectCollection(firebase, id, {
      transcripts,
      paperEdits,
      labels,
    });
  }

  updateTranscript = (trId, item) => {
    return this.transcriptsCollection.putItem(trId, item);
  };

  createTranscript = (item) => {
    return this.transcriptsCollection.postItem(item);
  }

  deleteTranscript = async (trId) => {
    try {
      await this.transcriptsCollection.deleteItem(trId);
    } catch (e) {
      console.error('Failed to delete item from collection: ', e.code_);
    }
    try {
      await this.firebase.storage.child(`users/${ this.uid }/uploads/${ trId }`).delete();
      await this.firebase.storage.child(`users/${ this.uid }/audio/${ trId }`).delete();
    } catch (e) {
      console.error('Failed to delete item in storage: ', e.code_);
    }

  }
}
class UsersCollection extends Collection {
  constructor(
    firebase,
    projectsCollection,
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

    this.projectsCollection = projectsCollection;
    this.userProjects = asyncUserProjects;
    this.userProjectsCollection = asyncUserProjectsCollection;
  }

  static async build(firebase) {
    const user = firebase.auth.currentUser;
    const uid = user.uid;

    const projectsCollection = new Collection(firebase, '/projects');
    const userProjects = await getDocs(projectsCollection.userRef(uid));
    const userProjectsCollection = await Promise.all(
      userProjects.map(
        async (p) => await new ProjectCollection.build(firebase, p.id)
      )
    );

    return new UsersCollection(
      firebase,
      projectsCollection,
      userProjects,
      userProjectsCollection
    );
  }

  updateUser = (item) => {
    this.putItem(this.uid, item);
  };

  updateUserProjects = () => {
    const item = {
      projects: this.projects.map((project) => project.id),
      email: this.email,
    };
    this.updateUser(item);
  };

  // ==================== Labels ============================= //
  getProjectLabelsCollection = (id) => {
    return this.getProjectCollection(id).labelsCollection;
  };
  getProjectLabels = (id) => {
    return this.getProjectCollection(id).labels;
  };

  createLabel = async (projectId, label) => {
    const labelDocRef = await this.getProjectLabelsCollection(
      projectId
    ).postItem(label);

    labelDocRef.update({
      id: labelDocRef.id,
    });
  };

  // ================= Projects ================================ //

  getProjectCollection = (id) => {
    return this.userProjectsCollection.find((c) => c.id === id);
  };

  getProject = (id) => this.userProjects.find((p) => p.id === id);

  updateProject = (id, item) => {
    this.putItem(id, item);
  };

  createProject = async (item) => {
    item.users = [ this.uid ];
    item.url = '';
    console.log(this.projectsCollection);
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

  deleteProject = async (id) => {
    try {
      await this.projectsCollection.deleteItem(id);
    } catch (e) {
      console.error(e);
    }
  };

  // ====================== Transcripts =========================== //
  getProjectTranscripts = (id) => {
    return this.getProjectCollection(id).transcripts;
  };

  createTranscript = (pId, item) => {
    console.log(this.getProjectCollection(pId), pId);

    return this.getProjectCollection(pId).createTranscript(item);
  };

  getTranscript = (pId, trId) => {};

  updateTranscript = (pId, trId, item) => {
    return this.getProjectCollection(pId).updateTranscript(trId, item);
  };

  deleteTranscript = (pId, trId) => {
    this.getProjectCollection(pId).deleteTranscript(trId);
  };

  // ===================== Paper Edits ============================ //
  getProjectPaperEdits = (id) => {
    return this.getProjectCollection(id).paperEdits;
  };

  createPaperEdit = (pId, peId) => {};

  getPaperEdit = (pId, peId) => {};

  updatePaperEdit = (pId, peId) => {};

  deletePaperEdit = (pId, peId) => {};
  // ===================== Uploads ============================ //

   getUploadPath = (trId) => {
     return `users/${ this.uid }/${ this.uploads }/${ trId }`;
   };

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

export { UsersCollection };
