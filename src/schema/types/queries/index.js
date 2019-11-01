const { gql } = require('apollo-server-express')

const typeDefs = gql`
	type Query {
		getFolderWithFiles(path: String): FolderWithFiles
		getNestedFolders(path: String): Folder
		getFile(path: String!): File
		searchFiles(fileName: String!): String
		getCommitLog(path: String!): [Commit]
		getCommits(path: String!, commits: [String]!): [Commit]
		getCommit(id: String!, path: String!): Commit
		getCommitContent(id: String!, path: String!): String
		showFilesInBranch(
			branchName: String!
			appName: String!
			entity: String!
		): FolderWithFiles
		openFile(path: String!): File
	}
`

module.exports = typeDefs
