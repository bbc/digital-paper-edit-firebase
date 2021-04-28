import url from 'url';

const isProduction = () => {
  const parsedUrl = url.parse(window.location.href, true);

  return parsedUrl.host === 'digital-paper-edit.tools.bbc.co.uk';
};

export default isProduction;