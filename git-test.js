let gitcommit = require('./git-add-and-commit');

gitcommit.CommitFile('./filesystem/Recipes/Anardana Raita.json', 'nice message')
.then(response => {
        console.log(response);
})
