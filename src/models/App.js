const mongoose = require('mongoose')
const Schema = mongoose.Schema

const appSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
		},
		status: {
			type: String,
			required: true,
		},
		dependents: [
			{
				type: Schema.Types.ObjectId,
				ref: 'apps',
			},
		],
		entities: [String],
	},
	{ timestamps: true }
)

const App = mongoose.model('apps', appSchema)

module.exports = App
