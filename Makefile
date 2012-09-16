CAT=cat

NODES_SRC=d3.v2.js jquery.min.js loader.js links.js pacman.js nodes.js

nodes_compiled.js: $(NODES_SRC)
	$(CAT) $(NODES_SRC) > $@ 	

all: nodes_compiled.js

clean:
	rm nodes_compiled.js
