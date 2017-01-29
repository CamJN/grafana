///<reference path="../../../../headers/common.d.ts" />

import _ from 'lodash';
import moment from 'moment';
import flatten from 'app/core/utils/flatten';
import TimeSeries from 'app/core/time_series2';
import TableModel from 'app/core/table_model';

var transformers = {};

transformers['timeseries_to_rows'] = {
  description: 'Time series to rows',
  prep_panel: function(panel) {
    panel.en_sort_toggle = true;
    panel.en_column_names = false;
    panel.en_row_names = false;
    panel.en_data_funcs  = false;
  },
  getColumns: function() {
    return [];
  },
  transform: function(data, panel, model) {
    model.columns = [
      {text: 'Time', type: 'date'},
      {text: 'Metric'},
      {text: 'Value'},
    ];

    for (var i = 0; i < data.length; i++) {
      var series = data[i];
      for (var y = 0; y < series.datapoints.length; y++) {
        var dp = series.datapoints[y];
        model.rows.push([dp[1], series.target, dp[0]]);
      }
    }
  },
};

transformers['timeseries_to_columns'] = {
  description: 'Time series to columns',
  prep_panel: function(panel) {
    panel.en_sort_toggle = true;
    panel.en_column_names = false;
    panel.en_row_names = false;
    panel.en_data_funcs  = false;
  },
  getColumns: function() {
    return [];
  },
  transform: function(data, panel, model) {
    model.columns.push({text: 'Time', type: 'date'});

    // group by time
    var points = {};

    for (var i = 0; i < data.length; i++) {
      var series = data[i];
      model.columns.push({text: series.target});

      for (var y = 0; y < series.datapoints.length; y++) {
        var dp = series.datapoints[y];
        var timeKey = dp[1].toString();

        if (!points[timeKey]) {
          points[timeKey] = {time: dp[1]};
          points[timeKey][i] = dp[0];
        } else {
          points[timeKey][i] = dp[0];
        }
      }
    }

    for (var time in points) {
      var point = points[time];
      var values = [point.time];

      for (var i = 0; i < data.length; i++) {
        var value = point[i];
        values.push(value);
      }

      model.rows.push(values);
    }
  }
};

transformers['timeseries_aggregations'] = {
  description: 'Time series aggregations',
  prep_panel: function(panel) {
    panel.en_sort_toggle = true;
    panel.en_column_names = false;
    panel.en_row_names = false;
    panel.en_data_funcs  = false;
  },
  getColumns: function() {
    return [
      {text: 'Avg', value: 'avg'},
      {text: 'Min', value: 'min'},
      {text: 'Max', value: 'max'},
      {text: 'Total', value: 'total'},
      {text: 'Current', value: 'current'},
      {text: 'Count', value: 'count'},
    ];
  },
  transform: function(data, panel, model) {
    var i, y;
    model.columns.push({text: 'Metric'});

    if (panel.column_heads.length === 0) {
      panel.column_heads.push({text: 'Avg', value: 'avg'});
    }

    for (i = 0; i < panel.column_heads.length; i++) {
      model.columns.push({text: panel.column_heads[i].text});
    }

    for (i = 0; i < data.length; i++) {
      var series = new TimeSeries({
        datapoints: data[i].datapoints,
        alias: data[i].target,
      });

      series.getFlotPairs('connected');
      var cells = [series.alias];

      for (y = 0; y < panel.column_heads.length; y++) {
        cells.push(series.stats[panel.column_heads[y].value]);
      }

      model.rows.push(cells);
    }
  }
};

transformers['data'] = {
  description: 'Data',
  data_function_list: [
      {text: 'Avg', value: 'avg'},
      {text: 'Min', value: 'min'},
      {text: 'Max', value: 'max'},
      {text: 'Total', value: 'total'},
      {text: 'Current', value: 'current'},
      {text: 'Count', value: 'count'}
  ],
  prep_panel: function(panel) {
    panel.en_sort_toggle = false;
    panel.en_data_funcs  = true;
    panel.sort.col  = null;
    panel.sort.desc = true;
    panel.en_column_names = true;
    panel.en_row_names = true;
  },
  getColumns: function(data) {
    var data_names = [{text: 'EMPTY', value: 'EMPTY'}];
    var i;
    for (i = 0; i < data.length; i++) {
      data_names.push({text: data[i].target, value: data[i].target});
    }
    return data_names;
  },
  transform: function(data, panel, model) {
    var x;
    var y;

    var data_function = panel.data_function;

    var row_len = function(row){return row.columns.length;};
    var height  = panel.rows.length;
    var width   = _.max(panel.rows, row_len).columns.length;

    for (x = 0; x < width; x++) {
      var text;
      if (x < panel.column_names.length) {
        text = panel.column_names[x];
      } else if (x < panel.column_heads.length) {
        text = panel.column_heads[x].text;
      } else {
        text = "NO NAME";
      }
      model.columns.push({text: text});
    }

    for (y = 0; y < height; y++) {
      var model_row = [];
      var row = panel.rows[y];
      for (x = 0; x < width; x++) {
          if (x >= row_len(row)) {
            model_row.push(void(0));
          } else if (row.columns[x].text === 'EMPTY') {
            model_row.push(void(0));
          } else {
            var text   = row.columns[x].text;
            var target = _.find(data, function(d){return d.target === text;});

            if (typeof(target) === "undefined") {
                model_row.push(null);
            } else {
                var series = new TimeSeries({
                    datapoints: target.datapoints,
                    alias: target.target,
                });
                series.getFlotPairs('connected');
                model_row.push(series.stats[data_function]);
            }
          }
      }
      model.rows.push(model_row);
      model.row_names.push(row.name);
    }
  }
};

transformers['annotations'] = {
  description: 'Annotations',
  prep_panel: function(panel) {
    panel.en_sort_toggle = true;
    panel.en_column_names = false;
    panel.en_row_names = false;
    panel.en_data_funcs  = false;
  },
  getColumns: function() {
    return [];
  },
  transform: function(data, panel, model) {
    model.columns.push({text: 'Time', type: 'date'});
    model.columns.push({text: 'Title'});
    model.columns.push({text: 'Text'});
    model.columns.push({text: 'Tags'});

    if (!data || !data.annotations || data.annotations.length === 0) {
      return;
    }

    for (var i = 0; i < data.annotations.length; i++) {
      var evt = data.annotations[i];
      model.rows.push([evt.min, evt.title, evt.text, evt.tags]);
    }
  }
};

transformers['table'] = {
  description: 'Table',
  prep_panel: function(panel) {
    panel.en_sort_toggle = true;
    panel.en_column_names = false;
    panel.en_row_names = false;
    panel.en_data_funcs  = false;
  },
  getColumns: function(data) {
    if (!data || data.length === 0) {
      return [];
    }
  },
  transform: function(data, panel, model) {
    if (!data || data.length === 0) {
      return;
    }

    if (data[0].type !== 'table') {
      throw {message: 'Query result is not in table format, try using another transform.'};
    }

    model.columns = data[0].columns;
    model.rows = data[0].rows;
  }
};

transformers['json'] = {
  description: 'JSON Data',
  prep_panel: function(panel) {
    panel.en_sort_toggle = true;
    panel.en_column_names = false;
    panel.en_row_names = false;
    panel.en_data_funcs  = false;
  },
  getColumns: function(data) {
    if (!data || data.length === 0) {
      return [];
    }

    var names: any = {};
    for (var i = 0; i < data.length; i++) {
      var series = data[i];
      if (series.type !== 'docs') {
        continue;
      }

      // only look at 100 docs
      var maxDocs = Math.min(series.datapoints.length, 100);
      for (var y = 0; y < maxDocs; y++) {
        var doc = series.datapoints[y];
        var flattened = flatten(doc, null);
        for (var propName in flattened) {
          names[propName] = true;
        }
      }
    }

    return _.map(names, function(value, key) {
      return {text: key, value: key};
    });
  },
  transform: function(data, panel, model) {
    var i, y, z;
    for (i = 0; i < panel.column_heads.length; i++) {
      model.columns.push({text: panel.column_heads[i].text});
    }

    if (model.columns.length === 0) {
      model.columns.push({text: 'JSON'});
    }

    for (i = 0; i < data.length; i++) {
      var series = data[i];

      for (y = 0; y < series.datapoints.length; y++) {
        var dp = series.datapoints[y];
        var values = [];

        if (_.isObject(dp) && panel.column_heads.length > 0) {
          var flattened = flatten(dp, null);
          for (z = 0; z < panel.column_heads.length; z++) {
            values.push(flattened[panel.column_heads[z].value]);
          }
        } else {
          values.push(JSON.stringify(dp));
        }

        model.rows.push(values);
      }
    }
  }
};

function transformDataToTable(data, panel) {
  var model = new TableModel();

  model.row_names = [];

  if (!data || data.length === 0) {
    return model;
  }

  var transformer = transformers[panel.transform];
  if (!transformer) {
    throw {message: 'Transformer ' + panel.transformer + ' not found'};
  }

  transformer.transform(data, panel, model);
  return model;
}

function transformPrepPanel(panel) {
  var transformer = transformers[panel.transform];
  if (!transformer) {
    throw {message: 'Transformer ' + panel.transformer + ' not found'};
  }

  transformer.prep_panel(panel);
}

export {transformers, transformDataToTable, transformPrepPanel}
