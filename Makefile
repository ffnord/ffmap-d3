CAT=cat

GEOMAP_SRC  = lib/d3.min.js lib/loader.js lib/nodes.js lib/links.js lib/leaflet.js lib/geomap.js
GRAPH_SRC   = lib/d3.min.js lib/loader.js lib/nodes.js lib/links.js lib/date.js lib/pacman.js lib/graph.js
LIST_SRC    = lib/d3.min.js lib/loader.js lib/nodes.js lib/links.js lib/jquery.min.js lib/jquery.tablesorter.min.js lib/list.js
STATS_SRC   = lib/d3.min.js lib/loader.js lib/nodes.js lib/stats.js

all: geomap_compiled.js graph_compiled.js list_compiled.js stats_compiled.js

clean:
	rm -f geomap_compiled.js
	rm -f graph_compiled.js
	rm -f list_compiled.js
	rm -f stats_compiled.js

%_compiled.js:
	$(CAT) $^ > $@

geomap_compiled.js: $(GEOMAP_SRC)

graph_compiled.js: $(GRAPH_SRC)

list_compiled.js: $(LIST_SRC)

stats_compiled.js: $(STATS_SRC)
