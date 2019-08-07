const filesystem = require('./filesystem');

filesystem.displayFolders('./filesystem').then((response) => {
    console.log(response)
});