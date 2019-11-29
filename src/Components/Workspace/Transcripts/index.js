import React, { useEffect, useState } from 'react';
import ItemsContainer from '../../lib/ItemsContainer';
import PropTypes from 'prop-types';
import Collection from '../../Firebase/Collection';
import { withAuthorization } from '../../Session';

const Transcripts = props => {
  const TRANSCRIPTS = '/transcripts';
  const TYPE = 'Transcript';

  const collection = new Collection(props.firebase.db, TRANSCRIPTS);
  const [ loading, setIsLoading ] = useState(false);
  const [ items, setItems ] = useState([]);

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

    if (!loading) {
      getTranscripts();
      setIsLoading(true);
    }

    return () => {};
  }, [ collection, collection.collection, loading, props.projectId ]);

  const updateTranscript = async (id, item) => {
    await collection.putItem(id, item);
    item.display = true;

    return item;
  };

  const createTranscript = async item => {
    console.log(item);
    item.projectId = props.projectId;
    const docRef = await collection.postItem(item);
    item.url = genUrl(docRef.id);
    item.status = 'in-progress';

    docRef.update({
      url: item.url,
      status: item.status
    });

    item.display = true;

    return item;
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
