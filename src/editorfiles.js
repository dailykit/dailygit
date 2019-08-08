const redis = require('redis');

const client = redis.createClient();

client.on('error', (err) => {
  // eslint-disable-next-line prefer-template
  console.log('Error' + err);
});

function addToList(filename) {
  return new Promise((resolve, reject) => {
    // adding key to list of files
    client.sadd(['files', filename], (err, reply) => {
      console.log(reply);
      resolve(reply);
    });
  });
}

function getAllFiles() {
  return new Promise((resolve, reject) => {
    // Getting all the files in the list
    client.smembers('files', (err, reply) => {
      console.log(reply);
      resolve(reply);
      client.quit();
    });
  });
}

// Removing the file from the list
function removeFromList(filename) {
  return new Promise((resolve, reject) => {
    client.srem(['files', filename], (err, reply) => {
      console.log(reply);
      resolve(reply);
      client.quit();
    });
  });
}

module.exports = {
  addToList,
  getAllFiles,
  removeFromList,
};
