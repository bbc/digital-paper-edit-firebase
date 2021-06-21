import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import Button from 'react-bootstrap/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import React from 'react';
import { useMatomo } from '@datapunt/matomo-tracker-react';

const HelpOverlayTrigger = () => {
  const { trackEvent } = useMatomo();
  const popover = (
    <Popover id="popover-basic">
      <Popover.Title as="h3">Need Help?</Popover.Title>
      <Popover.Content>
        See the{' '}
        <a
          href={ 'https://autoedit.gitbook.io/autoedit-3-user-manual/' }
          target={ '_blank' }
          rel="noopener noreferrer"
          onClick={ () => trackEvent({ category: 'global - help dropdown', action: 'click', name: 'view user manual' }) }
        >
          User manual.
        </a>
        <br />
        This is a <strong>slightly different version</strong> of the Digital
        Paper Edit, but the general workflows should be the same.
        Should you require login details, or more assistance,{' '}
        <a
          href="mailto:dpe@bbcnewslabs.co.uk"
          onClick={ () => trackEvent({ category: 'global - help dropdown', action: 'click', name: 'get in touch with news labs' }) }
        >
          get in touch with Newslabs
        </a>!
      </Popover.Content>
    </Popover>
  );

  return (
    <OverlayTrigger trigger="click" placement="bottom" overlay={ popover }>
      <Button variant="success" onClick={ () => trackEvent({ category: 'global', action: 'click', name: 'help' }) }>
        <FontAwesomeIcon icon={ faQuestionCircle } /> Help
      </Button>
    </OverlayTrigger>
  );
};

export default HelpOverlayTrigger;
