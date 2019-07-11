const redis = require('redis');

const client = redis.createClient();

client.on('error', (err) => {
  // eslint-disable-next-line prefer-template
  console.log('Error' + err);
});

function addToList(filename) {
  // adding key to list of files
  client.sadd(['files', filename], (err, reply) => {
    console.log(reply);
  });
}

function getAllFiles() {
  // Getting all the files in the list
  client.smembers('files', (err, reply) => {
    console.log(reply);
  });
}

function removeFromList(filename) {
  client.srem(['files', filename], (err, reply) => {
    console.log(reply);
  });
}

module.exports = {
  addToList,
  getAllFiles,
  removeFromList,
};
