define("config", [
  "lib/d3"
], function (d3) {
  /* after making any changes here enter "grunt" in your terminal to apply the changes */
  "use strict"

  var d3Config = {
    locale : {
      decimal: ",",
        thousands: ".",
        grouping: [3],
        currency: ["€", ""],
        dateTime: "%a %b %e %X %Y",
        date: "%d.%m.%Y",
        time: "%H:%M:%S",
        periods: ["", ""],
        days: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
        shortDays: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
        months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
        shortMonths: ["Jan", "Feb", "Mrz", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
    }
  }

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

    chart: {
      type: "json",
      defaults: {
        metric: "clientcount",
        range: "24h"
      },
      metrics: {
        "clientcount": {
          label: "Clients",
          sources: [
            {
              name: "clientcount",
              interpolation: "step"
            }
          ]
        },
        "traffic": {
          label: "Traffic",
          sources: [
            {
              name: "traffic.tx.bytes",
              label: "TX Bytes",
              color: "rgba(31, 119, 180, 0.6)"
            },
            {
              name: "traffic.rx.bytes",
              label: "RX Bytes",
              color: "#6e6e6e"
            }
          ],
          margin: {
            left: 46
          },
          tickFormat: "bytes"
        },
        "loadavg": {
          label: "Load",
          sources: [
            {
              name: "loadavg"
            }
          ],
          tickFormat: d3.format("02.2f")
        },
        "uptime": {
          label: "Uptime",
          sources: [
            {
              name: "uptime",
              interpolation: "Linear"
            }
          ],
          tickFormat: "time"
        }
      },
      ranges: {
        "4h": {
          label: "4h",
          tickFormat: d3.locale(d3Config.locale).timeFormat("%H:%M")
        },
        "24h": {
          label: "24h",
          tickFormat: d3.locale(d3Config.locale).timeFormat("%H")
        },
        "14d": {
          label: "14d",
          tickFormat: d3.locale(d3Config.locale).timeFormat("%d.%m."),
          rotateTicks: true
        },
        "1mon": {
          label: "1m",
          tickFormat: d3.locale(d3Config.locale).timeFormat("%d.%m."),
          rotateTicks: true
        },
        "1y": {
          label: "1y",
          tickFormat: d3.locale(d3Config.locale).timeFormat("%b")
        }
      }
    },

    map: {
      showNodeInfo: false,
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
