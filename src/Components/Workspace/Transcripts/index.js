import React, { useEffect, useState } from 'react';
import ItemsContainer from '../../lib/ItemsContainer';
import PropTypes from 'prop-types';
import Collection from '../../Firebase/Collection';
import { withAuthorization } from '../../Session';

const Transcripts = ({ projectId, firebase }) => {
  const TYPE = 'Transcript';
  const UPLOADFOLDER = 'uploads';

  const [ loading, setIsLoading ] = useState(false);
  const [ items, setItems ] = useState([]);
  const [ uid, setUid ] = useState();

  const [ uploadTasks, setUploadTasks ] = useState(new Map());

  const TranscriptsCollection = new Collection(
    firebase,
    `/projects/${ projectId }/transcripts`
  );

  const genUrl = (id) => {
    return `/projects/${ projectId }/transcripts/${ id }/correct`;
  };

  useEffect(() => {
    const getTranscripts = async () => {
      try {
        TranscriptsCollection.collectionRef.onSnapshot((snapshot) => {
          const transcripts = snapshot.docs.map((doc) => {
            return { ...doc.data(), id: doc.id, display: true };
          });
          setItems(transcripts);
        });
      } catch (error) {
        console.error('Error getting documents: ', error);
      }
    };

    const authListener = firebase.onAuthUserListener(
      (authUser) => {
        if (authUser) {
          setUid(authUser.uid);
        }
      },
      () => setUid()
    );

    if (!loading) {
      getTranscripts();
      setIsLoading(true);
    }

    return () => {
      authListener();
    };
  }, [
    TranscriptsCollection.collectionRef,
    items,
    loading,
    firebase,
    uploadTasks,
  ]);

  // firestore

  const updateTranscript = async (id, item) => {
    await TranscriptsCollection.putItem(id, item);
  };

  const createTranscript = async (item) => {
    const docRef = await TranscriptsCollection.postItem(item);

    return docRef;
  };

  const deleteTranscript = async (id) => {
    try {
      await TranscriptsCollection.deleteItem(id);
    } catch (e) {
      console.error('Failed to delete item from collection: ', e.code_);
    }
    try {
      await firebase.storage.child(`users/${ uid }/uploads/${ id }`).delete();
      await firebase.storage.child(`users/${ uid }/audio/${ id }`).delete();
    } catch (e) {
      console.error('Failed to delete item in storage: ', e.code_);
    }
  };

  const handleDelete = (id) => {
    deleteTranscript(id);
  };

  // storage

  const updateUploadTasksProgress = (id, progress) => {
    const newUploading = new Map(uploadTasks); // shallow clone
    newUploading.set(id, progress);

    setUploadTasks(newUploading);
  };

  const handleUploadProgress = (id, snapshot) => {
    const progress = Math.floor(
      (snapshot.bytesTransferred / snapshot.totalBytes) * 100
    );
    updateUploadTasksProgress(id, progress);
  };

  const handleUploadError = (id, error) => {
    console.error('Failed to upload file: ', error);
    const newTasks = new Map(uploadTasks); // shallow clone
    newTasks.delete(id);
    setUploadTasks(newTasks);

    updateTranscript(id, { status: 'error' });
  };

  const handleUploadComplete = (id) => {
    console.log('File upload completed');
    const newTasks = new Map(uploadTasks); // shallow clone
    newTasks.delete(id);
    setUploadTasks(newTasks);

    updateTranscript(id, { status: 'in-progress' });
  };

  const getUploadPath = (id) => {
    return `users/${ uid }/${ UPLOADFOLDER }/${ id }`;
  };

  const asyncUploadFile = async (id, file) => {
    const path = getUploadPath(id);
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const duration = video.duration;

      const metadata = {
        customMetadata: {
          userId: uid,
          id: id,
          projectId: projectId,
          originalName: file.name,
          folder: UPLOADFOLDER,
          duration: duration,
        },
      };

      const uploadTask = firebase.storage.child(path).put(file, metadata);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          handleUploadProgress(id, snapshot);
        },
        (error) => {
          handleUploadError(id, error);
        },
        () => {
          handleUploadComplete(id);
        }
      );
    };
    video.src = URL.createObjectURL(file);
  };

  // general

  const handleSave = async (item) => {
    if (item.id) {
      updateTranscript(item.id, item);
    } else {
      const newTranscript = await createTranscript({
        title: item.title,
        description: item.description ? item.description : '',
        status: 'uploading',
        projectId: projectId,
      });

      asyncUploadFile(newTranscript.id, item.file);

      newTranscript.update({
        url: genUrl(newTranscript.id),
      });
    }
  };

  return (
    <ItemsContainer
      type={ TYPE }
      items={ items }
      handleSave={ handleSave }
      handleDelete={ handleDelete }
      uploadTasks={ uploadTasks }
    />
  );
};

Transcripts.propTypes = {
  projectId: PropTypes.any,
  firebase: PropTypes.any,
};

// const condition = (authUser) => !!authUser;
const condition = (oidc, authUser) => !!(oidc && authUser);
export default withAuthorization(condition)(Transcripts);
