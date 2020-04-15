const test = require("firebase-functions-test")(
  {
    databaseURL: "https://newslabs-dev-aa20.firebaseio.com",
    storageBucket: "dev-digital-paper-edit",
    projectId: "newslabs-dev-aa20",
  },
  "gcp-credentials.json"
);
const fetchMock = require("fetch-mock");

// Mock functions config values
const mockConfig = {
  aws: {
    bucket: {
      name: "stt-bucket",
      region: "eu-west-1",
      key: "awsKey",
      secret: "awsSecret",
    },
    api: {
      key: "apiKey",
      schedule: "every 60 minutes",
      endpoint: "https://123456.execute-api.eu-west-1.amazonaws.com/test",
    },
  },
  storage: {
    bucket: "dev-digital-paper-edit",
  },
};

test.mockConfig(mockConfig);
fetchMock.mock("https://123456.execute-api.eu-west-1.amazonaws.com/test", 200);
const myFunctions = require("../index.js");

const wrapped = test.wrap(myFunctions.cronSTTJobChecker);
// TODO call wrapped
