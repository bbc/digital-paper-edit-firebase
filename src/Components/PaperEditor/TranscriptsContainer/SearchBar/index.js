import PropTypes from 'prop-types';
import React, { useState } from 'react';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faAlignJustify,
  faFilter,
  faTag,
  faUser,
  faSearch,
} from '@fortawesome/free-solid-svg-icons';
import colourStyles from '../LabelsList/select-color-styles.js';
import speakersColorStyles from './select-speakers-color-styles.js';

const SearchBar = (props) => {
  const [ showMatch, setShowMatch ] = useState(false);
  const [ showText, setShowText ] = useState(false);
  const [ searchBySpeaker, setSearchBySpeaker ] = useState(false);
  const [ searchByLabel, setSearchByLabel ] = useState(false);
  const [ speakers, setSpeakers ] = useState([]);
  const [ labels, setLabels ] = useState([]);

  const toggleShowText = () => setShowText(!showText);

  const toggleShowLabels = () => setSearchByLabel(!searchByLabel);

  const toggleShowSpeakers = () => setSearchBySpeaker(!searchBySpeaker);

  const selectSpeaker = (s) => {
    props.selectSpeaker(s);
    setSpeakers(s);
  };
  const selectLabel = (l) => {
    props.selectLabel(l);
    setLabels(l);
  };

  const handleToggleAll = () => {
    setShowText(true);
    setSearchBySpeaker(true);
    setSearchByLabel(true);
    // defaults to show only matching paragraph to be checked
    setShowMatch(true);

    props.toggleShowMatch();
  };
  const handleHideAll = () => {
    setShowText(false);
    setSearchBySpeaker(false);
    setSearchByLabel(false);
    // remove preferences for showing matching paragraphjs when removing filters
    setShowMatch(false);

    props.toggleShowMatch();
  };

  /* TODO: move searchBar to a Search Toolbar component? */
  return (
    <>
      <Card.Header>
        <InputGroup className="mb-3">
          <InputGroup.Prepend>
            <InputGroup.Text>
              <FontAwesomeIcon icon={ faSearch } />
            </InputGroup.Text>
          </InputGroup.Prepend>
          {/* Search */}
          <FormControl
            //  TODO: pass labels, speakers, and paragraph pref
            onChange={ (e) => {
              props.handleSearch(e, {
                showMatch,
                searchByLabel,
                searchBySpeaker
              });
            } }
            placeholder="Search text..."
            aria-label="search"
            aria-describedby="search"
          />
          <DropdownButton
            drop={ 'right' }
            as={ InputGroup.Append }
            variant="outline-secondary"
            title={
              <>
                <FontAwesomeIcon icon={ faFilter } title="Filter results" />
              </>
            }
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
              onClick={ toggleShowText }
              title="Show only matching paragraphs"
            >
              <FontAwesomeIcon icon={ faAlignJustify } /> Paragraphs only{' '}
              {showText ? (
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
              {searchByLabel && searchBySpeaker && showText ? (
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
        </InputGroup>

        {searchByLabel ? (
          <>
            <Row className="mb-3">
              <Col xs={ 1 } sm={ 1 } md={ 1 } ld={ 1 } xl={ 1 }>
                <InputGroup.Prepend>
                  <InputGroup.Text>
                    <FontAwesomeIcon icon={ faTag } />
                  </InputGroup.Text>
                </InputGroup.Prepend>
              </Col>
              <Col xs={ 10 } sm={ 11 } md={ 11 } ld={ 11 } xl={ 11 }>
                <Select
                  value={ labels }
                  onChange={ selectLabel }
                  isMulti
                  isSearchable
                  options={ props.labels }
                  styles={ colourStyles }
                  placeholder={ 'Filter by label...' }
                />
              </Col>
            </Row>
          </>
        ) : (
          ''
        )}

        {searchBySpeaker ? (
          <>
            <Row className="mb-3">
              <Col xs={ 1 } sm={ 1 } md={ 1 } ld={ 1 } xl={ 1 }>
                <InputGroup.Prepend>
                  <InputGroup.Text>
                    <FontAwesomeIcon icon={ faUser } />
                  </InputGroup.Text>
                </InputGroup.Prepend>
              </Col>
              <Col xs={ 10 } sm={ 11 } md={ 11 } ld={ 11 } xl={ 11 }>
                <Select
                  value={ speakers }
                  onChange={ selectSpeaker }
                  isMulti
                  isSearchable
                  options={ props.speakers }
                  styles={ speakersColorStyles }
                  placeholder={ 'Filter by speaker...' }
                />
              </Col>
            </Row>
          </>
        ) : (
          ''
        )}

        {showText ? (
          <>
            <Form.Check
              type="checkbox"
              checked={ showMatch }
              onChange={ showMatch }
              label={
                <>
                  <Form.Text
                    className="text-muted"
                    title="Show only matching paragraphs"
                    onClick={ showMatch }
                  >
                    Show only matching paragraphs
                  </Form.Text>
                </>
              }
            />
          </>
        ) : (
          ''
        )}
      </Card.Header>
    </>
  );
};

SearchBar.propTypes = {
  selectLabel: PropTypes.func,
  handleSearch: PropTypes.func,
  selectSpeaker: PropTypes.func,
  labels: PropTypes.any,
  speakers: PropTypes.any,
  toggleShowMatch: PropTypes.func,
};

export default SearchBar;
