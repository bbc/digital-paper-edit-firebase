const getISOTime = (sec) => {
  const date = new Date(0);
  date.setUTCSeconds(sec);

  return date.toISOString();
};

export default getISOTime;