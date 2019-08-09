const { gql } = require('apollo-server-express')

const typeDefs = gql`
	"Schema for all files/folders"
	type Content {
		"Name of the folder/file"
		name: String
		"Relative path of the folder/file"
		path: String
		"Type of item, either folder or file"
		type: String
		"Size of the file, folder size not supported yet."
		size: Int
		"Array of nested folders/files"
		children: [Content]
	}
	"Schema for only fetching list of folders"
	type Folder {
		"Name of the folder"
		name: String
		"Relative path of the folder"
		path: String
		"Type is set to folder by default"
		type: String
		"Return list of nested folders"
		children: [Folder]
	}
	type Query {
		"Query to fetch all the nested folders/files"
		content: Content
		"Query to fetch all the nested folders"
		folders: Folder
	}
`

module.exports = typeDefs
