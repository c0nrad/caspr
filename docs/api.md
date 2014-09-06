# API

On the backend caspr has a restful API service for interacting with all the stored reports.

Resources

- Projects
	POST /api/projects
		Creates a new project
		name: String, name of your project

	GET /api/projects
		Returns a list of all projects

	GET /api/projects/:hash
		Returns an individual projects

	DELETE /api/projects/:hash
		Deletes a project, along with all associates reports and filters

- Reports
	GET /api/projects/:hash/reports
		Returns a json list of reports
		startDate: Date/Number, specify start range for reports
		endDate: Date/Number, specify end range for reports
		limit: limit the number of reports

	DELETE /api/projects/:hash/reports
		Delete all reports belonging to the project

- Groups
	GET /api/projects/:hash/groups
		Returns reports aggregated into buckets of similar reports. Report dates will also be bucketed into bins
		lots of params

	GET /api/projects/:hash/groups/:report
		Groups all reports related to a report

- Filter
	GET /api/projects/:hash/filters

	GET /api/projects/:hash/filters/:filter

	/stats
	POST /clear
	POST /
	PUT /
	DELETE /

	BACKUP -> DUMP

- Backups
- Groups
	/project
- Filters

