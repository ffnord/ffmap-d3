import json
from node import Node
from link import Link

class NodeDB:
  def __init__(self):
    self._nodes = []
    self._links = set()

  # fetch list of links
  def get_links(self):
    return [self.map_link(x) for x in self._links]

  # fetch list of nodes
  def get_nodes(self):
    return self._nodes

  def maybe_node_by_mac(self, macs):
    for node in self._nodes:
      for mac in macs:
        if mac in node.macs:
          return node

    raise

  # import_batman(list(fileinput.input(options['batmanjson'])))
  def import_batman(self, lines):

    for line in lines:
      x = json.loads(line)

      if 'of' in x:
        try:
          node = self.maybe_node_by_mac((x['of'], x['secondary']))
        except:
          node = Node()
          node.online = True
          self._nodes.append(node)

        node.add_mac(x['of'])
        node.add_mac(x['secondary'])

    for line in lines:
      x = json.loads(line)

      if 'router' in x:
        try:
          node = self.maybe_node_by_mac((x['router'], ))
        except:
          node = Node()
          node.online = True
          node.add_mac(x['router'])
          self._nodes.append(node)

        try:
          if 'gateway' in x:
            x['neighbor'] = x['gateway']

          node = self.maybe_node_by_mac((x['neighbor'], ))
        except:
          node = Node()
          node.online = True
          if x['label'] == 'TT':
            node.group = 3

          node.add_mac(x['neighbor'])
          self._nodes.append(node)

    for line in lines:
      x = json.loads(line)

      if 'router' in x:
        try:
          if 'gateway' in x:
            x['neighbor'] = x['gateway']

          router = self.maybe_node_by_mac((x['router'], ))
          neighbor = self.maybe_node_by_mac((x['neighbor'], ))
        except:
          continue

        a = self._nodes.index(router)
        b = self._nodes.index(neighbor)

        self._links.add(tuple(sorted((a,b))))

  def import_aliases(self, aliases):
    for mac, alias in aliases.items():
      try:
        node = self.maybe_node_by_mac((mac, ))
      except:
        continue

      node.name = alias['name']
      if 'group' in alias:
        node.group = alias['group']

  # list of macs
  # if options['gateway']:
  #   mark_gateways(options['gateway'])
  def mark_gateways(self, gateways):
    for gateway in gateways:
      try:
        node = self.maybe_node_by_mac((gateway, ))
      except:
        continue

      node.group = 2

  def map_link(self, pair):
    distance = 80
    strength = 0.2
    if any(filter(lambda x: self._nodes[x].group == 3, pair)):
      distance = 10
      strength = 1

    link = Link()
    link.pair = pair
    link.distance = distance
    link.strength = strength
    return link

