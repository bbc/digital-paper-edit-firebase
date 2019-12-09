import React, { useEffect, useState } from 'react';
import ItemsContainer from '../../lib/ItemsContainer';
import PropTypes from 'prop-types';
import Collection from '../../Firebase/Collection';
import { withAuthorization } from '../../Session';

const Transcripts = props => {
  const [ loading, setIsLoading ] = useState(false);
  const [ items, setItems ] = useState([]);
  const [ uid, setUid ] = useState();
  const TYPE = 'Transcript';
  const UPLOADFOLDER = 'uploads';

  const Data = new Collection(
    props.firebase,
    `/projects/${ props.projectId }/transcripts`
  );

  const genUrl = id => {
    return `/projects/${ props.projectId }/transcripts/${ id }/correct`;
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
        console.error('Error getting documents: ', error);
      }
    };

    const authListener = props.firebase.onAuthUserListener(
      authUser => {
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
  }, [ Data.collection, loading, props.firebase ]);

  const updateTranscript = async (id, item) => {
    await Data.putItem(id, item);
    item.display = true;

    return item;
  };

  const getUploadPath = id => {
    return `users/${ uid }/${ UPLOADFOLDER }/${ id }`;
  };

  const asyncUploadFile = async (id, file) => {
    const path = getUploadPath(id);

    const metadata = {
      customMetadata: {
        userId: uid,
        id: id,
        originalName: file.name,
        folder: UPLOADFOLDER
      }
    };
    const uploadTask = props.firebase.storage.child(path).put(file, metadata);
    await updateTranscript(id, { status: 'uploading' });

    uploadTask.on(
      'state_changed',
      snapshot => {
        var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(progress);
      },
      async error => {
        console.error('Failed to upload file: ', error);
        // Handle unsuccessful uploads
        await updateTranscript(id, { status: 'error' });
      },
      async () => {
        // Handle successful uploads on complete
        // For instance, get the download URL: https://firebasestorage.googleapis.com/...
        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
        console.log('File available at', downloadURL);
        await updateTranscript(id, { status: 'in-progress' });
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
      const newTranscript = await createTranscript({
        title: item.title,
        description: item.description ? item.description : '',
        status: '',
        projectId: props.projectId
      });

      asyncUploadFile(newTranscript.id, item.file);

      newTranscript.update({
        url: genUrl(newTranscript.id)
      });
    }
  };

  const deleteTranscript = async id => {
    try {
      await Data.deleteItem(id);
    } catch (e) {
      console.error('Failed to delete item from collection: ', e.code_);
    }
    try {
      await props.firebase.storage.child(`users/${ uid }/uploads/${ id }`).delete();
      await props.firebase.storage.child(`users/${ uid }/audio/${ id }`).delete();
    } catch (e) {
      console.error('Failed to delete item in storage: ', e.code_);
    }
  };

  const handleDelete = id => {
    deleteTranscript(id);
  };

  // workaround for uploading cancellation - instead of doing this, maybe just have a progress bar and it dissappears...

  // const updateUploadErrors = async item => {
  //   const status = item.status;
  //   const id = item.id;

  //   // check for uploading (need to update storybook for this label to exist)
  //   if (status !== 'error' || status !== 'complete') {
  //     const path = `users/${ uid }/${ UPLOADFOLDER }/${ id }`;
  //     try {
  //       await props.firebase.storage.child(path).getDownloadURL();
  //     } catch (e) {
  //       await updateTranscript(id, { ...item, status: 'error' });
  //     }
  //   }
  // };

  // // items.forEach(i => {
  // //   updateUploadErrors(i);
  // // });

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
