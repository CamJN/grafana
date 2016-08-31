# Table Panel - Extended

This plugin is based on the native table plugin for grafana, but extends
it with new features.

## New Features

- Allow creation of a custom 2D table where the data in each cell comes from
  an arbitrary query.
- Allow color coding the table using a gradient instead of a threshold.

## Building

To build this plugin so that it can be used with grafana...

1. [Install grunt](http://gruntjs.com/getting-started) from the npm package manager
2. Change to the project's root directory
3. Install project dependencies with ```npm install```
4. Run Grunt with ```grunt```

The source directory should then have the correct structure to be installed
as a grafana plugin. The dist/ directory will contain the built project
sources.

## Original Table Plugin Readme Text

The Table Panel is **included** with Grafana.

The table panel is very flexible, supporting both multiple modes for time series as well as for table, annotation and raw JSON data. It also provides date formatting and value formatting and coloring options.

Check out the [Table Panel Showcase in the Grafana Playground](http://play.grafana.org/dashboard/db/table-panel-showcase) or read more about it here:

[http://docs.grafana.org/reference/table_panel/](http://docs.grafana.org/reference/table_panel/)
