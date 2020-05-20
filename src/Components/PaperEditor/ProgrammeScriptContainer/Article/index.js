import PropTypes from 'prop-types';
import React from 'react';
import { SortableContainer } from 'react-sortable-hoc';
import ProgrammeElements from '@bbc/digital-paper-edit-storybook/ProgrammeElements';

const Article = ({
  elements,
  handleDblClick,
  onSortEnd,
  handleEdit,
  handleDelete,
}) => {
  const SortableList = SortableContainer(({ children }) => (
    <ul style={ { listStyle: 'none', padding: '0px' } }>{children}</ul>
  ));

  return (
    <article
      style={ { height: '60vh', overflow: 'scroll' } }
      onDoubleClick={ handleDblClick }
    >
      {elements ? (
        <SortableList useDragHandle onSortEnd={ onSortEnd }>
          {ProgrammeElements(elements, handleEdit, handleDelete)}
        </SortableList>
      ) : null}
    </article>
  );
};

Article.propTypes = {
  elements: PropTypes.any,
  handleDelete: PropTypes.any,
  handleDblClick: PropTypes.any,
  handleEdit: PropTypes.any,
  onSortEnd: PropTypes.any
};

export default Article;