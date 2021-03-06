import React from 'react';
import PropTypes from 'prop-types';
import { withAuthorization } from '../../Session';
import TranscriptRow from '@bbc/digital-paper-edit-storybook/TranscriptRow';
import { formatDates } from '../../../Util/time';
import './index.scss';

const sortItems = (items) => {
  return items.sort((a, b) => {
    const aTime = a.uploaded ? a.uploaded : a.created;
    const bTime = b.uploaded ? b.uploaded : b.created;

    return bTime - aTime;
  });
};

const Transcripts = (props) => {
  const items = props.items;
  const uploadTasks = props.uploadTasks;
  const sortedItems = sortItems(items);

  const TranscriptRows = sortedItems.map(item => {
    const key = `card-transcript-${ item.id }`;
    const { created, updated } = formatDates(item);
    const progress = uploadTasks.get(item.id);

    return (
      <div key={ key }>
        <TranscriptRow
          description={ item.description }
          id={ item.id }
          title={ item.title }
          url={ item.url ? item.url : '' }
          created={ created ? created : 'NA' }
          updated={ updated ? updated : 'NA' }
          message={ item.message }
          mediaDuration={ item.duration ? item.duration : null }
          transcriptionDuration={ item.transcriptionDuration }
          status={ item.status }
          progress={ progress }
          handleEditItem={ props.handleEditItem }
          handleDeleteItem={ props.handleDeleteItem }
          mediaType={ item.type }
          handleClick={ () => props.trackEvent({ category: 'project overview', action: 'click', name: `transcript: ${ item.id }` }) }
        />
      </div>
    );
  });

  return (
    <section style={ { height: '75vh', overflow: 'scroll' } }>
      {items.length > 0 ? (
        TranscriptRows
      ) : (
        <i>There are no transcripts, create a new one to get started.</i>
      )}
    </section>
  );
};

Transcripts.propTypes = {
  firebase: PropTypes.any,
  handleDeleteItem: PropTypes.any,
  handleEditItem: PropTypes.any,
  items: PropTypes.any,
  projectId: PropTypes.any,
  trackEvent: PropTypes.func,
  uploadTasks: PropTypes.any
};

const condition = (authUser) => !!authUser;
export default withAuthorization(condition)(Transcripts);
