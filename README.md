ffmap-d3
========

[![Build Status](https://travis-ci.org/ffnord/ffmap-d3.svg?branch=master)](https://travis-ci.org/ffnord/ffmap-d3)

This repository shows the graph of all nodes in the freifunk network.
if you clone this repository, you also need to download some sample data into nodes.json, for example the nodes of Freifunk Lübeck:

https://luebeck.freifunk.net/map/nodes.json


Development
===========

To build the project, you need to have nodejs, grunt-cli and bower installed.
Install the nodejs packages for your operating system (and npm, if those packages do not already contain it).
Then install the grunt-cli and bower node package globally, by running `npm install -g grunt-cli bower`.
After that run `npm install` in the root directory of the project.

To download dependencies run `bower install` in the project directory, this downloads all reqired javascript libraries.
You are now ready to build the project by running `grunt`. 
To start a development server on localhost, you can use `grunt dev`. This task will build the project, start a [development server](http://localhost:8000/), and watch the source files for changes.
