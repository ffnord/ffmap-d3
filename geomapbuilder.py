class GeoMapBuilder:
  kml_template = """<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Style id="virtual-link">
      <LineStyle>
        <color>#4f0013f8</color>
        <width>2</width>
      </LineStyle>
    </Style>
    <Style id="wifi-link">
      <LineStyle>
        <color>#ff13d854</color>
        <width>4</width>
      </LineStyle>
    </Style>
    <Style id="router-unknown">
      <IconStyle>
        <Icon>
          <href>router-unknown.png</href>
          <scale>1.0</scale>
        </Icon>
      </IconStyle>
    </Style>
    <Style id="router-up">
      <IconStyle>
        <Icon>
          <href>router-up.png</href>
          <scale>1.0</scale>
        </Icon>
      </IconStyle>
    </Style>
    <Style id="router-down">
      <IconStyle>
        <Icon>
          <href>router-down.png</href>
          <scale>1.0</scale>
        </Icon>
      </IconStyle>
    </Style>
    %s
  </Document>
</kml>"""

  def __init__(self, db):
    self._db = db

  def build(self):
    text = []

    nodes = self._db.get_nodes()

    for node in nodes:
      try:
        text.append(GeoNode(node).render())
      except:
        continue

    for link in self._db.get_links():
      if link.type == "vpn":
        continue

      try:
        text.append(GeoEdge(nodes, link).render())
      except:
        continue

    return self.kml_template % "".join(text)

def gps_format(s):
  return ",".join(s.split(" ")[::-1])

class GeoNode:
  kml_template = """<Placemark>
  <name>%s</name>
  <styleUrl>#router-%s</styleUrl>
  <Point>
    <coordinates>%s,0</coordinates>
  </Point>
  <description>%s</description>
</Placemark>"""

  def __init__(self, node):
    self._node = node

  def render(self):
    if not self._node.gps:
      raise

    name = self._node.name
    status = "up" if self._node.flags['online'] else "down"
    gps = gps_format(self._node.gps)
    text = " ".join(self._node.macs)

    return self.kml_template % (name, status, gps, text)

class GeoEdge:
  kml_template = """<Placemark>
  <LineString>
    <coordinates>%s,0. %s,0.</coordinates>
  </LineString>
  <styleUrl>#%s</styleUrl>
</Placemark>"""

  def __init__(self, nodes, link):
    self._link = link
    self.pair = [nodes[k.id] for k in (link.source, link.target)]

  def render(self):
    if not (self.pair[0].gps and self.pair[1].gps):
      raise

    a = gps_format(self.pair[0].gps)
    b = gps_format(self.pair[1].gps)

    return self.kml_template % (a, b, "wifi-link")
