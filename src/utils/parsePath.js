const getRepoPath = path =>
   `${path
      .split('/')
      .slice(0, 3)
      .join('/')}`
const getFilePath = path =>
   `${path
      .split('/')
      .slice(3)
      .join('/')}`

module.exports = {
   getRepoPath,
   getFilePath,
}
