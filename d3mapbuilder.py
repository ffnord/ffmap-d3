import json

class D3MapBuilder:
  def __init__(self, db):
    self._db = db

  def build(self):
    output = dict()

    nodes = self._db.get_nodes()

    output['nodes'] = [{'name': x.name, 'id': x.id,
                        'macs': ', '.join(x.macs),
                        'geo': x.gps.split(" ") if x.gps else None,
                        'flags': x.flags
                       } for x in nodes if x.flags['online']]

    links = self._db.get_links()

    output['links'] = [{'source': x.source.id, 'target': x.target.id,
                        'quality': x.quality,
                        'type': x.type,
                        'id': x.id
                       } for x in links]

    return json.dumps(output)

