import React, { useEffect, useState, useReducer } from 'react';
import PropTypes from 'prop-types';
import { withAuthorization } from '../../Session';
import { itemsReducer, itemsInitState, itemsInit } from '../itemsReducer';
import { formReducer, initialFormState } from '../formReducer';

import { DONE, ERROR, UPLOADING } from '../../../constants/transcriptStatus';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';

import { anyInText } from '../../../Util/in-text';
import FormModal from '@bbc/digital-paper-edit-storybook/FormModal';
import SearchBar from '@bbc/digital-paper-edit-storybook/SearchBar';
import TranscriptCard from '@bbc/digital-paper-edit-storybook/TranscriptCard';
import cuid from 'cuid';

const Transcripts = ({ projectId, collections }) => {
  const [ uploadTasks, setUploadTasks ] = useState(new Map());
  const [ items, dispatchItems ] = useReducer(
    itemsReducer,
    itemsInitState,
    itemsInit
  );
  const [ uploading, setUploading ] = useState();
  const [ showingItems, setShowingItems ] = useState([]);
  const [ showModal, setShowModal ] = useState(false);
  const [ formData, dispatchForm ] = useReducer(formReducer, initialFormState);

  const genUrl = (id) => {
    return `/projects/${ projectId }/transcripts/${ id }/correct`;
  };

  useEffect(() => {
    if (collections) {
      dispatchItems({
        type: 'set',
        payload: collections.getProjectTranscripts(projectId),
      });
    }

    return () => {};
  }, [ collections, projectId ]);

  const handleSaveForm = (item) => {
    handleSave(item);
    setShowModal(false);
    dispatchForm({ type: 'reset' });
  };

  const handleEditItem = (id) => {
    const item = items.find((i) => i.id === id);
    dispatchForm({
      type: 'update',
      payload: item,
    });
    setShowModal(true);
  };

  const toggleShowModal = () => {
    setShowModal(!showModal);
  };

  const handleOnHide = () => {
    setShowModal(false);
  };

  // search

  const handleFilterDisplay = (item, text) => {
    if (anyInText([ item.title, item.description ], text)) {
      item.display = true;
    } else {
      item.display = false;
    }

    return item;
  };

  const handleSearch = (text) => {
    const results = items.map((item) => handleFilterDisplay(item, text));
    setShowingItems(results.filter((item) => item.display));
  };

  // generic

  useEffect(() => {
    setShowingItems(items);

    return () => {
      setShowingItems([]);
    };
  }, [ items ]);

  const handleDeleteItem = (id) => {
    collections.deleteTranscript(projectId, id);
    dispatchItems({ type: 'delete', payload: { id } });
  };

  const handleUpdateStatus = (id, status) => {
    const updatedStatus = { status: status };
    collections.updateTranscript(projectId, id, updatedStatus);
    dispatchItems({
      type: 'update',
      payload: { id, update: updatedStatus },
    });
  };

  // storage

  const handleUploadProgress = (id, snapshot) => {
    const progress = Math.floor(
      (snapshot.bytesTransferred / snapshot.totalBytes) * 100
    );
    const newUploading = new Map(uploadTasks); // shallow clone
    newUploading.set(id, progress);

    return newUploading;
  };

  const handleUploadError = (id, error) => {
    console.error('Failed to upload file: ', error);
    const newTasks = new Map(uploadTasks); // shallow clone
    newTasks.delete(id);

    return newTasks;
  };

  const handleUploadComplete = (id) => {
    console.log('File upload completed');
    const newTasks = new Map(uploadTasks); // shallow clone
    newTasks.delete(id);

    return newTasks;

  };

  const createTranscript = async (item) => {
    const newItem = {
      title: item.title,
      description: item.description ? item.description : '',
      status: 'uploading',
      projectId: projectId,
    };

    const newTranscript = await collections.createTranscript(
      projectId,
      newItem
    );

    newItem.id = newTranscript.id;
    newItem.url = genUrl(newTranscript.id);

    dispatchItems({ type: 'add', payload: { item: newItem } });
    await collections.updateTranscript(projectId, newItem.id, newItem);

    return newItem.id;
  };

  const handleSave = async (item) => {
    if (item.id) {
      collections.updateTranscript(projectId, item.id, item);
      dispatchItems({
        type: 'update',
        payload: { id: item.id, update: item },
      });
    } else {
      const id = await createTranscript(item);
      setUploading({ id: id, file: item.file });
    }
  };

  const uploadHandler = (id, file, video, items) => {
    window.URL.revokeObjectURL(video.src);
    const uploadTask = collections.asyncUploadFile(
      id,
      projectId,
      video.duration,
      file
    );

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const newUploading = handleUploadProgress(id, snapshot);
        setUploadTasks(newUploading);
        handleUpdateStatus(id, UPLOADING, items);
      },
      (error) => {
        const newTasks = handleUploadError(id, error);
        setUploadTasks(newTasks);
        handleUpdateStatus(id, ERROR, items);
      },
      () => {
        const newTasks = handleUploadComplete(id);
        setUploadTasks(newTasks);
        handleUpdateStatus(id, DONE, items);
        setUploading(null);
      }
    );
  };

  const asyncUploadFile = ({ id, file }, items) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => uploadHandler(id, file, video, items);
    video.src = URL.createObjectURL(file);
  };

  useEffect(() => {
    if (uploading) {
      console.log(items);
      asyncUploadFile(uploading, items);
      setUploading();
    }

    return () => {
    };
  }, [ items, uploading ]);

  const Cards = showingItems.map((item) => {
    const key = 'card-' + cuid();

    return (
      <TranscriptCard
        description={ item.description }
        message={ item.message }
        id={ item.id }
        status={ typeof item.status !== 'string' ? ERROR : item.status }
        title={ item.title }
        url={ item.url ? item.url : '' }
        progress={ uploadTasks.get(item.id) }
        key={ key }
        handleEditItem={ handleEditItem }
        handleDeleteItem={ handleDeleteItem }
      />
    );
  });

  return (
    <>
      <Row>
        <Col sm={ 9 }>
          <SearchBar handleSearch={ handleSearch } />
        </Col>
        <Col xs={ 12 } sm={ 3 }>
          <Button
            onClick={ toggleShowModal }
            variant="outline-secondary"
            size="sm"
            block
          >
            New Transcript
          </Button>
        </Col>
      </Row>

      <section style={ { height: '75vh', overflow: 'scroll' } }>
        {showingItems.length > 0 ? (
          Cards
        ) : (
          <i>There are no transcripts, create a new one to get started.</i>
        )}
      </section>

      <FormModal
        { ...formData }
        modalTitle={ formData.id ? 'Edit transcripts' : 'New transcripts' }
        showModal={ showModal }
        handleOnHide={ handleOnHide }
        handleSaveForm={ handleSaveForm }
        type={ 'transcript' }
      />
    </>
  );
};

Transcripts.propTypes = {
  collections: PropTypes.shape({
    asyncUploadFile: PropTypes.func,
    createTranscript: PropTypes.func,
    deleteTranscript: PropTypes.func,
    getProjectTranscripts: PropTypes.func,
    updateTranscript: PropTypes.func,
  }),
  firebase: PropTypes.any,
  projectId: PropTypes.any,
};

const condition = (authUser) => !!authUser;
export default withAuthorization(condition)(Transcripts);
