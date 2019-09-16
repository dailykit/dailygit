var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

function createNewFile(filepath, collectionName, data) {
  console.log(filepath, collectionName)
  MongoClient.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }, function (err, db) {
    if (err) throw err;
    var dbo = db.db("Filesystem");
    let insertObject = {
      path : filepath,
      data : data
    }
    console.log("About to show insert Object")
    console.log(insertObject)
    dbo.collection(collectionName).insertOne(insertObject,
      function (err, data) {
        if (err) {
          throw err;
        }
        console.log("file added")
        console.log(data)
        db.close();
      }
    );
  });
}

module.exports = {
  createNewFile
}