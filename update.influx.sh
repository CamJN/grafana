#!/usr/local/bin/bash

version=v1.2.0

govendor fetch github.com/influxdata/influxdb/influxql/internal@$version
govendor fetch github.com/influxdata/influxdb/influxql@$version
govendor fetch github.com/influxdata/influxdb/models@$version
govendor fetch github.com/influxdata/influxdb/pkg/escape@$version
