const editorFiles = require('./editorfiles');

// editorFiles.getAllFiles().then((response) => {
//   console.log(response);
// });

editorFiles.removeFromList('cool').then((response) => {
  console.log(response);
});
