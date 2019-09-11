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

	type Author {
		name: String
		email: String
		timestamp: String
	}

	type Committer {
		name: String
		email: String
		timestamp: String
	}

	type Commit {
		oid: String
		message: String
		tree: String
		parent: [String]
		author: Author
		committer: Committer
	}
	type SearchFilesList {
		menus: [String]
		packages: [String]
		ingredients: [String]
		recipes: [String]
		dishes: [String]
	}
	type Query {
		getFolderWithFiles(path: String): FolderWithFiles
		getNestedFolders(path: String): Folder
		getFile(path: String!): File
		searchFiles(path: String!): SearchFilesList
		getCommitLog: [Commit]
		getCommit(id: String!): Commit
	}
`

module.exports = typeDefs
