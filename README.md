Redistrict America
==================

Redraw state borders to make a more perfect union.

##Data

###Population
2013 population estimates for counties, including gender and ethnicity, are available in a [large flat file](https://www.census.gov/popest/data/counties/asrh/2013/CC-EST2013-ALLDATA.html) from the Census.

The script `data/county_data.js` automatically retrieves this file (which takes about three minutes) and generates a manageable JSON file from it in `data/files/data.json`.

###Counties
The county boundaries come from a pre-projected TopoJSON file, `data/files/counties.json`, as described by Mike Bostock [here](http://bl.ocks.org/mbostock/6320825). 

##Map
The map has two layers:

+ A state map with borders created by dynamically meshing together counties in the same state, and
+ A county map on top of it with 1% fill-opacity. 

Each time a user is finished reallocating counties from one state to another, the state borders are recalculated so that the white lines reflect the users' new boundaries.

#To Do
+ Get the rest of the data points for each county
+ Create a scoreboard at the bottom measuring overall distribution. 
+ Undo button
+ Mobile view