const { gql } = require('apollo-server-express')

const typeDefs = gql`
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
		commits: [String]
		lastSaved: String
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
		message: String
		tree: String
		parent: [String]
		author: Author
		committer: Committer
	}
	union Result = Success | Error
	type Success {
		success: Boolean
		message: String
	}
	type Error {
		success: Boolean
		error: String
	}
	scalar Upload
	type Image {
		filename: String!
		mimetype: String!
		encoding: String!
	}
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
	}
`

module.exports = typeDefs
