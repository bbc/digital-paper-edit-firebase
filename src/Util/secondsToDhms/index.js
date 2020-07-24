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

export { ToHumanReadable, ToDhmsCompact };
