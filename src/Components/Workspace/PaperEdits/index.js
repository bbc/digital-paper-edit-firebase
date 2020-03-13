import React, { useEffect, useState } from 'react';
import ItemsContainer from '../../lib/ItemsContainer';
import PropTypes from 'prop-types';
import Collection from '../../Firebase/Collection';
import { withAuthorization } from '../../Session';

const PaperEdits = props => {
  const TYPE = 'Paper Edit';

  const Data = new Collection(
    props.firebase,
    `/projects/${ props.projectId }/paperedits`
  );
  const [ items, setItems ] = useState([]);
  const [ loading, setIsLoading ] = useState(false);

  const genUrl = id => {
    return `/projects/${ props.projectId }/paperedits/${ id }`;
  };

  useEffect(() => {
    const getPaperEdits = async () => {
      try {
        Data.collection.onSnapshot(snapshot => {
          const paperEdits = snapshot.docs.map(doc => {
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
  }, [ Data, loading, items, props.projectId ]);

  const createPaperEdit = async item => {
    const paperEdit = { ...item, projectId: props.projectId };
    const docRef = await Data.postItem(paperEdit);

    item.url = genUrl(docRef.id);

    docRef.update({
      url: item.url
    });

    item.display = true;

    return item;
  };

  const updatePaperEdit = async (id, item) => {
    await Data.putItem(id, item);
    item.display = true;
  };

  const handleSave = async item => {
    if (item.id) {
      return await updatePaperEdit(item.id, item);
    } else {
      return await createPaperEdit(item);
    }
  };

  const deletePaperEdit = async id => {
    try {
      await Data.deleteItem(id);
    } catch (e) {
      console.error('Failed to delete item:', e);
    }
  };

  const handleDelete = id => {
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
  projectId: PropTypes.any
};

const condition = authUser => !!authUser;
export default withAuthorization(condition)(PaperEdits);
