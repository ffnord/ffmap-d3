class Link():
  def __init__(self):
    self.id = None
    self.source = None
    self.target = None
    self.quality = None
    self.type = None

class LinkConnector():
  def __init__(self):
    self.id = None
    self.interface = None

  def __repr__(self):
    return "LinkConnector(%d, %s)" % (self.id, self.interface)
