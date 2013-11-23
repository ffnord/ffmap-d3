ffmap-d3
========

This repository shows the graph of all nodes in the freifunk network.
if you clone this repository, you also need to download some sample data into nodes.json, for example the nodes of Freifunk Lübeck:

https://luebeck.freifunk.net/map/nodes.json

nodes.html
--------
An interactive NodeGraph programmed in the framework d3.js, that shows all nodes, clients and connections between them in your Freifunk mesh-network.

after creating any changes at the file nodes.js
you have to execute `make` at your console  to apply the changes before you reload nodes.html in your browser


geomap.html
--------
A geographical map with all nodes with known GPS-coordinates
online nodes are shown green
offline nodes are shown grey
the connections between two nodes are represented by a line in the same color as in nodes.html


list.html
--------
A plain text table with all nodes in the network
sortable if you click on the titles in the header-row
