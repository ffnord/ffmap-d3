#!/usr/bin/env python

# TODO
# Gatewayliste
# aliases.json

import json
import fileinput
import argparse

parser = argparse.ArgumentParser()

parser.add_argument('-a', '--aliases',
                  help='read aliases from FILE',
                  metavar='FILE')

parser.add_argument('-g', '--gateway', action='append',
                  help='MAC of a gateway')

parser.add_argument('batmanjson', help='output of batman vd json')

args = parser.parse_args()

options = vars(args)

aliases = dict()
links = set()
nodes = []

class Node():
  def __init__(self):
    self.name = ""
    self.macs = set()
    self.group = 0
    self.online = False
    # groups:
    # 0 normal node
    # 1 aftermath
    # 2 gateways
    # 3 TT

  def add_mac(self, mac):
    self.macs.add(mac)

  def __repr__(self):
    return self.macs.__repr__()

class Link():
  def __init__(self):
    self.pair = None
    self.distance = None
    self.strength = None

def maybe_node_by_mac(nodes, macs):
  for node in nodes:
    for mac in macs:
      if mac in node.macs:
        return node

  raise

lines = list(fileinput.input(options['batmanjson']))

for line in lines:
  x = json.loads(line)

  if 'of' in x:
    try:
      node = maybe_node_by_mac(nodes, (x['of'], x['secondary']))
    except:
      node = Node()
      node.online = True
      nodes.append(node)

    node.add_mac(x['of'])
    node.add_mac(x['secondary'])

for line in lines:
  x = json.loads(line)

  if 'router' in x:
    try:
      node = maybe_node_by_mac(nodes, (x['router'], ))
    except:
      node = Node()
      node.online = True
      node.add_mac(x['router'])
      nodes.append(node)

    try:
      if 'gateway' in x:
        x['neighbor'] = x['gateway']

      node = maybe_node_by_mac(nodes, (x['neighbor'], ))
    except:
      node = Node()
      node.online = True
      if x['label'] == 'TT':
        node.group = 3

      node.add_mac(x['neighbor'])
      nodes.append(node)

for line in lines:
  x = json.loads(line)

  if 'router' in x:
    try:
      if 'gateway' in x:
        x['neighbor'] = x['gateway']

      router = maybe_node_by_mac(nodes, (x['router'], ))
      neighbor = maybe_node_by_mac(nodes, (x['neighbor'], ))
    except:
      continue

    a = nodes.index(router)
    b = nodes.index(neighbor)

    links.add(tuple(sorted((a,b))))

if options['aliases']:
  aliases = json.load(open(options['aliases']))

  for mac, alias in aliases.items():
    try:
      node = maybe_node_by_mac(nodes, (mac, ))
    except:
      continue

    node.name = alias['name']
    if 'group' in alias:
      node.group = alias['group']

if options['gateway']:
  for gateway in options['gateway']:
    try:
      node = maybe_node_by_mac(nodes, (gateway, ))
      node.group = 2
    except:
      continue

def map_link(nodes, pair):
  distance = 80
  strength = 0.2
  if any(filter(lambda x: nodes[x].group == 3, pair)):
    distance = 10
    strength = 1

  link = Link()
  link.pair = pair
  link.distance = distance
  link.strength = strength
  return link

links = [map_link(nodes, x) for x in links]

output = dict()

output['nodes'] = [{'group': x.group, 'name': x.name,
                    'macs': ', '.join(x.macs)
                   } for x in nodes if x.online]
output['links'] = [{'source': x.pair[0], 'target': x.pair[1],
                    'distance': x.distance,
                    'strength': x.strength
                   } for x in links]

print(json.dumps(output))
