CAT=cat

GEOMAP_SRC  = config.js lib/loader.js lib/links.js lib/html5slider.js lib/geomap.js lib/init.js
GRAPH_SRC   = config.js lib/loader.js lib/links.js lib/pacman.js lib/graph.js lib/init.js
LIST_SRC    = config.js lib/loader.js lib/links.js lib/list.js lib/init.js
STATS_SRC   = config.js lib/loader.js lib/stats.js lib/init.js

all: geomap_compiled.js graph_compiled.js list_compiled.js stats_compiled.js download_vendor

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

download_vendor:
	mkdir -p lib/vendor/ajax/libs/d3/3.4.1/ lib/vendor/ajax/libs/leaflet/0.7.2/ lib/vendor/ajax/libs/jquery.tablesorter/2.13.3/
	wget -O lib/vendor/ajax/libs/d3/3.4.1/d3.min.js http://cdnjs.cloudflare.com/ajax/libs/d3/3.4.1/d3.min.js
	wget -O lib/vendor/ajax/libs/leaflet/0.7.2/leaflet.js http://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.2/leaflet.js
	wget -O lib/vendor/ajax/libs/jquery.tablesorter/2.13.3/jquery.tablesorter.min.js http://cdnjs.cloudflare.com/ajax/libs/jquery.tablesorter/2.13.3/jquery.tablesorter.min.js
	wget -O lib/vendor/jquery-1.11.0.min.js http://code.jquery.com/jquery-1.11.0.min.js