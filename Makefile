CAT=cat

GEOMAP_SRC  = config.js lib/d3.min.js lib/loader.js lib/nodes.js lib/links.js lib/leaflet.js lib/html5slider.js lib/geomap.js lib/init.js
GRAPH_SRC   = config.js lib/d3.min.js lib/loader.js lib/nodes.js lib/links.js lib/pacman.js lib/graph.js lib/init.js
LIST_SRC    = config.js lib/d3.min.js lib/loader.js lib/nodes.js lib/links.js lib/jquery.min.js lib/jquery.tablesorter.min.js lib/list.js lib/init.js

all: geomap_compiled.js graph_compiled.js list_compiled.js

clean:
	rm -f geomap_compiled.js
	rm -f graph_compiled.js
	rm -f list_compiled.js

%_compiled.js:
	$(CAT) $^ > $@

geomap_compiled.js: $(GEOMAP_SRC)

graph_compiled.js: $(GRAPH_SRC)

list_compiled.js: $(LIST_SRC)
