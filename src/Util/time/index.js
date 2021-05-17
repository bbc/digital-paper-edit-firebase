const updateDescOrder = (firstTr, secondTr) => {
  const firstUpdated = firstTr.updated ? firstTr.updated : { seconds: 0 };
  const secondUpdated = secondTr.updated ? secondTr.updated : { seconds: 0 };

  return secondUpdated.seconds - firstUpdated.seconds;
};

const secondsToDhms = (sec) => {
  const seconds = Number(sec);
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  return [ d, h, m, s ];
};

const ToHumanReadable = (sec) => {
  const [ d, h, m, s ] = secondsToDhms(sec);

  const dDisplay = d > 0 ? d + (d === 1 ? ' day' : ' days') : '';
  const hDisplay = h > 0 ? h + (h === 1 ? ' hour' : ' hours') : '';
  const mDisplay = m > 0 ? m + (m === 1 ? ' minute' : ' minutes') : '';
  const sDisplay = s > 0 ? s + (s === 1 ? ' second' : ' seconds') : '';

  return [ dDisplay, hDisplay, mDisplay, sDisplay ].filter(display => display).join(', ');
};

const ToDhmsCompact = (sec) => {
  const dhms = secondsToDhms(sec);

  return dhms.map(display => (display < 10 ? '0' + display : display)).join(':');

};
const getISOTime = (sec) => {
  const date = new Date(0);
  date.setUTCSeconds(sec);

  return date.toISOString();
};

const getISODay = (time) => {
  return getISOTime(time.seconds).split('T')[0];
};

const getISOHour = (time) => {
  return getISOTime(time.seconds).split('T')[1].replace('.000Z', '');
};

const formatDates = (item) => {
  const created = item.created ? `${ getISODay(item.created) },  ${ getISOHour(item.created) }` : 0;
  const updated = item.updated ? `${ getISODay(item.created) },  ${ getISOHour(item.created) }` : 0;

  return { created, updated };

};

const formatDuration = async (duration) => {
  const seconds = Number(duration);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const mDisplay = m > 0 ? m + (m === 1 ? ' min ' : ' mins ') : '';
  const sDisplay = s > 0 ? s + (s === 1 ? ' s' : ' s') : '';

  return mDisplay + sDisplay;
};

export { ToHumanReadable, ToDhmsCompact, getISOTime, updateDescOrder, formatDates, formatDuration };
