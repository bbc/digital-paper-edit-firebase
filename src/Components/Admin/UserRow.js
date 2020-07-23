import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';

import Collection from '../Firebase/Collection';
import { PROJECTS } from '../../constants/routes';

const UserRow = props => {
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

  // show which transcriptions have failed
  // show which users are who
  //   useEffect(() => {
  //     const getUserTranscripts = async (projectId) => {
  //       const Transcripts = new Collection(
  //         props.firebase,
  //         `/projects/${ projectId }/transcripts`
  //       );

  //       try {
  //         return Transcripts.collectionRef.onSnapshot((snapshot) =>
  //           snapshot.docs.map((doc) => ({
  //             ...doc.data(), id: doc.id, display: true
  //           }))
  //         );
  //       } catch (error) {
  //         console.error('Error getting documents: ', error);
  //       }
  //     };

  //     const getAllUserTranscripts = async () => {
  //       const transcripts = await Promise.all(userProjects.map(project => getUserTranscripts(project.id)));
  //       setUserTranscripts(transcripts);
  //     };

  //     if (!userTranscripts && userProjects && userProjects.length > 0 ) {
  //       getAllUserTranscripts();
  //     }

  //     return () => {
  //     };
  //   }, [ userTranscripts, userProjects, props.firebase ]);

  let updatedSeconds = 'N/A';
  if (updated) {
    updatedSeconds = updated.seconds;
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
          {project.created.seconds}
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

UserRow.propTypes = {
  firebase: PropTypes.any,
  match: PropTypes.shape({
    params: PropTypes.shape({
      projectId: PropTypes.any
    })
  }),
  user: PropTypes.any
};

export default UserRow;
