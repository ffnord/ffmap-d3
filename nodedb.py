import json
from functools import reduce
from collections import defaultdict
from node import Node, Interface
from link import Link, LinkConnector
from itertools import zip_longest

from bs4 import BeautifulSoup
from urllib.request import urlopen

class NodeDB:
  def __init__(self):
    self._nodes = []
    self._links = []

  # fetch list of links
  def get_links(self):
    self.update_vpn_links()
    return self.reduce_links()

  # fetch list of nodes
  def get_nodes(self):
    return self._nodes

  def maybe_node_by_mac(self, macs):
    for node in self._nodes:
      for mac in macs:
        if mac.lower() in node.macs:
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
          node.flags['online'] = True
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
          node.flags['online'] = True
          node.add_mac(x['router'])
          self._nodes.append(node)

        # If it's a TT link and the MAC is very similar
        # consider this MAC as one of the routers
        # MACs
        if 'gateway' in x and x['label'] == "TT":
          try:
            mac_a = list(int(i, 16) for i in x['router'].split(":"))
            mac_b = list(int(i, 16) for i in x['gateway'].split(":"))
          except ValueError:
            continue

          if is_similar(mac_a, mac_b):
            node.add_mac(x['gateway'])

            # skip processing as regular link
            continue

        try:
          if 'neighbor' in x:
            try:
              node = self.maybe_node_by_mac((x['neighbor']))
            except:
              continue

          if 'gateway' in x:
            x['neighbor'] = x['gateway']

          node = self.maybe_node_by_mac((x['neighbor'], ))
        except:
          node = Node()
          node.flags['online'] = True
          if x['label'] == 'TT':
            node.flags['client'] = True

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

        # filter TT links merged in previous step
        if router == neighbor:
          continue

        link = Link()
        link.source = LinkConnector()
        link.source.interface = x['router']
        link.source.id = self._nodes.index(router)
        link.target = LinkConnector()
        link.target.interface = x['neighbor']
        link.target.id = self._nodes.index(neighbor)
        link.quality = x['label']
        link.id = "-".join(sorted((link.source.interface, link.target.interface)))

        if x['label'] == "TT":
          link.type = "client"

        self._links.append(link)

    for line in lines:
      x = json.loads(line)

      if 'primary' in x:
        try:
          node = self.maybe_node_by_mac((x['primary'], ))
        except:
          continue

        node.id = x['primary']

  def reduce_links(self):
    tmp_links = defaultdict(list)

    for link in self._links:
      tmp_links[link.id].append(link)

    links = []

    def reduce_link(a, b):
      a.id = b.id
      a.source = b.source
      a.target = b.target
      a.type = b.type
      a.quality = ", ".join([x for x in (a.quality, b.quality) if x])

      return a

    for k, v in tmp_links.items():
      new_link = reduce(reduce_link, v, Link())
      links.append(new_link)

    return links

  def import_aliases(self, aliases):
    for mac, alias in aliases.items():
      try:
        node = self.maybe_node_by_mac((mac, ))
      except:
        continue

      node.name = alias['name']

      if 'vpn' in alias and alias['vpn']:
        node.interfaces[mac].vpn = True

      if 'gps' in alias:
        node.gps = alias['gps']

  # list of macs
  # if options['gateway']:
  #   mark_gateways(options['gateway'])
  def mark_gateways(self, gateways):
    for gateway in gateways:
      try:
        node = self.maybe_node_by_mac((gateway, ))
      except:
        continue

      node.flags['gateway'] = True

  def update_vpn_links(self):
    changes = 1
    while changes > 0:
      changes = 0
      for link in self._links:
        if link.type == "client":
          continue

        source_interface = self._nodes[link.source.id].interfaces[link.source.interface]
        target_interface = self._nodes[link.target.id].interfaces[link.target.interface]
        if source_interface.vpn or target_interface.vpn:
          source_interface.vpn = True
          target_interface.vpn = True
          if link.type != "vpn":
            changes += 1

          link.type = "vpn"

  def import_wikigps(self, url):
    def fetch_wikitable(url):
      f = urlopen(url)

      soup = BeautifulSoup(f)

      table = soup.find_all("table")[0]

      rows = table.find_all("tr")

      headers = []

      data = []

      def maybe_strip(x):
        if isinstance(x.string, str):
          return x.string.strip()
        else:
          return ""

      for row in rows:
        tds = list([maybe_strip(x) for x in row.find_all("td")])
        ths = list([maybe_strip(x) for x in row.find_all("th")])

        if any(tds):
          data.append(tds)

        if any(ths):
          headers = ths

      nodes = []

      for d in data:
        nodes.append(dict(zip(headers, d)))

      return nodes

    nodes = fetch_wikitable(url)

    for node in nodes:
      try:
        node['MAC'] = node['MAC'].split(',')
      except KeyError:
        pass

      try:
        node['GPS'] = node['GPS'].split(',')
      except KeyError:
        pass

      try:
        node['Nick'] = node['Nick'].split(',')
      except KeyError:
        pass

      nodes = zip_longest(node['MAC'], node['GPS'], node['Nick'])

      for data in nodes:
        if not data[0]:
          continue

        try:
          node = self.maybe_node_by_mac((data[0], ))
        except:
          node = Node()
          node.add_mac(data[0])
          self._nodes.append(node)

        if data[1]:
          node.gps = data[1]

        if data[2]:
          node.name = data[2]

# compares two MACs and decides whether they are
# similar and could be from the same node
def is_similar(a, b):
  # first byte must only differ in bit 2
  if a[0] | 2 == b[0] | 2:
    # count different bytes
    a = [x for x in zip(a[1:], b[1:]) if x[0] != x[1]]
  else:
    return False

  # no more than two additional bytes must differ
  if len(a) <= 2:
    delta = 0

  if len(a) > 0:
    delta = sum(abs(i[0] -i[1]) for i in a)

  # This TT link looks like a mac of the router!
  return delta < 8

