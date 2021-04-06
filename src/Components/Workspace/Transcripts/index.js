import React from 'react';
import PropTypes from 'prop-types';
import { withAuthorization } from '../../Session';
import TranscriptRow from '@bbc/digital-paper-edit-storybook/TranscriptRow';
import { formatISOObj } from '../../../Util/time';

const Transcripts = (props) => {
  const items = props.items;

  const TranscriptRows = items.map(item => {
    const key = `card-transcript-${ item.id }`;
    const { created, updated } = formatISOObj(item);

    return (
      <>
        <TranscriptRow
          description={ item.description }
          id={ item.id }
          title={ item.title }
          url={ item.url ? item.url : '' }
          created={ created }
          updated={ updated }
          key={ key }
          handleEditItem={ props.handleEditItem }
          handleDeleteItem={ props.handleDeleteItem }
        />
      </>
    );
  });

  return (
    <>
      <section style={ { height: '75vh', overflow: 'scroll' } }>
        {items.length > 0 ? (
          TranscriptRows
        ) : (
          <i>There are no transcripts, create a new one to get started.</i>
        )}
      </section>
    </>
  );
};

Transcripts.propTypes = {
  firebase: PropTypes.any,
  handleDeleteItem: PropTypes.any,
  handleEditItem: PropTypes.any,
  items: PropTypes.any,
  projectId: PropTypes.any,
  trackEvent: PropTypes.func
};

const condition = (authUser) => !!authUser;
export default withAuthorization(condition)(Transcripts);
