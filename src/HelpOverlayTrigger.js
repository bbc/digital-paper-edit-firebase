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
        <p>Please see the{' '}
          <a
            href={ 'https://paper.dropbox.com/doc/Digital-Paper-Edit-User-Manual--BMXxp_dqg0AaKdCsMYh9ZI~jAg-wd9c7c4Du0etP4m6tp3VD' }
            target={ '_blank' }
            rel="noopener noreferrer"
            onClick={ () => trackEvent({ category: 'global - help dropdown', action: 'click', name: 'get in touch with news labs' }) }
          >
            Digital Paper Edit user manual</a>. This has guides and how-tos to help you use the tool.
        </p>
        <p>
          Should you require login details, {' '}
          <a href="mailto:dpe@bbcnewslabs.co.uk">get in touch with News Labs</a>!
        </p>
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
