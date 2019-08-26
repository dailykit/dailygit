const { gql } = require('apollo-server-express')

const typeDefs = gql`
	union FolderOrFile = Folder | File
	type Folder {
		name: String
		path: String
		type: String
		size: Int
		createdAt: String
		children: [Folder]
	}
	type FolderWithFiles {
		name: String
		path: String
		type: String
		size: Int
		createdAt: String
		content: String
		children: [FolderWithFiles]
	}
	type File {
		name: String
		path: String
		type: String
		content: String
		size: Int
		createdAt: String
	}
	type Commit {
		sha: String
		message: String
		time: String
	}
	type Query {
		getFolderWithFiles(path: String): FolderWithFiles
		getNestedFolders(path: String): Folder
		getFile(path: String!): File
		getCommitLog: [Commit]
	}
`

module.exports = typeDefs
