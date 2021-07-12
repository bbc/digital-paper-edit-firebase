const updateDescOrder = (firstTr, secondTr) => {
  const firstUpdated = firstTr.updated ? firstTr.updated : { seconds: 0 };
  const secondUpdated = secondTr.updated ? secondTr.updated : { seconds: 0 };

  return secondUpdated.seconds - firstUpdated.seconds;
};

const secondsToDhms = (sec) => {
  const seconds = Number(sec);
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  return [ h, m, s ];
};

const ToHumanReadable = (sec) => {
  const [ h, m, s ] = secondsToDhms(sec);

  const hDisplay = h > 0 ? h + (h === 1 ? ' hr' : ' hrs') : '';
  const mDisplay = m > 0 ? m + (m === 1 ? ' min' : ' mins') : '';
  const sDisplay = s > 0 ? s + ' s' : '';

  return [ hDisplay, mDisplay, sDisplay ].filter(display => display).join(', ');
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

export { ToHumanReadable, ToDhmsCompact, getISOTime, updateDescOrder, formatDates };
