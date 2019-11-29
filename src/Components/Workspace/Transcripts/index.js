import React, { useEffect, useState } from 'react';
import ItemsContainer from '../../lib/ItemsContainer';
import PropTypes from 'prop-types';
import Collection from '../../Firebase/Collection';
import { withAuthorization } from '../../Session';
import cuid from 'cuid';

const Transcripts = props => {
  const TRANSCRIPTS = '/transcripts';
  const TYPE = 'Transcript';

  const collection = new Collection(props.firebase.db, TRANSCRIPTS);
  const [ loading, setIsLoading ] = useState(false);
  const [ items, setItems ] = useState([]);
  const [ uid, setUid ] = useState();

  const genUrl = id => {
    return `#/projects/${ props.projectId }/transcripts/${ id }/correct`;
  };

  useEffect(() => {
    const getTranscripts = async () => {
      try {
        collection.projectRef(props.projectId).onSnapshot(snapshot => {
          const transcripts = snapshot.docs.map(doc => {
            return { ...doc.data(), id: doc.id, display: true };
          });

          setItems(transcripts);
        });
      } catch (error) {
        console.log('Error getting documents: ', error);
      }
    };

    const authListener = props.firebase.onAuthUserListener(
      authUser => {
        if (authUser) {
          setUid(authUser.uid);
        }
      },
      () => {
        setUid();
      }
    );

    if (!loading) {
      getTranscripts();
      setIsLoading(true);
    }

    return () => {
      authListener();
    };
  }, [ collection, loading, props.firebase, props.projectId, uid ]);

  const updateTranscript = async (id, item) => {
    await collection.putItem(id, item);
    item.display = true;

    return item;
  };

  const uploadFile = async file => {
    const id = cuid();
    const path = `users/${ uid }/uploads`;
    const uploadTask = props.firebase.storage.child(`${ path }/${ id }`).put(file);

    uploadTask.on(
      'state_changed',
      snapshot => {},
      async error => {
        console.error('Failed to upload file: ', error);
        // Handle unsuccessful uploads
        await collection.put(id, { status: 'error' });
      },
      async () => {
        // Handle successful uploads on complete
        // For instance, get the download URL: https://firebasestorage.googleapis.com/...
        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
        console.log('File available at', downloadURL);
      }
    );
  };

  const createTranscript = async item => {
    const transcript = item;
    transcript.projectId = props.projectId;

    if (transcript.file) {
      uploadFile(transcript.file);
      delete transcript.file;
    }

    const docRef = await collection.postItem(transcript);
    transcript.url = genUrl(docRef.id);
    transcript.status = 'in-progress';

    docRef.update({
      url: transcript.url,
      status: transcript.status
    });

    transcript.display = true;

    return transcript;
  };

  const handleSave = async item => {
    if (item.id) {
      return await updateTranscript(item.id, item);
    } else {
      return await createTranscript(item);
    }
  };

  const deleteTranscript = async id => {
    try {
      await collection.deleteItem(id);
    } catch (e) {
      console.log(e);
    }
  };

  const handleDelete = id => {
    deleteTranscript(id);
  };

  return (
    <ItemsContainer
      type={ TYPE }
      items={ items }
      handleSave={ handleSave }
      handleDelete={ handleDelete }
    />
  );
};

Transcripts.propTypes = {
  projectId: PropTypes.any
};

const condition = authUser => !!authUser;
export default withAuthorization(condition)(Transcripts);
