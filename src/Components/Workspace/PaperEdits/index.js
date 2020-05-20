import React, { useEffect, useState } from 'react';
import ItemsContainer from '../../lib/ItemsContainer';
import PropTypes from 'prop-types';
import Collection from '../../Firebase/Collection';
import { withAuthorization } from '../../Session';

const PaperEdits = (props) => {
  const TYPE = 'Paper Edit';

  const PaperEditsCollection = new Collection(
    props.firebase,
    `/projects/${ props.projectId }/paperedits`
  );

  const [ items, setItems ] = useState([]);
  const [ loading, setIsLoading ] = useState(false);

  useEffect(() => {
    const getPaperEdits = async () => {
      try {
        PaperEditsCollection.collectionRef.onSnapshot((snapshot) => {
          const paperEdits = snapshot.docs.map((doc) => {
            return { ...doc.data(), id: doc.id, display: true };
          });
          setItems(paperEdits);
        });
      } catch (error) {
        console.error('Error getting documents: ', error);
      }
    };
    // TODO: some error handling
    if (!loading) {
      getPaperEdits();
      setIsLoading(true);
    }

    return () => {};
  }, [ PaperEditsCollection, loading, items, props.projectId ]);

  const createPaperEdit = async (item) => {
    const docRef = await PaperEditsCollection.postItem(item);

    docRef.update({
      id: docRef.id,
      url: `/projects/${ props.projectId }/paperedits/${ docRef.id }`,
    });

    return item;
  };

  const updatePaperEdit = (id, item) => {
    PaperEditsCollection.putItem(id, item);
  };

  const handleSave = async (item) => {
    item.display = true;

    if (item.id) {
      updatePaperEdit(item.id, item);
    } else {
      item.url = '';
      item.projectId = props.projectId;
      createPaperEdit(item);

      setItems(() => [ ...items, item ]);
    }
  };

  const deletePaperEdit = async (id) => {
    try {
      await PaperEditsCollection.deleteItem(id);
    } catch (e) {
      console.error('Failed to delete item:', e);
    }
  };

  const handleDelete = (id) => {
    deletePaperEdit(id);
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

PaperEdits.propTypes = {
  firebase: PropTypes.any,
  projectId: PropTypes.any
};

const condition = (authUser) => !!authUser;
export default withAuthorization(condition)(PaperEdits);
