import React from 'react';
import PropTypes from 'prop-types';
// import Collection from '../../Firebase/Collection';
import { withAuthorization } from '../../Session';
import { getISOTime } from '../../../Util/time';
import ProjectRow from '@bbc/digital-paper-edit-storybook/ProjectRow';

const PaperEdits = (props) => {
  // const PaperEditsCollection = new Collection(
  //   props.firebase,
  //   `/projects/${ props.projectId }/paperedits`
  // );

  const items = props.items;

  const PaperEditRows = items.map(item => {
    const key = `card-${ item.id }`;
    const created = item.created ? getISOTime(item.created.seconds).split('T')[0] : 0;
    const updated = item.updated ? getISOTime(item.updated.seconds).split('T')[0] : 0;

    return (
      <>
        <ProjectRow
          { ...item }
          created={ created }
          updated={ updated }
          key={ key }
          handleDuplicateItem={ props.handleDuplicateItem }
          handleEditItem={ props.handleEditItem }
          handleDeleteItem={ props.handleDeleteItem }
        />
        <hr style={ { color: 'grey' } } />
      </>
    );
  });

  return (
    <>
      <p>Programme Script Titles</p>
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
  projectId: PropTypes.any
};

const condition = (authUser) => !!authUser;
export default withAuthorization(condition)(PaperEdits);
