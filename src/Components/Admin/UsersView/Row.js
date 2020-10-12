import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';

import Collection from '../../Firebase/Collection';
import { PROJECTS } from '../../../constants/routes';
import { updateDescOrder, getISOTime } from '../../../Util/time';

const Row = props => {
  const Projects = new Collection(props.firebase, PROJECTS);
  const { role, access, id, email, updated, } = props.user;
  const [ userProjects, setUserProjects ] = useState();

  useEffect(() => {
    const getProjects = async () => {
      try {
        Projects.userRef(id).onSnapshot((snapshot) => {
          const data = snapshot.docs.map((doc) => {
            return { ...doc.data(), id: doc.id };
          });
          if (data.length === 0) {
            data[0] = { id: '', title: '', created: { seconds: '' } };
          }
          setUserProjects(data);
        });
      } catch (e) {
        console.error('Could not get Project Id: ', e);
        setUserProjects([]);
      }
    };

    if (!userProjects) {
      getProjects();
    }

    return () => {
    };
  }, [ Projects, id, userProjects ]);

  let updatedSeconds = 'N/A';

  if (updated) {
    updatedSeconds = getISOTime(updated.seconds);
  }

  const getRows = () => userProjects.map(project => {
    return (
      <tr key={ project.id }>
        <td>
          {id}
        </td>
        <td>
          {email}
        </td>
        <td>
          {project.id}
        </td>
        <td>
          {project.title}
        </td>
        <td>
          {getISOTime(project.created.seconds)}
        </td>
        <td>
          {role}
        </td>
        <td>
          {updatedSeconds}
        </td>
        <td>
          {access}
        </td>
      </tr>
    );
  });

  return (
    <>
      { userProjects ? getRows() : [] }
    </>
  );
};

Row.propTypes = {
  firebase: PropTypes.any,
  match: PropTypes.shape({
    params: PropTypes.shape({
      projectId: PropTypes.any
    })
  }),
  user: PropTypes.any
};

export default Row;
