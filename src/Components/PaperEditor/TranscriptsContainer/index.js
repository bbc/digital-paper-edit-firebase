import React, { useEffect, useState } from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Nav from 'react-bootstrap/Nav';
import Tab from 'react-bootstrap/Tab';
import TranscriptTabContent from './TranscriptTabContent';
// import getTimeFromUserWordsSelection from './get-user-selection.js';
import paragraphWithAnnotations from './Paragraphs/add-annotations-to-words-in-paragraphs.js';

import PropTypes from 'prop-types';

import { withAuthorization } from '../../Session';
import TranscriptNavItem from './TranscriptNavItem';

const TranscriptsContainer = ({ transcripts: trs, projectId, collections }) => {

  const [ labels, setLabels ] = useState([]);
  const [ transcripts, setTranscripts ] = useState(trs);

  // const mediaType = media ? media.type : '';

  const getSpeakerLabels = (paragraphs) => {
    const speakerSet = paragraphs.reduce((uniqueSpeakers, p) => {
      uniqueSpeakers.add(p.speaker);

      return uniqueSpeakers;
    }, new Set());

    return Array.from(speakerSet).map((speaker) => ({
      value: speaker,
      label: speaker,
    }));
  };

  useEffect(() => {

    const getTranscript = async tr => {
      const transcript = await collections.getTranscriptWithDecompression(projectId, tr.id);
      const transcriptMetadata = {
        media: { url: '' },
        annotations: [],
        annotatedParagraphs: [],
        speakers: []
      };

      try {

        transcriptMetadata.media.url = transcript.media ? await collections.getTranscriptMediaUrl(projectId, tr.id) : '';
        transcriptMetadata.annotations = collections.getAnnotations(projectId, tr.id);
        console.log(transcript, transcriptMetadata.annotations);
        transcriptMetadata.annotatedParagraphs = paragraphWithAnnotations(transcript.grouped, transcript.annotations);
        console.log(transcriptMetadata.annotatedParagraphs);
        transcriptMetadata.speakers = transcript.annotatedParagraphs ? getSpeakerLabels(transcript.annotatedParagraphs) : [];
        console.log(transcriptMetadata);

        return { ...transcript, ...transcriptMetadata };
      } catch (error) {
        console.error(error, 'Could not parse transcripts');
      }

      return transcript;
    };

    const getTranscripts = async () => {
      const transcriptsWithData = await Promise.all(trs.map(async tr => await getTranscript(tr)));
      setTranscripts(transcriptsWithData);
    };

    if (collections) {
      setLabels(collections.getProjectLabels(projectId));
      getTranscripts();
    }

    return () => {};
  }, [ labels, collections, projectId, trs ]);

  const transcriptsElNav = transcripts.map((transcript) => (
    <TranscriptNavItem
      key={ transcript.id }
      title={ transcript.title }
      id={ transcript.id }
      status={ transcript.status }
    />
  ));

  const createAnnotation = async (transcriptId, newAnnotation) => {
    const item = await collections.createAnnotation(projectId, transcriptId, newAnnotation);
    collections.updateAnnotation(projectId, transcriptId, { id: item.id });

    return { ...newAnnotation, id: item.id } ;
  };

  const deleteAnnotation = (annotationId, transcriptId) => {
    collections.deleteAnnotation(projectId, transcriptId, annotationId);
  };

  const handleCreateAnnotation = (transcriptId, newAnnotation) => {
    createAnnotation(transcriptId, newAnnotation);
  };

  const handleDeleteAnnotation = (annotationId, transcriptId) => {
    deleteAnnotation(annotationId, transcriptId);
  };

  const updateAnnotation = (annotationId, transcriptId, update) => {
    collections.updateAnnotation(projectId, transcriptId, update);
  };

  const handleEditAnnotation = (annotationId, transcriptId, newAnnotationToEdit) => {
    updateAnnotation(annotationId, transcriptId, newAnnotationToEdit);
  };

  const createLabel = async (newLabel) => {
    const label = await collections.createLabel(projectId, newLabel);
    setLabels(() => [ ...labels, label ]);
  };

  const handleCreateLabel = (newLabel) => {
    createLabel(newLabel);
  };

  const handleEditLabel = (labelId, updatedLabel) => {
    collections.updateLabel(labelId, updatedLabel);
    setLabels(() => [ ...labels, updatedLabel ]);
  };

  const handleDeleteLabel = (labelId) => {
    const tempLabels = labels;
    tempLabels.splice(labelId, 1);
    setLabels(tempLabels);
    collections.deleteLabels(labelId);
  };

  const handleLabelSelection = (e, labelId) => {
    const tempLabels = JSON.parse(JSON.stringify(labels));

    const previousActiveLabel = tempLabels.find((label) => label.active);
    if (previousActiveLabel) {
      previousActiveLabel.active = false;
    }
    const activeLabel = tempLabels.find((label) => label.id === labelId);
    activeLabel.active = true;

    setLabels(tempLabels);
  };

  const getTranscriptTabs = () => {
    return transcripts.map((transcript) => {
      const { id, annotations, media, title, speakers, annotatedParagraphs } = transcript;

      return (
        <Tab.Pane eventKey={ id }
          key={ id }
        >
          <TranscriptTabContent
            projectId={ projectId }
            transcriptId={ id }
            media={ media }
            title={ title }

            annotations={ annotations }
            speakers={ speakers }
            annotatedParagraphs={ annotatedParagraphs }

            handleCreateAnnotation={ handleCreateAnnotation }
            handleDeleteAnnotation={ handleDeleteAnnotation }
            handleEditAnnotation={ handleEditAnnotation }

            handleCreateLabel={ handleCreateLabel }
            handleDeleteLabel={ handleDeleteLabel }
            handleEditLabel={ handleEditLabel }
            handleLabelSelection={ handleLabelSelection }
          />
        </Tab.Pane>
      );
    });
  };

  // const transcriptsElTab = transcripts.map((transcript) => {
  //   const { id, annotations, media, title, speakers, annotatedParagraphs } = transcript;

  //   return (
  //     <Tab.Pane eventKey={ id }
  //       key={ id }
  //     >
  //       <TranscriptTabContent
  //         projectId={ projectId }
  //         transcriptId={ id }
  //         media={ media }
  //         title={ title }

  //         annotations={ annotations }
  //         speakers={ speakers }
  //         annotatedParagraphs={ annotatedParagraphs }

  //         handleCreateAnnotation={ handleCreateAnnotation }
  //         handleDeleteAnnotation={ handleDeleteAnnotation }
  //         handleEditAnnotation={ handleEditAnnotation }

  //         handleCreateLabel={ handleCreateLabel }
  //         handleDeleteLabel={ handleDeleteLabel }
  //         handleEditLabel={ handleEditLabel }
  //         handleLabelSelection={ handleLabelSelection }
  //       />
  //     </Tab.Pane>
  //   );
  // });

  const getDefaultActiveKey = () => {
    const doneItem = transcripts.find(transcript => transcript.status === 'done');
    if (doneItem) {
      return doneItem.id;
    } else {
      return 'first';
    }
  };

  return (
    <>
      <Tab.Container
        defaultActiveKey={ getDefaultActiveKey() }
      >
        <Row>
          <Col sm={ 3 }>
            <h2
              className={ [ 'text-truncate', 'text-muted' ].join(' ') }
              title={ 'Transcripts' }
            >
              Transcripts
            </h2>
            <hr />

            <Nav variant="pills" className="flex-column">
              {transcriptsElNav}
            </Nav>
          </Col>
          <Col sm={ 9 }>
            <Tab.Content>
              {transcripts ? getTranscriptTabs() : null}
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </>
  );
};

TranscriptsContainer.propTypes = {
  collections: PropTypes.shape({
    createAnnotation: PropTypes.func,
    createLabel: PropTypes.func,
    deleteAnnotation: PropTypes.func,
    deleteLabels: PropTypes.func,
    getAnnotations: PropTypes.func,
    getProjectLabels: PropTypes.func,
    getTranscriptMediaUrl: PropTypes.func,
    getTranscriptWithDecompression: PropTypes.func,
    updateAnnotation: PropTypes.func,
    updateLabel: PropTypes.func
  }),
  media: PropTypes.shape({
    type: PropTypes.any
  }),
  projectId: PropTypes.any,
  transcripts: PropTypes.any,
};

const condition = (authUser) => !!authUser;
export default withAuthorization(condition)(TranscriptsContainer);
