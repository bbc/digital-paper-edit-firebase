import React, { useEffect, useState } from 'react';
import { MatomoProvider, createInstance } from '@datapunt/matomo-tracker-react';
import { useMatomo } from '@datapunt/matomo-tracker-react';
import PropTypes from 'prop-types';
import isProduction from '../../Util/is-production';

const prodConfig = {
  urlBase: process.env.REACT_APP_MATOMO_BASE,
  siteId: process.env.REACT_APP_MATOMO_SITEID,
  trackerUrl: process.env.REACT_APP_MATOMO_TRACKER, // optional, default value: `${urlBase}matomo.php`
  srcUrl: process.env.REACT_APP_MATOMO_SRC // optional, default value: `${urlBase}matomo.js`
};

const devConfig = {
  urlBase: process.env.REACT_APP_TEST_MATOMO_BASE,
  siteId: process.env.REACT_APP_TEST_MATOMO_SITEID,
  trackerUrl: process.env.REACT_APP_TEST_MATOMO_TRACKER, // optional, default value: `${urlBase}matomo.php`
  srcUrl: process.env.REACT_APP_TEST_MATOMO_SRC, // optional, default value: `${urlBase}matomo.js`
};

const config = isProduction() ? prodConfig : devConfig;

const instance = createInstance(config);

const AnalyticsProvider = props => (
  <MatomoProvider value={ instance }>
    {props.children}
  </MatomoProvider>
);

export const withAnalytics = Component => {
  const WithAnalytics = props => {
    const { trackPageView, trackEvent, pushInstruction } = useMatomo();
    // Track page view

    const [ customDimensions, setCustomDimensions ] = useState([]);

    const setAnalyticsUserId = (uid) => {
      pushInstruction('setUserId', uid);
    };

    useEffect(() => {
      const getCustomDimensions = () => {
        setCustomDimensions(
          Object.entries(props.match).map(([ k, v ]) => ({ 'id': k, 'value': v }))
        );
      };

      if (props.match) {
        getCustomDimensions();
      }

      return () => {
        setCustomDimensions([]);
      };
    }, [ props.match ]);

    useEffect(() => {
      trackPageView(
        {
          href: props.location.pathname,
          customDimensions: customDimensions
        }
      );
    }, [ customDimensions, props.location.pathname, trackPageView ]);

    return (<Component { ...props } setAnalyticsUserId={ setAnalyticsUserId } trackPageView={ trackPageView } trackEvent={ trackEvent } />);
  };
  WithAnalytics.propTypes = {
    location: PropTypes.any,
    match: PropTypes.shape({
      params: PropTypes.shape({
        projectId: PropTypes.any
      })
    }),
  };

  return WithAnalytics;

};

export default AnalyticsProvider;

AnalyticsProvider.propTypes = {
  children: PropTypes.any
};