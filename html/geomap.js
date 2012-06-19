var map;
var vectorLayer;

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

  var layerMapnik = new OpenLayers.Layer.OSM.Mapnik("Mapnik", {opacity: 0.5});
  map.addLayer(layerMapnik);

  var center = new OpenLayers.LonLat(10.688, 53.866).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());

  var zoom = 12

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
  d3.json("nodes.json", function(json) {
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

        var feature = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString(
           [new OpenLayers.Geometry.Point(a.lon, a.lat),
            new OpenLayers.Geometry.Point(b.lon, b.lat),
           ]),
           {name: d.name, description: d.id},
           { 
              strokeColor: '#00ff00', 
              strokeOpacity: 0.5,
              strokeWidth: 5
           })
        layer.addFeatures([feature])
      })
  })
}
