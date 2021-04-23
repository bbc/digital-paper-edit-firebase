import url from 'url';

const isProduction = () => {
  const parsedUrl = url.parse(window.location.href, true);

  if ((parsedUrl.host) === 'digital-paper-edit.tools.bbc.co.uk') {
    return true;
  }

  return false;

};

export default isProduction;