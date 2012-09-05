var map;
var vectorLayer;
var nodes_json = "nodes.json"

OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control);

function init()
{
  map = new OpenLayers.Map ("map", {
    controls:[
    new OpenLayers.Control.Navigation(),
      new OpenLayers.Control.PanZoomBar(),
      new OpenLayers.Control.Attribution(),
      new OpenLayers.Control.ScaleLine(),
      new OpenLayers.Control.MousePosition()],
      maxResolution: 156543.0399,
      numZoomLevels: 19,
      units: 'm',
      projection: new OpenLayers.Projection("EPSG:900913"),
      displayProjection: new OpenLayers.Projection("EPSG:4326")
  } );

arrayOSM = ["http://otile1.mqcdn.com/tiles/1.0.0/osm/${z}/${x}/${y}.jpg",
	    "http://otile2.mqcdn.com/tiles/1.0.0/osm/${z}/${x}/${y}.jpg",
	    "http://otile3.mqcdn.com/tiles/1.0.0/osm/${z}/${x}/${y}.jpg",
	    "http://otile4.mqcdn.com/tiles/1.0.0/osm/${z}/${x}/${y}.jpg"];

  var layerMapnik = new OpenLayers.Layer.OSM.Mapnik("Mapnik", {opacity: 0.5});
  var baseOSM = new OpenLayers.Layer.OSM("MapQuest-OSM Tiles", arrayOSM);
  map.addLayer(baseOSM);

  var center = new OpenLayers.LonLat(10.688, 53.866).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());

  var zoom = 13

  map.setCenter(center, zoom);

  vectorLayer = new OpenLayers.Layer.Vector("Nodes");

  map.addLayer(vectorLayer);

  selectControl = new OpenLayers.Control.SelectFeature(map.layers[1],
      {onSelect: onFeatureSelect, onUnselect: onFeatureUnselect});
  map.addControl(selectControl);
  selectControl.activate();

  var click = new OpenLayers.Control.Click();
  map.addControl(click);
  click.activate();

  load_json(vectorLayer, map)
}

function resizeMap()
{
  if (map !== undefined) {
    map.updateSize()

    // Did someone say Chrome bug?
    map.removeLayer(vectorLayer)
    map.addLayer(vectorLayer)
  }
}

function onPopupClose(evt)
{
  selectControl.unselect(selectedFeature);
}

function onFeatureSelect(feature)
{
  selectedFeature = feature;
  popup = new OpenLayers.Popup.FramedCloud("chicken",
      feature.geometry.getBounds().getCenterLonLat(),
      new OpenLayers.Size(100,150),
      "<div class='nodePopup'><span class='label'>Name:</span> "+feature.attributes.name+"<br><span class='label'>Description:</span> "+feature.attributes.description+"</div>",
      null, true, onPopupClose);
  feature.popup = popup;
  map.addPopup(popup);
}

function onFeatureUnselect(feature)
{
  map.removePopup(feature.popup);
  feature.popup.destroy();
  feature.popup = null;
}

function kmlLoaded()
{
  map.zoomToExtent(vectorLayer.getDataExtent());
}

function load_json(layer, map) {
  d3.json(nodes_json, function(json) {
    // replace indices with real objects
    json.links.forEach( function(d) {
      if (typeof d.source == "number") d.source = json.nodes[d.source]
      if (typeof d.target == "number") d.target = json.nodes[d.target]
    })

    json.nodes.filter( function(d) {
        return d.geo !== null
      }).forEach( function(d) {
        var lonlat = new OpenLayers.LonLat(d.geo[1], d.geo[0])
                                  .transform( new OpenLayers.Projection("EPSG:4326"),
                                                  map.getProjectionObject() 
                                  );

        var img = d.flags.online?"router-up.png":"router-down.png"

        var feature = new OpenLayers.Feature.Vector(
          new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat),
           {name: d.name, description: d.id},
           {externalGraphic: img, graphicHeight: 32, graphicWidth: 32}
          )
        layer.addFeatures([feature])
      })

    json.links.filter( function(d) {
        return d.source.geo !== null && d.target.geo !== null &&
               d.type != "vpn"
      }).forEach( function(d) {
        var a = new OpenLayers.LonLat(d.source.geo[1], d.source.geo[0])
                                  .transform( new OpenLayers.Projection("EPSG:4326"),
                                                  map.getProjectionObject() 
                                  );

        var b = new OpenLayers.LonLat(d.target.geo[1], d.target.geo[0])
                                  .transform( new OpenLayers.Projection("EPSG:4326"),
                                                  map.getProjectionObject() 
                                  );
        var color;
        switch (d.type) {
          case "vpn":
            color = linkcolor['default'](Math.max.apply(null, d.quality.split(",")))
            break;
          default:
            color = linkcolor['wifi'](Math.max.apply(null, d.quality.split(",")))
        }

        var feature = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString(
           [new OpenLayers.Geometry.Point(a.lon, a.lat),
            new OpenLayers.Geometry.Point(b.lon, b.lat),
           ]),
           {name: d.name, description: d.id},
           { 
              strokeColor: color,
              strokeOpacity: 0.8,
              strokeWidth: 3
           })
        layer.addFeatures([feature])
      })
  })
}
