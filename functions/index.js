const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { convertToAudio } = require("@bbc/convert-to-audio");

admin.initializeApp();
const express = require("express");
const cookieParser = require("cookie-parser")();
const cors = require("cors")({ origin: true });

const app = express();

// Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// when decoded successfully, the ID Token content will be added as `req.user`.
const validateFirebaseIdToken = async (req, res, next) => {
  console.log("Check if request is authorized with Firebase ID token");

  if (
    (!req.headers.authorization ||
      !req.headers.authorization.startsWith("Bearer ")) &&
    !(req.cookies && req.cookies.__session)
  ) {
    console.error(
      "No Firebase ID token was passed as a Bearer token in the Authorization header.",
      "Make sure you authorize your request by providing the following HTTP header:",
      "Authorization: Bearer <Firebase ID Token>",
      'or by passing a "__session" cookie.'
    );
    res.status(403).send("Unauthorized");
    return;
  }

  let idToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    console.log('Found "Authorization" header');
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split("Bearer ")[1];
  } else if (req.cookies) {
    console.log('Found "__session" cookie');
    // Read the ID Token from cookie.
    idToken = req.cookies.__session;
  } else {
    // No cookie
    res.status(403).send("Unauthorized");
    return;
  }

  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    console.log("ID Token correctly decoded", decodedIdToken);
    req.user = decodedIdToken;
    next();
    return;
  } catch (error) {
    console.error("Error while verifying Firebase ID token:", error);
    res.status(403).send("Unauthorized");
    return;
  }
};

app.use(cors);
app.use(cookieParser);
app.use(validateFirebaseIdToken);

app.get("/hello", (req, res) => {
  res.send(`Hello ${req.user.name}`);
});

app.post("/", (req, res) => {
  convert(req, res);
});

const convert = async (request, response) => {
  const payload = request.body;
  if (payload) {
    try {
      const audioFile = await convertToAudio(payload.input, payload.output);
      //   response.download(audioFile);
      var storageRef = firebase.storage().ref();
      var audioFileRef = storageRef.child(`audio/${payload.output}`);
      await audioFileRef.put(audioFile, {
        contentType: "audio/wav"
      });
      console.log("Uploaded file");
      const url = audioFileRef.getDownloadURL();

      response.send(url);
    } catch (err) {
      console.error(err);
      response.send(
        `There was a problem processing your audio file: 
          ${err}. Passed payload:${JSON.stringify(payload)}`
      );
    }
  } else {
    response.send("No URL given");
  }
};

// This HTTPS endpoint can only be accessed by your Firebase Users.
// Requests need to be authorized by providing an `Authorization` HTTP header
// with value `Bearer <Firebase ID Token>`.
exports.app = functions.https.onRequest(app);
