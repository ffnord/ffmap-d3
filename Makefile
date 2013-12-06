include Makefile.conf

CAT=cat

GEOMAP_SRC  = lib/d3.min.js lib/loader.js lib/nodes.js lib/links.js lib/leaflet.js lib/html5slider.js lib/geomap.js
GRAPH_SRC   = lib/d3.min.js lib/loader.js lib/nodes.js lib/links.js lib/date.js lib/pacman.js lib/graph.js
LIST_SRC    = lib/d3.min.js lib/loader.js lib/nodes.js lib/links.js lib/jquery.min.js lib/jquery.tablesorter.min.js lib/list.js
STATS_SRC   = lib/d3.min.js lib/loader.js lib/nodes.js lib/stats.js

LOCALIZED_FILES=graph.html geomap.html list.html lib/graph.js lib/list.js

.PHONY: all localized

all: localized geomap_compiled.js graph_compiled.js list_compiled.js stats_compiled.js 

%: %.in lang/${FFMAP_LANGUAGE}.lang
	bin/localize $< -c lang/${FFMAP_LANGUAGE}.lang

localized: $(LOCALIZED_FILES)

localization_file: $(patsubst %,%.in,$(LOCALIZED_FILES))
	bin/localize -m -c lang/${FFMAP_LANGUAGE}.lang $^


distclean: clean
	rm -f Makefile.conf

clean:
	rm -f geomap_compiled.js
	rm -f graph_compiled.js
	rm -f list_compiled.js
	rm -f stats_compiled.js
	rm -f $(LOCALIZED_FILES)

%_compiled.js:
	$(CAT) $^ > $@

geomap_compiled.js: $(GEOMAP_SRC)

graph_compiled.js: $(GRAPH_SRC)

list_compiled.js: $(LIST_SRC)

stats_compiled.js: $(STATS_SRC)
