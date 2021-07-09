import React from 'react';
import PropTypes from 'prop-types';
import { withAuthorization } from '../../Session';
import { formatDates } from '../../../Util/time';
import ProjectRow from '@bbc/digital-paper-edit-storybook/ProjectRow';

const PaperEdits = (props) => {
  const items = props.items;

  const PaperEditRows = items.map(item => {
    const key = `card-paper-edit-${ item.id }`;
    const { created, updated } = formatDates(item);

    return (
      <div key={ key }>
        <ProjectRow
          description={ item.description }
          id={ item.id }
          title={ item.title }
          url={ item.url ? item.url : '' }
          created={ created ? created : 'NA' }
          updated={ updated ? updated : 'NA' }
          handleDuplicateItem={ props.handleDuplicateItem }
          handleEditItem={ props.handleEditItem }
          handleDeleteItem={ props.handleDeleteItem }
          handleClick={ () => props.trackEvent({ category: 'project overview', action: 'open', name: `programme script: ${ item.id }` }) }
        />
        <hr style={ { color: 'grey' } } />
      </div>
    );
  });

  return (
    <>
      <section style={ { height: '75vh', overflow: 'scroll' } }>
        {items.length > 0 ? (
          PaperEditRows
        ) : (
          <i>There are no paper edits, create a new one to get started.</i>
        )}
      </section>
    </>
  );
};

PaperEdits.propTypes = {
  firebase: PropTypes.any,
  handleDeleteItem: PropTypes.any,
  handleDuplicateItem: PropTypes.any,
  handleEditItem: PropTypes.any,
  items: PropTypes.any,
  projectId: PropTypes.any,
  trackEvent: PropTypes.func
};

const condition = (authUser) => !!authUser;
export default withAuthorization(condition)(PaperEdits);
