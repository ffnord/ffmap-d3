#!/bin/bash

DEST=$1

GWS=`batctl gwl -n | tail -n +2 | sed 's/=>//' | awk '{ print $1 }'|while read a;do echo -n "-g $a ";done`

mkdir $DEST

cp html/* $DEST/

ssh 188.138.99.158 batctl vd json|python ./bat2nodes.py -a aliases.json $GWS - > $DEST/nodes.json
