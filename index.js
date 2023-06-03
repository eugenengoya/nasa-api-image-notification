'use strict';

const axios = require("axios");
const https = require('https');
const twilio = require('twilio');

module.exports.handler = async (event) => {
  const {
    NASA_API_KEY,
    ALERTY_API_KEY,
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_FROM_NUMBER,
    TWILIO_TO_NUMBER
  } = process.env;

  try {
    const response = await axios.get(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`);
    const imageData = response.data;
    const data = JSON.stringify({
      title: imageData.title,
      message: imageData.explanation
    });

    const options = {
      hostname: 'alerty.dev',
      port: 443,
      path: '/api/notify',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ALERTY_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, res => {
      console.log(`statusCode: ${res.statusCode}`);
      res.on('data', d => {
        process.stdout.write(d);
      });
    });

    req.on('error', error => {
      console.error(error);
    });
    req.write(data);
    req.end();

    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const message = await client.messages.create({
      from: TWILIO_FROM_NUMBER,
      to: TWILIO_TO_NUMBER,
      body: `${imageData.title}
      
      ${imageData.explanation}
      `,
      mediaUrl: `${imageData.hdurl}`
    });

    console.log(`Message sent: ${message.sid}`);

  } catch (error) {
    console.error(error);
  }
};
