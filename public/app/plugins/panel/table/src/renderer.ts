///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import moment from 'moment';
import kbn from 'app/core/utils/kbn';
import {multigrad_color, fill_gradient_legend} from './heatcolors';

export class TableRenderer {
  formaters: any[];
  colorState: any;

  constructor(private panel, private table, private isUtc, private sanitize) {
    this.formaters = [];
    this.colorState = {};
  }

  discreteColor(value, style) {
    for (var i = style.thresholds.length; i > 0; i--) {
      if (value >= style.thresholds[i - 1]) {
        return style.colors[i];
      }
    }
    return _.first(style.colors);
  }

  gradColor(value, style) {

    if(style.thresholds.length < 2) {
      return style.colors[0];
    }

    var min_value = style.thresholds[0];
    var max_value = style.thresholds[1];
    return multigrad_color(style.colors, value, max_value, min_value);
  }

  getColorForValue(value, style) {
    if (!style.thresholds) { return null; }
    if(style.colorType == 'gradient') {
      return this.gradColor(value, style);
    } else {
      return this.discreteColor(value, style);
    }
  }

  defaultCellFormater(v, style) {
    if (v === null || v === void 0 || v === undefined) {
      return '';
    }

    if (_.isArray(v)) {
      v = v.join(', ');
    }

    if (style && style.sanitize) {
      return this.sanitize(v);
    } else {
      return _.escape(v);
    }
  }

  createColumnFormater(style, column) {
    if (!style) {
      return this.defaultCellFormater;
    }

    if (style.type === 'hidden') {
      return v => {
        return undefined;
      };
    }

    if (style.type === 'date') {
      return v => {
        if (v === undefined || v === null) {
          return '-';
        }

        if (_.isArray(v)) { v = v[0]; }
        var date = moment(v);
        if (this.isUtc) {
          date = date.utc();
        }
        return date.format(style.dateFormat);
      };
    }

    if (style.type === 'number') {
      let valueFormater = kbn.valueFormats[column.unit || style.unit];

      return v =>  {
        if (v === null || v === void 0) {
          return '-';
        }

        if (_.isString(v)) {
          return this.defaultCellFormater(v, style);
        }

        if (style.colorMode) {
          this.colorState[style.colorMode] = this.getColorForValue(v, style);
        }

        return valueFormater(v, style.decimals, null);
      };
    }

    return (value) => {
      return this.defaultCellFormater(value, style);
    };
  }

  formatColumnValue(colIndex, value) {
    if (this.formaters[colIndex]) {
      return this.formaters[colIndex](value);
    }

    for (let i = 0; i < this.panel.styles.length; i++) {
      let style = this.panel.styles[i];
      let column = this.table.columns[colIndex];
      var regex = kbn.stringToJsRegex(style.pattern);
      if (column.text.match(regex)) {
        this.formaters[colIndex] = this.createColumnFormater(style, column);
        return this.formaters[colIndex](value);
      }
    }

    this.formaters[colIndex] = this.defaultCellFormater;
    return this.formaters[colIndex](value);
  }

  renderCell(columnIndex, value, addWidthHack = false) {
    value = this.formatColumnValue(columnIndex, value);
    var style = '';
    if (this.colorState.cell) {
      style = ' style="background-color:' + this.colorState.cell + ';color: white"';
      this.colorState.cell = null;
    } else if (this.colorState.value) {
      style = ' style="color:' + this.colorState.value + '"';
      this.colorState.value = null;
    }

    // because of the fixed table headers css only solution
    // there is an issue if header cell is wider the cell
    // this hack adds header content to cell (not visible)
    var widthHack = '';
    if (addWidthHack) {
      widthHack = '<div class="table-panel-width-hack">' + this.table.columns[columnIndex].text + '</div>';
    }

    if (value === undefined) {
      style = ' style="display:none;"';
      this.table.columns[columnIndex].hidden = true;
    } else {
      this.table.columns[columnIndex].hidden = false;
    }

    return '<td' + style + '>' + value + widthHack + '</td>';
  }

  render(page) {
    let pageSize = this.panel.pageSize || 100;
    let startPos = page * pageSize;
    let endPos = Math.min(startPos + pageSize, this.table.rows.length);
    var html = "";

    for (var y = startPos; y < endPos; y++) {
      let row = this.table.rows[y];
      let cellHtml = '';
      let rowStyle = '';
      let name     = this.table.row_names[y];

      if(typeof(name) == 'undefined') {
      	      name = '';
      }

      cellHtml += '<th style="color: #33B5E5">' + name + '</td>'
      for (var i = 0; i < this.table.columns.length; i++) {
        cellHtml += this.renderCell(i, row[i], y === startPos);
      }

      if (this.colorState.row) {
        rowStyle = ' style="background-color:' + this.colorState.row + ';color: white"';
        this.colorState.row = null;
      }

      html += '<tr ' + rowStyle + '>' + cellHtml + '</tr>';
    }

    return html;
  }

  render_values() {
    let rows = [];

    for (var y = 0; y < this.table.rows.length; y++) {
      let row = this.table.rows[y];
      let new_row = [];
      for (var i = 0; i < this.table.columns.length; i++) {
        new_row.push(this.formatColumnValue(i, row[i]));
      }
      rows.push(new_row);
    }
    return {
        columns: this.table.columns,
        rows: rows,
    };
  }

  render_legend(canvas) {
    var selected;
    var styles = this.panel.styles;

    for(var i = 0; i < styles.length; i++) {
      if(styles[i].colorType == 'gradient' && styles[i].legendOn) {
        selected = styles[i];
        break;
      }
    }
    if(typeof(selected) === 'undefined') {
      this.panel.showLegend = false;
      return;
    }

    fill_gradient_legend(selected.colors, canvas);
    if(selected.thresholds.length >= 2) {
      this.panel.legendLeft  = selected.thresholds[0];
      this.panel.legendRight = selected.thresholds[1];
    }
    this.panel.showLegend = true;
  }
}
