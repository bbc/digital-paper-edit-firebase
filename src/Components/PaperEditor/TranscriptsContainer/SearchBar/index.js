import PropTypes from 'prop-types';
import React, { useState } from 'react';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faFilter,
  faTag,
  faUser,
  faSearch,
} from '@fortawesome/free-solid-svg-icons';
import colourStyles from '../LabelsList/select-color-styles.js';
import speakersColorStyles from './select-speakers-color-styles.js';

const SearchBar = (props) => {
  const [ paragraphOnly, setParagraphOnly ] = useState(true);
  const [ searchBySpeaker, setSearchBySpeaker ] = useState(false);
  const [ searchByLabel, setSearchByLabel ] = useState(false);

  const toggleParagraphyOnly = () => setParagraphOnly(!paragraphOnly);

  const toggleShowLabels = () => setSearchByLabel(!searchByLabel);

  const toggleShowSpeakers = () => setSearchBySpeaker(!searchBySpeaker);

  const handleToggleAll = () => {
    setParagraphOnly(true);
    setSearchBySpeaker(true);
    setSearchByLabel(true);
  };

  const handleHideAll = () => {
    setParagraphOnly(false);
    setSearchBySpeaker(false);
    setSearchByLabel(false);
  };

  const onChange = (e) => {
    console.log('onchange', paragraphOnly, searchByLabel, searchBySpeaker);
    props.handleSearch(e, {
      paragraphOnly,
      searchByLabel,
      searchBySpeaker
    });
  };

  const FilterDropdown = (
    <DropdownButton
      drop={ 'right' }
      as={ InputGroup.Append }
      variant="outline-secondary"
      title={ <FontAwesomeIcon icon={ faFilter } title="Filter results" /> }
    >
      <Dropdown.Item
        onClick={ toggleShowLabels }
        title="Filter results by Labels"
      >
        <FontAwesomeIcon icon={ faTag } /> Labels{' '}
        {searchByLabel ? (
          <FontAwesomeIcon style={ { color: 'blue' } } icon={ faCheck } />
        ) : (
          ''
        )}
      </Dropdown.Item>
      <Dropdown.Item
        onClick={ toggleShowSpeakers }
        title="Filter results by Speakers"
      >
        <FontAwesomeIcon icon={ faUser } /> Speakers{' '}
        {searchBySpeaker ? (
          <FontAwesomeIcon style={ { color: 'blue' } } icon={ faCheck } />
        ) : (
          ''
        )}
      </Dropdown.Item>

      <Dropdown.Item
        onClick={ handleToggleAll }
        title="Show all of the above options"
      >
        All{' '}
        {searchByLabel && searchBySpeaker && paragraphOnly ? (
          <FontAwesomeIcon style={ { color: 'blue' } } icon={ faCheck } />
        ) : (
          ''
        )}
      </Dropdown.Item>
      <Dropdown.Divider />
      <Dropdown.Item
        onClick={ handleHideAll }
        title="Deselect all the options"
      >
        Deselect all
      </Dropdown.Item>
    </DropdownButton>
  );

  return (
    <Card.Header>
      <InputGroup className="mb-3">
        <InputGroup.Prepend>
          <InputGroup.Text>
            <FontAwesomeIcon icon={ faSearch } />
          </InputGroup.Text>
        </InputGroup.Prepend>
        <FormControl
          onChange={ onChange }
          placeholder="Search text..."
          aria-label="search"
          aria-describedby="search"
        />
        {FilterDropdown}
      </InputGroup>

      {searchByLabel ? (
        <Row style={ { 'marginBottom': '10px' } }>
          <Col xs={ 1 }>
            <h4>
              <Badge variant="secondary">
                <FontAwesomeIcon icon={ faTag } />
              </Badge>
            </h4>
          </Col>
          <Col>
            <Select
              value={ props.selectedLabels }
              onChange={ props.selectLabel }
              isMulti
              isSearchable
              options={ props.labels }
              styles={ colourStyles }
              placeholder={ 'Filter by label...' }
            />
          </Col>
        </Row>
      ) : (
        ''
      )}

      {searchBySpeaker ? (
        <Row style={ { 'margin-bottom': '10px' } }>
          <Col xs={ 1 }>
            <h4>
              <Badge variant="secondary">
                <FontAwesomeIcon icon={ faUser } />
              </Badge>
            </h4>
          </Col>
          <Col>
            <Select
              value={ props.selectedSpeakers }
              onChange={ props.selectSpeaker }
              isMulti
              isSearchable
              options={ props.speakers }
              styles={ speakersColorStyles }
              placeholder={ 'Filter by speaker...' }
            />
          </Col>
        </Row>
      ) : (
        ''
      )}

      <Form.Check
        type="checkbox"
        onChange={ onChange }
        defaultChecked={ paragraphOnly }
        onClick={ toggleParagraphyOnly }
        label={
          <>
            <Form.Text
              className="text-muted"
              title="Show only matching paragraphs"
            >
              Show only matching paragraphs
            </Form.Text>
          </>
        }
      />
    </Card.Header>
  );
};

SearchBar.propTypes = {
  handleSearch: PropTypes.func,
  selectLabel: PropTypes.func,
  selectSpeaker: PropTypes.func,
  selectedSpeakers: PropTypes.any,
  selectedLabels: PropTypes.any,
  labels: PropTypes.any,
  speakers: PropTypes.any,
  toggleShowMatch: PropTypes.func,
};

export default SearchBar;
