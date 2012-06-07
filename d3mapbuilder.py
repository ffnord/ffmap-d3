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
    output['links'] = [{'source': x.pair[0], 'target': x.pair[1],
                        'quality': x.quality,
                        'type': x.type,
                        'id': "-".join(nodes[i].id for i in x.pair)
                       } for x in self._db.get_links()]

    return json.dumps(output)

