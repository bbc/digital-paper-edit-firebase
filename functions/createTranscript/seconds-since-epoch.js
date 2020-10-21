// https://stackoverflow.com/questions/1197928/how-to-add-30-minutes-to-a-javascript-date-object
// time of expiration expressed in epoch seconds
// Epoch, also known as Unix timestamps, is the number of seconds (not milliseconds!) that have elapsed since January 1, 1970 at 00:00:00 GMT
exports.getSecondsSinceEpoch = date => {
  return Math.round(date.getTime() / 1000);
};
