#!/usr/bin/env python

# TODO
# Gatewayliste
# aliases.json

import json
import fileinput
import argparse

from nodedb import NodeDB
from geomapbuilder import GeoMapBuilder

parser = argparse.ArgumentParser()

parser.add_argument('-a', '--aliases',
                  help='read aliases from FILE',
                  metavar='FILE')

parser.add_argument('batmanjson', help='output of batman vd json')

args = parser.parse_args()

options = vars(args)

db = NodeDB()

db.import_batman(list(fileinput.input(options['batmanjson'])))

if options['aliases']:
  db.import_aliases(json.load(open(options['aliases'])))

db.import_wikigps("http://freifunk.metameute.de/Knoten")

db.wilder_scheiss()

m = GeoMapBuilder(db)

print(m.build())
