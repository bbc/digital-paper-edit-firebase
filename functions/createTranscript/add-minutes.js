// https://stackoverflow.com/questions/1197928/how-to-add-30-minutes-to-a-javascript-date-object
exports.addMinutes = (date, minutes) => {
  return new Date(date.getTime() + minutes * 60000);
};
