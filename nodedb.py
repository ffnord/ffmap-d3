import json
from node import Node
from link import Link

from bs4 import BeautifulSoup
from urllib.request import urlopen

class NodeDB:
  def __init__(self):
    self._nodes = []
    self._links = []

  # fetch list of links
  def get_links(self):
    return [self.map_link(x) for x in self._links]

  # fetch list of nodes
  def get_nodes(self):
    return self._nodes

  def add_link(self, a, b, q):
    l = tuple(sorted((a,b)))
    for link in self._links:
      if l == link[0]:
        if link[1] != str(q):
          link[1] = max(float(link[1]), float(q))
        return
    self._links.append([l,str(q)])

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

        # If it's a TT link and the MAC is very similar
        # consider this MAC as one of the routers
        # MACs
        if 'gateway' in x and x['label'] == "TT":
          router = list(int(i, 16) for i in x['router'].split(":"))
          gateway = list(int(i, 16) for i in x['gateway'].split(":"))

          # first byte must only differ in bit 2
          if router[0] == gateway[0] | 2:
            # count different bytes
            a = [x for x in zip(router[1:], gateway[1:]) if x[0] != x[1]]

            # no more than two additional bytes must differ
            if len(a) <= 2:
              delta = 0
              if len(a) > 0:
                delta = sum(abs(i[0] -i[1]) for i in a)

              if delta < 8:
                # This TT link looks like a mac of the router!
                node.add_mac(x['gateway'])

                # skip processing as regular link
                continue

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

        if a != b:
          self.add_link(a, b, x['label'])

    for line in lines:
      x = json.loads(line)

      if 'primary' in x:
        try:
          node = self.maybe_node_by_mac((x['primary'], ))
        except:
          continue

        node.id = x['primary']

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
    if any(filter(lambda x: self._nodes[x].group == 3, pair[0])):
      distance = 10
      strength = 1

    link = Link()
    link.pair = pair[0]
    link.distance = distance
    link.strength = strength
    link.quality = pair[1]
    return link

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
      if not ('MAC' in node and 'GPS' in node):
        continue

      macs = [s for s in [s.strip() for s in node['MAC'].split(',')] if s]
      gps = [s for s in [s.strip() for s in node['GPS'].split(',')] if s]
      zipped = zip(macs, gps)

      if 'Nick' in node:
        names = [s for s in [s.strip() for s in node['Nick'].split(',')] if s]
        if names:
          zipped = zip(macs, gps, names)

      for pair in zipped:
        try:
          node = self.maybe_node_by_mac((pair[0], ))
        except:
          node = Node()
          node.add_mac(pair[0])
          self._nodes.append(node)

        if len(pair) > 2:
          if pair[2]:
            node.name = pair[2]

        node.gps = pair[1]

  def find_link(self, i):
    for link in self._links:
      if i in link[0]:
        return link

  def wilder_scheiss(self):
    for node in self._nodes:
      if node.group == 3 and node.gps:
        i = self._nodes.index(node)
        link = self.find_link(i)
        if link:
          linklist = list(link)
          linklist.remove(i)
          j = linklist[0]

          for mac in node.macs:
            self._nodes[j].add_mac(mac)

          self._nodes[j].gps = node.gps

          node.gps = None

