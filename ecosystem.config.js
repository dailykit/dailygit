module.exports = {
	apps: [
		{
			name: 'filesystem',
			script: './src/index.js',
			watch: true,
			env_development: {
				PORT: 4000,
				NODE_ENV: 'development',
			},
			env_production: {
				PORT:
					'http://ec2-13-59-178-203.us-east-2.compute.amazonaws.com:4000/',
				NODE_ENV: 'production',
			},
		},
	],
}
