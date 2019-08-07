let allFiles = require('./allFilesData');

allFiles.displayData('./filesystem')
.then(response => {
        console.log(response);
})



