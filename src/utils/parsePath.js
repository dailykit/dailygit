const baseFolder = './../apps/'

const getRepoPath = givenPath =>
	givenPath
		.split(baseFolder)
		.filter(Boolean)[0]
		.split('/')
		.slice(0, 3)
		.join('/')

const getRelFilePath = givenPath =>
	givenPath
		.split(baseFolder)
		.filter(Boolean)[0]
		.split('/')
		.slice(3)
		.join('/')

module.exports = {
	getRelFilePath,
	getRepoPath,
}
