import url from 'url';

const isProduction = () => {
  const parsedUrl = url.parse(window.location.href, true);

  return parsedUrl.host === 'digital-paper-edit.tools.bbc.co.uk' || parsedUrl.host === 'digital-paper-edit-prod.firebaseapp.com';
};

export default isProduction;