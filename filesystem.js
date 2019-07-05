const util = require('util');

// import {promisify} from 'util';
// const {promisify} = require('util');
const testFolder = 'mychatwidget';
const fs = require('fs');
// const readdir = util.promisify(fs.readdir);
require("babel-polyfill");

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
  // })

};

function getFile(filePath) {
  return new Promise((resolve, reject) => {
    console.log(filePath)
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

function updateFile(body) {
  return new Promise((resolve, reject) => {
    let filePath = body.file;
    let data = body.data;
    console.log(body)
    console.log(filePath)
    let modifiedPath = '/' + filePath.split('./')[1];
    var path = process.cwd();
    console.log(modifiedPath);
    console.log(path + modifiedPath)
    fs.writeFileSync(path + modifiedPath, data, function (err) {
      if (err) {
        return console.log(err);
      }

      console.log("The file was saved!");
    });
    resolve({ 'status': 'success' });
  })
}

function createNewFile(body) {
  return new Promise((resolve, reject) => {
    let filePath = body.file;
    let objectType = body.objectType;
    console.log(objectType)
    console.log(filePath)
    let newFilePath = '/' + filePath.split('./')[1];
    var path = process.cwd(); // gives current working directory
    console.log(newFilePath);
    console.log(path + newFilePath);

    let sourceFilePath = path+'/templates/'+objectType+'.json'
//    let extension;
//    if(objectType == 'recipes') {
//      extension = '.rec';
//    }
    let destinationFilePath = path+newFilePath;// +extension;
    fs.copyFile(sourceFilePath, destinationFilePath, (err) => {
      if (err) {
        reject({'status' : 'file could not be created'})
      } else {
        //getFile(sourceFilePath)
        // console.log('source.txt was copied to destination.txt');
        resolve({ 'status': 'Success! file created' });
      }
    });
  })
}

module.exports = {
  getFile: getFile,
  displayData: displayData,
  updateFile: updateFile,
   createNewFile: createNewFile,
}
