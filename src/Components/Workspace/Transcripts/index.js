import React, { useEffect, useState } from 'react';
import ItemsContainer from '../../lib/ItemsContainer';
import PropTypes from 'prop-types';
import Collection from '../../Firebase/Collection';
import { withAuthorization } from '../../Session';
import cuid from 'cuid';

const Transcripts = props => {
  const TYPE = 'Transcript';

  const Data = new Collection(
    props.firebase.db,
    `/projects/${ props.projectId }/transcripts`
  );
  const [ loading, setIsLoading ] = useState(false);
  const [ items, setItems ] = useState([]);
  const [ uid, setUid ] = useState();

  const genUrl = id => {
    return `#/projects/${ props.projectId }/transcripts/${ id }/correct`;
  };

  useEffect(() => {
    const getTranscripts = async () => {
      try {
        Data.collection.onSnapshot(snapshot => {
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
  }, [ Data, loading, props.firebase, props.projectId, uid ]);

  const updateTranscript = async (id, item) => {
    await Data.putItem(id, item);
    item.display = true;

    return item;
  };

  const asyncUploadFile = async (id, file) => {
    const path = `users/${ uid }/uploads`;
    const uploadTask = props.firebase.storage.child(`${ path }/${ id }`).put(file);

    uploadTask.on(
      'state_changed',
      snapshot => {},
      async error => {
        console.error('Failed to upload file: ', error);
        // Handle unsuccessful uploads
        await Data.put(id, { status: 'error' });
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
    const docRef = await Data.postItem(item);

    return docRef;
  };

  const handleSave = async item => {
    if (item.id) {
      return await updateTranscript(item.id, item);
    } else {
      const transcript = {
        title: item.title,
        description: item.description,
        status: '',
        projectId: props.projectId
      };

      const newTranscript = await createTranscript(transcript);

      asyncUploadFile(newTranscript.id, item.file);

      newTranscript.update({
        url: genUrl(newTranscript.id),
        status: 'in-progress'
      });

      const tr = newTranscript.get();
      tr.display = true;

      return tr;
    }
  };

  const deleteTranscript = async id => {
    try {
      await Data.deleteItem(id);
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
