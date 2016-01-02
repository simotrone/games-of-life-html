function GoL_js (args) {
  var CELLS_NUMBER = args.cells_number,
      BOARD = args.board;

  function drawTable() {
  	var selector = BOARD;
  			cells_number = CELLS_NUMBER;
  
  	var margin = {
  		top:    20,
  		right:  20,
  		bottom: 20,
  		left:   20
  	};
  
  	var width  = 440 - margin.right - margin.left,
  	    height = 440 - margin.top   - margin.bottom;
  	
  	var side = {
  		w: width  / cells_number,
  		h: height / cells_number
  	};
  
  	var chart = d3.select(selector)
  			.attr("width",  width  + margin.left + margin.right)
  			.attr("height", height + margin.top  + margin.bottom)
  		.append("g")
  			.attr("transform","translate("+ margin.left +","+ margin.top +")");
  
  	var i,j;
  	var row = 0,
  	    col = 0;
  
  	for (i = 0; i < width; i += side.w) {
  		for (j = 0; j < height; j += side.h) {
  			chart.append("rect")
  				.attr("id","cellr"+ row +"c"+ col)
  				.attr("data-row",row)
  				.attr("data-col",col)
  				.classed("cell",true)
  				.attr("x", col * side.w)
  				.attr("y", row * side.h)
  				.attr("width", side.w)
  				.attr("height", side.h)
  				;
  			col++;
  		}
  		row++;
  		col = 0;
  	}
  }

  function cellId(coord) { return "#cellr" + coord[0] +"c" + coord[1]; }

  function cellOn(coord) {
  	var id = cellId(coord);
  	d3.select(id).classed("selected",true);
  }

  function cellOff(coord) {
  	var id = cellId(coord);
  	d3.select(id).classed("selected",false);
  }

  /* Neighbours computing
   *
   *  +-+-+-+
   *  |5|1|6|
   *  +-+-+-+
   *  |3| |4|
   *  +-+-+-+
   *  |7|2|8|
   *  +-+-+-+
   */
  function neighbours(coord) {
		var cells_number = CELLS_NUMBER;
  	coord[0] = parseInt(coord[0], 10);
  	coord[1] = parseInt(coord[1], 10);

  	var ids = [];
  	if ( coord[0] > 0 )
  		ids.push( cellId([ coord[0] -1, coord[1] ]) );
  	if ( coord[0] < cells_number -1 )
  		ids.push( cellId([ coord[0] +1, coord[1] ]) );
  
  	if ( coord[1] > 0 )
  		ids.push( cellId([ coord[0], coord[1] -1 ]) );
  	if ( coord[1] < cells_number -1 )
  		ids.push( cellId([ coord[0], coord[1] +1 ]) );
  
  	if ( coord[0] > 0 && coord[1] > 0 )
  		ids.push( cellId([ coord[0] -1, coord[1] -1 ]) );
  	if ( coord[0] > 0 && coord[1] < cells_number -1 )
  		ids.push( cellId([ coord[0] -1, coord[1] +1 ]) );
  	if ( coord[0] < cells_number -1 && coord[1] > 0)
  		ids.push( cellId([ coord[0] +1, coord[1] -1 ]) );
  	if ( coord[0] < cells_number -1 && coord[1] < cells_number -1 )
  		ids.push( cellId([ coord[0] +1, coord[1] +1 ]) );
  
    return ids;
  }

  function neighbours_cached(data_struct, coord) {
  	var identifier = "x:"+ coord[0] +",y:"+ coord[1];
  	if ( ! data_struct.hasOwnProperty( identifier ) ) {
  		data_struct[identifier] = neighbours(coord);
  	}
  	return data_struct[identifier];
  }

  function tick() {
  	var living_cells = [],
  	    dying_cells  = [],
  			living,
  			key,
  			ids = {};
  	var nb_cache = {};
  
  	d3.selectAll(".selected")[0].forEach(function(el){
  		var cell = d3.select(el);
  		var coord = [cell.attr("data-row"), cell.attr("data-col")];
  		ids[ cell.attr("id") ] = neighbours_cached(nb_cache, coord);
  	});
  	//console.log("all neighbours:",ids);
  
  	for (key in ids) {
  		living = 0;
  		ids[key].forEach(function(id) {
  			var cell  = d3.select(id);
  		  var coord = [cell.attr("data-row"), cell.attr("data-col")];
  			var near_living = 0;
  
  			// Rules #1,#2,#3
  			if ( cell.classed("selected") )
  				living++;
  
  			// Rule #4
  			neighbours_cached(nb_cache,coord).forEach(function(id) {
  				if ( d3.select(id).classed("selected") )
  					near_living++;
  			});
  			if ( near_living == 3 )
  				living_cells.push(id);
  		});
  
  		if (living < 2 || living > 3 ) {
  			dying_cells.push('#'+key);
  		} else {
  			living_cells.push('#'+key);
  		}
  	}
  
  	living_cells.forEach(function(id){ d3.select(id).classed("selected",true); });
  	dying_cells.forEach(function(id){ d3.select(id).classed("selected",false); });
  	return 1;
  }

  function evolution(time) {
  	if (!time)
  		time = 200;
  
  	setInterval(tick, time);
  	console.log("evolution", new Date);
  }

  function populate(num) {
		var cells_number = CELLS_NUMBER;
  	if (!num)
  		num = parseInt(cells_number * cells_number /5, 10);
  
  	var i;
  	for (i=0; i < num; i++) {
  		cellOn([
  		  parseInt(Math.random() * cells_number, 10), 
  			parseInt(Math.random() * cells_number, 10) 
  		]);
  	}
  	console.log("populate: " + num, new Date);
  	return num;
  }

	return {
		draw: drawTable,
		populate: populate,
		evolution: evolution,
		run: function () {
			populate();
			evolution();
		}
	};
};

