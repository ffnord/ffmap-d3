define("config", function () {
  /* after making any changes here enter "grunt" in your terminal to apply the changes */
  "use strict"

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

    graph: {
      type: "rrd"
    },

    map: {
      layer: {
        url: "http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.jpg",
        config: {
          subdomains: "1234",
          type: "osm",
          attribution: "Map data Tiles &copy; <a href=\"http://www.mapquest.com/\" target=\"_blank\">MapQuest</a> <img src=\"http://developer.mapquest.com/content/osm/mq_logo.png\" />, Map data © OpenStreetMap contributors, CC-BY-SA",
          opacity: 0.7
        }
      }
      /*
      layer: {
        url: "http://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png",
        config: {
          subdomains: "abcd",
          type: "osm",
          attribution: "© <a href=\"http://osm.org/copyright\" target=\"_blank\">OpenStreetMap</a> contributors, Open Database License",
          opacity: 0.7
        }
      }*/
    }


  }

  return ffmapConfig
})
