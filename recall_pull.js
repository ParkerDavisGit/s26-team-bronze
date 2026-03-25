const https = require('https');
const prisma = require('../db'); 

const options = {
  hostname: 'api.fda.gov',
  path: '/food/enforcement.json?search=report_date:[20040101+TO+20131231]',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
};

const getPosts = () => {
  let data = '';

  const request = https.request(options, (response) => {
    response.setEncoding('utf8');
    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      console.log(data);
    });
  });

  request.on('error', (error) => {
    console.error(error);
  });

  request.end();
};

//getPosts();