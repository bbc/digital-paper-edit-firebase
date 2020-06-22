import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import Button from 'react-bootstrap/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import React from 'react';

const HelpOverlayTrigger = () => {
  const popover = (
    <Popover id="popover-basic">
      <Popover.Title as="h3">Need Help?</Popover.Title>
      <Popover.Content>
        See the{' '}
        <a
          href={ 'https://autoedit.gitbook.io/autoedit-3-user-manual/' }
          target={ '_blank' }
          rel="noopener noreferrer"
        >
          User manual.
        </a>
        <br />
        This is a <strong>slightly different version</strong> of the Digital
        Paper Edit, but the general workflows should be the same.
        Should you require login details, or more assistance,{' '}
        <a href="mailto:dpe@bbcnewslabs.co.uk">get in touch with Newslabs</a>!
      </Popover.Content>
    </Popover>
  );

  return (
    <OverlayTrigger trigger="click" placement="bottom" overlay={ popover }>
      <Button variant="success">
        <FontAwesomeIcon icon={ faQuestionCircle } /> Help
      </Button>
    </OverlayTrigger>
  );
};

export default HelpOverlayTrigger;
