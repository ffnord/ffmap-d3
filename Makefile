CAT=cat

GRAPH_SRC=lib/d3.min.js date.js loader.js links.js pacman.js graph.js

all: graph_compiled.js

clean:
	rm graph_compiled.js

graph_compiled.js: $(GRAPH_SRC)
	$(CAT) $(GRAPH_SRC) > $@
