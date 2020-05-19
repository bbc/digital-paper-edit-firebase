import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import StoryRouter from 'storybook-react-router';
import ExportFormModal from '../index.js';
import { exportItems } from '../../dummy';

storiesOf('Export Form Modal', module)
  .addDecorator(StoryRouter())
  .add('Export EDL', () => {
    return (
      <section style={ { height: '90vh', overflow: 'scroll' } }>
        <ExportFormModal
          handleSaveForm={ action('Form saved') }
          handleOnHide={ action('Close modal') }
          { ...exportItems[0] }
        />
      </section>
    );
  })
  .add('Export ADL', () => {
    return (
      <section style={ { height: '90vh', overflow: 'scroll' } }>
        <ExportFormModal
          handleSaveForm={ action('Form saved') }
          handleOnHide={ action('Close modal') }
          { ...exportItems[1] }
        />
      </section>
    );
  })
  .add('Export FCP XML', () => {
    return (
      <section style={ { height: '90vh', overflow: 'scroll' } }>
        <ExportFormModal
          handleSaveForm={ action('Form saved') }
          handleOnHide={ action('Close modal') }
          { ...exportItems[2] }
        />
      </section>
    );
  })
  .add('Empty Modal without Items', () => {
    return (
      <section style={ { height: '90vh', overflow: 'scroll' } }>
        <ExportFormModal
          handleSaveForm={ action('Form saved') }
          handleOnHide={ action('Close modal') }
          { ...exportItems[4] }
        />
      </section>
    );
  })
  .add('Empty Modal with Items', () => {
    return (
      <section style={ { height: '90vh', overflow: 'scroll' } }>
        <ExportFormModal
          handleSaveForm={ action('Form saved') }
          handleOnHide={ action('Close modal') }
          { ...exportItems[5] }
        />
      </section>
    );
  })
  .add('Closed Modal', () => {
    return (
      <section style={ { height: '90vh', overflow: 'scroll' } }>
        <ExportFormModal
          handleSaveForm={ action('Form saved') }
          handleOnHide={ action('Close modal') }
          { ...exportItems[3] }
        />
      </section>
    );
  });
