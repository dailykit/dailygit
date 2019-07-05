const util = require('util');

const testFolder = 'mychatwidget';
const fs = require('fs');

const readdir = util.promisify(fs.readdir, (resolve, reject) => {
  resolve('ok');
});

async function displayData(testFolder) {
  try {
    let data = await readdir(testFolder)//, (err, files) => {
    let intermediateData = data.map(async (file) => {
      let returnObject = {};
      returnObject.value = file;
      returnObject.id = testFolder + '/' + file;
	returnObject.data = await getFile(testFolder + '/' + file);
      let filenamearray = file.split('');
      if (filenamearray[0] !== '.' && file !== 'node_modules') {
        if (fs.lstatSync(testFolder + '/' + file).isDirectory()) {
          let functionResponse = await displayData(testFolder + '/' + file);
          returnObject.data = functionResponse;
          returnObject.type = 'folder';
          return returnObject;
        } else {
          returnObject.type = 'text';
          return returnObject;

        }
      }
      else
	returnObject.type = 'text';
      return returnObject;
    });
    return Promise.all(intermediateData).then(result => result)
  } catch (e) {
    console.log(e);
  }
};

function getFile(filePath) {
  return new Promise((resolve, reject) => {
//    console.log(filePath)
    let modifiedPath = '/' + filePath.split('./')[1];
    var path = process.cwd();
    try {
    var buffer = fs.readFile(path + modifiedPath , (err, data) => {
      if (err)  {
      resolve({'status' : "fail"})
      } else {
      // console.log(data);
      resolve(data.toString());
      }
    });
  }
  catch (err) {
    resolve({'status' : 'fail'});
  }
  })
}

module.exports = {
  getFile: getFile,
  displayData: displayData
}

