var SVG_PATH = "human_brain.svg";
var STRUCTURES_URL = "structures.json";
var DOWNSAMPLE = 4;

var SECTION_IMAGE_ID = 112364351;

var _structures = {};

var height = 800,
    width = 600,
    vPadding = 200;

var x = d3.scale.linear()
    .domain([0, width])
    .range([0, width]);

var y = d3.scale.linear()
    .domain([0, height - vPadding])
    .range([0, height - vPadding]);

var color = d3.scale.category20();

var svg = d3.select("#icicle").append("svg")
    .attr("width", width)
    .attr("height", height);


var partition = d3.layout.partition()
    .size([width, height - vPadding])
    .value(function(d) { return d.size; });

var rect = svg.selectAll(".node");

var line = d3.svg.line()
    .interpolate("bundle")
    .tension(.85)
    .x( function(d) { return x(d.x); })
    .y( function(d) { return y(d.y); });

var paths = {};

var addWeightAndPaths = function(root, structures, paths) {
  root.weight = structures[root.id].weight;
  root.path = paths[root.id];
  var children = root.children;
  if (children.length == 0) {
    root.size = root.weight;
  }
  else {
    for (var i = 0; i < children.length; i++) {
      addWeightAndPaths(children[i], structures, paths);
    }
  }
}



d3.json(STRUCTURES_URL, function(response) {
  for (var i = 0; i < response.msg.length; i++) {
    var s = response.msg[i];
    _structures[s.id] = s;
  }

  d3.xml("human_brain.svg", "images/svg+xml", function(xml) {
    document.getElementById("brain").appendChild(xml.documentElement);

    d3.selectAll("path")
      .attr("title", function (d) {
         return _structures[d3.select(this).attr("structure_id")].name;
      });

 
    d3.selectAll("path").attr("id", function () { return 'p' + d3.select(this).attr("id"); })[0]
      .forEach(function (d) {
        var structure_id = d.attributes.structure_id.value,
          path_id = d.id;
        paths[structure_id] = path_id;
      });

    d3.json("allen.json", function(error, root) {
      
      addWeightAndPaths(root, _structures, paths);
      var nodes = partition.nodes(root);

      rect = rect
          .data(nodes)
        .enter().append("rect")
          .attr("class", "node")
          .attr("y", function(d) { return x(d.x); })
          .attr("x", function(d) { return y(d.y); })
          .attr("height", function(d) { return x(d.dx); })
          .attr("width", function(d) { return y(d.dy); })
          .style("fill", function(d) { return '#' + d.color_hex_triplet; })
            .on("mousemove", function(d){
            d3.select("#tooltip2")
                .style("left", event.pageX + "px")
                .style("top", event.pageY + 20 + "px")
                .select("#value")
                .html(d.name);
                

        })
        .on("mouseout", function () {

            //Hide the tooltip
            d3.select("#tooltip2").classed("hidden", true);
      
            })
          .each(function (d) {
            if (d.children == null) {
              var targets = d.targets;
              if (targets != null) {
                targets = targets.map(function (d) { return nodedict[d]; });
                createPath(d, targets);
              }
            };
          })
          .on("click", clicked)
          .on("mouseover", function (d) {
            
            d3.select("#tooltip2").classed("hidden", false);
          
          console.log(d3.select('#' + d.path).attr("id"));
            d3.select("#" + d.path)
            .attr("style", function (d) { console.log('setting color to black.'); return "stroke:black;fill:black"; });
          
          });

      svg.selectAll(".label")
          .data(nodes)
        .enter().append("text")
          .attr("class", "label")
          .attr("dy", ".35em")
          .attr("transform", function(d) { return "translate(" + x(d.x + d.dx / 2) + "," + y(d.y + d.dy / 2) + ")rotate(90)"; })
          .text(function(d) {
            if (x(d.dx) > 6) {
//              return d.name; 
            }
            return '';
          });

    });
  });
});


function clicked(d) {
  x.domain( [d.x, d.x + d.dx] );
  y.domain( [d.y - 10, height - vPadding -d.dy]).range([d.y ? 20 : 0, height]);

  rect.transition()
      .duration(750)
      .attr("y", function(d) { return x(d.x); })
      .attr("x", function(d) { return y(d.y); })
      .attr("height", function(d) { return x(d.x + d.dx) - x(d.x); })
      .attr("width", function(d) { return y(d.y + d.dy) - y(d.y); });

  svg.selectAll(".label")
      .transition(750)
      .duration(750)
      .attr("transform", function(d) { return "translate(" + x(d.x + d.dx / 2) + "," + y(d.y + d.dy / 2) + ")rotate(90)"; })
      .text(function (d) {
        if (x(d.x + d.dx) - x(d.x) > 6) {
//          return d.name;
        }
        return '';
      });

}

var createPath = function (source, dests) {

  path = []
  for (var i = 0; i < dests.length; i++) {
    dest = dests[i];
    if (dest == null) {
      console.log('found endefined target. continueing.');
      continue;
    }
    // Path origin coordinates.
    var startx = x(source.x + source.dx / 2);
    var starty = y(source.y + source.dy);

    // Path distination coordinates
    var endx =   x(dest.x + dest.dx / 2);
    var endy = y(dest.y + dest.dy);

    // Create path coordinates.
    path.push([{ x: startx, y: starty },
        {x: startx, y: starty * 2},
        {x: endx, y: starty * 2},
        {x: endx, y: endy}]);
  };

  svg.selectAll(".link")
      .data(path)
    .enter().append("path")
      .attr("class", "link")
      .attr("d", line);
};
