#!/usr/bin/env python

# TODO
# Gatewayliste
# aliases.json

import json
import fileinput
import argparse

from nodedb import NodeDB
from d3mapbuilder import D3MapBuilder

parser = argparse.ArgumentParser()

parser.add_argument('-a', '--aliases',
                  help='read aliases from FILE',
                  metavar='FILE')

parser.add_argument('-g', '--gateway', action='append',
                  help='MAC of a gateway')

parser.add_argument('batmanjson', help='output of batman vd json')

args = parser.parse_args()

options = vars(args)

db = NodeDB()

db.import_batman(list(fileinput.input(options['batmanjson'])))

if options['aliases']:
  db.import_aliases(json.load(open(options['aliases'])))

db.import_wikigps("http://freifunk.metameute.de/Knoten")

if options['gateway']:
  db.mark_gateways(options['gateway'])

m = D3MapBuilder(db)

print(m.build())
