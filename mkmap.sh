#!/bin/bash

DEST=$1


GWS=`(/usr/sbin/batctl gwl -n | tail -n +2 | grep -v '^No' | sed 's/=>//' | awk '{ print $1 }') | while read a; do echo -n "-g $a "; done`

/usr/sbin/batctl vd json | "$(dirname "$0")"/bat2nodes.py -a "$(dirname "$0")"/aliases.json $GWS - > $DEST/nodes.json.new
/usr/sbin/batctl vd json | "$(dirname "$0")"/bat2geomap.py -a "$(dirname "$0")"/aliases.json - > $DEST/geomap.kml.new

mv $DEST/nodes.json.new $DEST/nodes.json
mv $DEST/geomap.kml.new $DEST/geomap.kml

