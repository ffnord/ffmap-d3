//TODO: remove no-unused-vars config, once switched to modules
/*eslint no-unused-vars: [2, {"vars": "local"}] */

/* after making any changes here enter "make" in your terminal to apply the changes */

var ffmapConfig = {
  // link to your main community site:
  url:       "/",

  // visible link in the navigation:
  sitename:  "gothamcity.freifunk.net",

  // initial gravity, friction, of the graph at pageload:
  gravity:   0.05,
  friction:  0.73,
  theta:     0.8,
  charge:    1.0,
  distance:  1.0,
  strength:  1.0,

  // path to the nodes.json
  nodesJSON: "nodes.json",

  // Show status diagram in graph view
  showstats: true,
  // check current firmware version
  checkfirmware: true
}
