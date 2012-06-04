class Node():
  def __init__(self):
    self.name = ""
    self.id = ""
    self.macs = set()
    self.group = 0
    self.online = False
    self.gps = None
    # groups:
    # 0 normal node
    # 1 aftermath
    # 2 gateways
    # 3 TT

  def add_mac(self, mac):
    self.macs.add(mac.lower())

  def __repr__(self):
    return self.macs.__repr__()


