import json

class D3MapBuilder:
  def __init__(self, db):
    self._db = db

  def build(self):
    output = dict()

    nodes = self._db.get_nodes()

    output['nodes'] = [{'group': x.group, 'name': x.name, 'id': x.id,
                        'macs': ', '.join(x.macs)
                       } for x in nodes if x.online]
    output['links'] = [{'source': x.pair[0], 'target': x.pair[1],
                        'distance': x.distance,
                        'strength': x.strength,
                        'quality': x.quality,
                        'id': "-".join(nodes[i].id for i in x.pair)
                       } for x in self._db.get_links()]

    return json.dumps(output)

