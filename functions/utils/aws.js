const fetch = require('node-fetch');

const getSignedUrl = async (aws, fileName, durationSeconds) => {
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': aws.api.uploader.key,
  };

  const body = {
    serviceName: 'dpe',
    fileName: fileName,
    duration: durationSeconds,
  }

  const params = {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body),
  }

  const url = aws.api.uploader.endpoint;
  const response = await fetch(url, params);
  if (response.ok) {
    console.log(
      `[SUCCESS] got signed url: status ${response.status}`
    );
    const responseJson = await response.json();

    return responseJson.uploadUrl;
  } else {
    throw new Error(
      `Failed to get signed url: status ${res.status} - ${res.statusText}`
    );
  }
}
  
const uploadS3Stream = async (url, stream, size) => {
  console.log(`[START] Upload to S3: ${url}`);
  const headers = {
    "Content-length": size,
  };
  const params = {
    method: 'PUT',
    headers: headers,
    body: stream,
  }

  const response = await fetch(url, params);
  if (response.ok) {
    console.log(
      `[SUCCESS] File upload PUT request sent with status ${response.status}`
    );
    return true;
  } else {
    throw new Error(
      `Failed to upload to S3: status ${response.status} - ${response.statusText}`
    );
  }
}

exports.getSignedUrl = getSignedUrl;
exports.uploadS3Stream = uploadS3Stream;