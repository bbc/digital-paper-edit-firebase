import React, { useEffect, useState } from 'react';
import { MatomoProvider, createInstance } from '@datapunt/matomo-tracker-react';
import { useMatomo } from '@datapunt/matomo-tracker-react';

const instance = createInstance({
  urlBase: process.env.REACT_APP_MATOMO_BASE,
  siteId: process.env.REACT_APP_MATOMO_SITEID,
  trackerUrl: process.env.REACT_APP_MATOMO_TRACKER, // optional, default value: `${urlBase}matomo.php`
  srcUrl: process.env.REACT_APP_MATOMO_SRC, // optional, default value: `${urlBase}matomo.js`
});

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
    }, []);

    return (<Component { ...props } setAnalyticsUserId={ setAnalyticsUserId } trackPageView={ trackPageView } trackEvent={ trackEvent } />);
  };

  return WithAnalytics;

};

export default AnalyticsProvider;
