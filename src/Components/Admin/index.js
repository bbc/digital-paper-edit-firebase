import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import Container from 'react-bootstrap/Container';
import CustomFooter from '../lib/CustomFooter';
import Collection from '../Firebase/Collection';
import { USERS } from '../../constants/routes';
import { withAuthorization } from '../Session';
import UserRow from './UserRow';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { Modal } from 'react-bootstrap';
import UserForm from './UserForm';

const AdminView = props => {
  const Users = new Collection(props.firebase, USERS);
  const [ users, setUsers ] = useState();
  const [ message, setMessage ] = useState('');

  const [ messageShow, setMessageShow ] = useState(false);
  const handleMessageClose = () => setMessageShow(false);
  const handleMessageShow = () => setMessageShow(true);

  const [ formShow, setFormShow ] = useState(false);
  const handleFormClose = () => setFormShow(false);
  const handleFormShow = () => setFormShow(true);

  useEffect(() => {
    const getUsers = async () => {
      try {
        const allUsers = await Users.getCollection();
        setUsers(allUsers);
      } catch (e) {
        console.error('Could not get Users: ', e);
        setUsers([]);
      }
    };

    if (!users) {
      getUsers();
    }

    return () => {
    };
  }, [ Users, users ]);

  const handleSubmit = async (email, password) => {
    handleFormClose();
    try {
      const newUser = await props.firebase.doCreateUserWithEmailAndPassword(email, password);
      setMessage(`Succesfully created new user with ID: ${ newUser.user.uid } with email: ${ email }, now resign in.`);
    } catch (err) {
      setMessage(`${ err.code }: ${ err.message }`);
    }
    handleMessageShow();
  };

  return (
    <>
      <Row>
        <Col md={ { offset: 10 } }>
          <Button onClick={ handleFormShow }>
            <FontAwesomeIcon icon={ faPlusCircle }>
            </FontAwesomeIcon> Add User
          </Button>
          <Modal show={ formShow } onHide={ handleFormClose }>
            <Modal.Header closeButton>
              <Modal.Title>Add New User</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <UserForm handleSubmit={ handleSubmit }></UserForm>
            </Modal.Body>
          </Modal>
          <Modal show={ messageShow } onHide={ handleMessageClose }>
            <Modal.Header closeButton>
              <Modal.Title>Message</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {message}
            </Modal.Body>
            <Modal.Footer>
              <Button onClick={ handleMessageClose }>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </Col>
      </Row>
      <Container style={ { marginBottom: '5em', marginTop: '1em' } }>
        <Table responsive>
          <thead>
            <tr>
              <th>User ID</th>
              <th>Email</th>
              <th>Project ID</th>
              <th>Project Title</th>
              <th>Project Created</th>
              <th>Role</th>
              <th>Updated</th>
              <th>Access</th>
            </tr>
          </thead>
          <tbody>
            {users ? users.map(u =>
              <UserRow user={ u } firebase={ props.firebase } key={ u.id }/>
            ) : null}
          </tbody>

        </Table>
      </Container>
      <CustomFooter />
    </>
  );
};

AdminView.propTypes = {
  firebase: PropTypes.any,
  match: PropTypes.shape({
    params: PropTypes.shape({
      projectId: PropTypes.any
    })
  })
};
const condition = (authUser) => (!!authUser);
export default withAuthorization(condition)(AdminView);
