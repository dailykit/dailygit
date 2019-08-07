var nodegit = require("nodegit");

// This code shows working directory changes similar to git status

function gitStatus () {
return new Promise((resolve, reject) => {
nodegit.Repository.open('../filesystem')
  .then(function(repo) {
    repo.getStatus().then(function(statuses) {
      function statusToText(status) {
        var words = [];
        if (status.isNew()) { words.push("NEW"); }
        if (status.isModified()) { words.push("MODIFIED"); }
        if (status.isTypechange()) { words.push("TYPECHANGE"); }
        if (status.isRenamed()) { words.push("RENAMED"); }
        if (status.isIgnored()) { words.push("IGNORED"); }

        return words.join(" ");
      }
	let returnedFilesList = [];
      returnedFilesList = statuses.map(function(file) {
	return ('./filesystem/'+file.path());
//        console.log(file.path()) // + " " + statusToText(file));
      });
	//console.log(returnedFilesList);
	resolve({returnedFilesList});
    });
});

});
}

module.exports = {
	gitStatus : gitStatus,
}
