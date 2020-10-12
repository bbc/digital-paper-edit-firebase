const removePunctuation = (text) => {
  return text.replace(/\.|\?|!|,|;/, '').toLowerCase() ;
};

export default removePunctuation;