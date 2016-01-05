var Population = function(args) {
  var emptyness = parseFloat(args.emptyness), // percent of board emptyness [0, 0.99]
      hor_cells = parseInt(args.hor_cells, 10),
      ver_cells = parseInt(args.ver_cells, 10),
      cells = [],
      gen_history = [],
      i, j;

  // starting population
  var randomize = function(threshold) {
    if (typeof(threshold) === 'undefined') {
      threshold = emptyness;
    }

    cells.forEach(function(c){
      c.selected = Math.random() > threshold ? true : false;
    });

    gen_history = [ living_count() ];

    console.log('Starting population created');
    return cells;
  };

  var living_count = function() {
    return cells.filter(function(c){ return c.selected; }).length;
  };

  var useless_gen_history_check = function(limit) {
    var ret = false,
        hard_limit = 500,
        tmp, i;

    if (typeof(limit) === 'undefined')
      limit = 10;

    if (gen_history.length > hard_limit) {
      console.log('gen_history over '+ hard_limit +' generations.');
      ret = true;
    }
    else if (gen_history.length > limit) {
      tmp = gen_history.slice(-1 * limit);

      for (i = 1; i < tmp.length; i++) {
        if (tmp[i] !== tmp[0])
          break;
      }
      // console.log('gen_history check: '+ i +' values checked');

      if (i >= limit) {
        console.log('gen_history before restart', gen_history);
        ret = true;
      }
    }

    return ret;
  };

  var find_neighbours = function(c) {
    // Every cell interacts with its eight neighbours
    var arr = [];
    if (c.col > 0 && c.row > 0)
      arr.push((c.col - 1) * hor_cells + c.row - 1);

    if (c.row > 0)
      arr.push((c.col + 0) * hor_cells + c.row - 1);

    if (c.col < hor_cells - 1 && c.row > 0)
      arr.push((c.col + 1) * hor_cells + c.row - 1);

    if (c.col > 0)
      arr.push((c.col - 1) * hor_cells + c.row + 0);

    if (c.col < hor_cells - 1)
      arr.push((c.col + 1) * hor_cells + c.row + 0);

    if (c.col > 0 && c.row < ver_cells - 1)
      arr.push((c.col - 1) * hor_cells + c.row + 1);

    if (c.row < ver_cells - 1)
      arr.push((c.col + 0) * hor_cells + c.row + 1);

    if (c.col < hor_cells - 1 && c.row < ver_cells - 1)
      arr.push((c.col + 1) * hor_cells + c.row + 1);

    return arr.filter(function(i){
      return i >= 0 && i < cells.length ? true : false;
    });
  };

  var survive = function(c) {
    var ret = false,
        neighbours = find_neighbours(c),
        living = neighbours.filter(function(id){ return cells[id].selected; }),
        living_num = living.length;

    // console.log('cell', c, 'neighbours', neighbours, 'living', living, 'living_num', living_num);

    if (c.selected && living_num >= 2 && living_num <= 3) {
      ret = true;
    }
    else if (!c.selected && living_num === 3) {
      ret = true;
    }

    return ret;
  };

  // unused feature
  var uniq_cells = function(arr) {
    var seen = {},
        out =[],
        i;

    for (i = 0; i < arr.length; i++) {
      if (seen[ arr[i].id ] !== 1) {
        seen[ arr[i].id ] = 1;
        out.push( arr[i] );
      }
    }

    return out;
  };

  var evolve = function() {
    var living = cells.filter(function(c){ return c.selected; }),
        survived = [],
        to_see_cells = {};

    // Optimization. We look around the living cells.
    living.forEach(function(c){
      var ids = find_neighbours(c), i;
      to_see_cells[c.id] = 1;
      for (i = 0; i < ids.length; i++) {
        to_see_cells[ ids[i] ] = 1;
      }
    });

    // survived = cells.filter(survive);
    survived = Object.keys(to_see_cells)
      .map(function(id){ return cells[id]; })
      .filter(survive);

    // console.log('To see:', 'cells',  cells.length);
    // console.log('To see:', 'living', living.length);
    // console.log('To see:', 'selected', Object.keys(to_see_cells).length);
    // console.log('To see:', 'survived', survived.length);

    if (!survived.length) {
      console.log('WARN: No more survivors at generation #'+ gen_history.length +'.');
    }

    living.forEach(function(c){ c.selected = false; });
    survived.forEach(function(c){ c.selected = true; });

    gen_history.push( living_count() );

    if (useless_gen_history_check(10))
      randomize();
  };

  // unused feature
  var turn = function(ids, val) {
    if (typeof(val) === 'undefined')
      val = true;

    ids.forEach(function(id){
      cells[id].selected = val;
    });
    return ids.length;
  };

  // create the population
  for (i = 0; i < hor_cells; i++) {
    for (j = 0; j < ver_cells; j++) {
      cells.push({
        'id': i * hor_cells + j,
        'row': j,
        'col': i,
        'selected': false
      });
    }
  }
  // console.log('population', cells);
  randomize(emptyness);

  return {
    'cells': cells,
    'evolve': evolve,
    'find_neighbours': find_neighbours,
    'generation': function() { return gen_history.length; },
    'history': function() { return gen_history; },
    'hor_cells': hor_cells,
    'randomize': randomize,
    'survive': survive,
    'turn': turn,
    'ver_cells': ver_cells
  };
};

var Board = function(args) {
  var boardId = args.boardId,
      population = args.population,
      // svg dimensions in pixel
      width = parseInt(args.width, 10),
      height = parseInt(args.height, 10),
      // board cell size in pixel
      side_size = Math.floor(width / population.hor_cells);

  if (side_size * population.ver_cells > height) {
    console.log('WARN: side_size * population_vertical_cells > height');
    console.log('WARN: fixing the height');
    height = side_size * population.hor_cells;
  }

  var svg = d3.select('#'+boardId)
    .append('svg')
      .attr('width', width)
      .attr('height', height);

  var tiles = svg.selectAll('rect')
    .data(population.cells).enter()
      .append('rect')
        .attr('id', function(d){ return ['cell', d.id, 'c', d.col, 'r', d.row].join('-'); })
        .attr('class', 'cell')
        .attr('width', side_size)
        .attr('height', side_size)
        .attr('x', function(d){ return d.col * side_size; })
        .attr('y', function(d){ return d.row * side_size; });

  var update_tiles = function() {
    var ret = tiles.classed({ 'selected': function(d){ return d.selected; } });
    // console.log('update tiles', ret.data().filter(function(d){ return d.selected}).length );
  };
  update_tiles();

  return {
    'update_tiles': update_tiles,
  };
};

/*
 * +------------+
 * | header     |
 * +---------+--+
 * |         |  |
 * | bars    |  |
 * |         |  |
 * +---------+--+
 */
var Chart = function(args) {
  var chartId = args.chartId,
    w = args.width,
    h = args.height,
    headerFrame = {
			'w': w,
			'h': 30
		},
		colFrame = {
			'w': 30,
			'h': h - headerFrame.h
		},
    barsFrame = {
			'w': w - colFrame.w,
			'h': h - headerFrame.h,
		},
		barsOverlayFrame = {
			'w': w,
			'h': barsFrame.h
		},
    floatFmt = d3.format('.2f'),
		xScale = d3.scale.linear().range([0, barsFrame.w]),
    yScale = d3.scale.linear().range([1, barsFrame.h]);

	headerFrame.t = [0, 0];
	barsFrame.t   = [0, headerFrame.h];
	colFrame.t    = [barsFrame.w, headerFrame.h];
	barsOverlayFrame.t = barsFrame.t;
  
  var svg = d3.select('#'+chartId).append('svg')
    .attr('width', w)
    .attr('height', h)
    .style('background', 'white');

	// title
  svg.append('g')
      .attr('width', headerFrame.w)
      .attr('height', headerFrame.h)
      .attr('transform', 'translate('+headerFrame.t+')')
      .attr('class', 'chart-header')
		.append('text')
		  .attr('class', 'title')
		  .attr('x', headerFrame.w / 2)
		  .attr('y', headerFrame.h / 2)
      .attr('text-anchor', 'middle')
		  .text('Generations evolution');

  var barsG = svg.append('g')
    .attr('width', barsFrame.w)
    .attr('height', barsFrame.h)
    .attr('transform', 'translate('+barsFrame.t+')')
    .attr('class', 'chart-bars');

  var barsOverlayG = svg.append('g')
    .attr('width', barsOverlayFrame.w)
    .attr('height', barsOverlayFrame.h)
    .attr('transform', 'translate('+barsOverlayFrame.t+')')
    .attr('class', 'chart-bars-overlay');

  var draw = function(data) {
    var barWidth = Math.floor(barsFrame.w / data.length),
			minVal = d3.min(data),
			minPos = data.indexOf(minVal),
			maxVal = d3.max(data),
			maxPos = data.indexOf(maxVal),
			meanVal = floatFmt(d3.mean(data)),
			firstGenVal = data[0],
			lastGen = data.length - 1,
			lastGenVal = data.slice(-1),
			linesData = [
        { 'id': 'min',  'pos': minPos, 'value': minVal },
        { 'id': 'mean', 'pos': 0,      'value': meanVal },
        { 'id': 'max',  'pos': maxPos, 'value': maxVal }
			],
      bars = barsG.selectAll('rect').data(data),
			lines = barsOverlayG.selectAll('line').data(linesData),
			labelsG = barsOverlayG.selectAll('g.label-group').data(linesData),
			labelsG_enter;

		/* histogram */
    xScale.domain([0, data.length]);
    yScale.domain([0, maxVal]);

    bars.enter()
      .append('rect')
			.attr('class', 'bar');

    bars
      .attr('x', function(d,i){ return xScale(i); })
      .attr('y', function(d,i){ return barsFrame.h - yScale(d); })
      .attr('width', barWidth)
      .attr('height', function(d,i){ return yScale(d); });

    bars.exit().remove();

		lines.enter()
			.append('line')
			.attr('x1', xScale(0))
			.attr('x2', xScale(data.length) + 10);

		lines
			.attr('class', function(d){ return 'line '+ d.id; })
			.attr('y1', function(d){ return barsOverlayFrame.h - yScale(d.value); })
			.attr('y2', function(d){ return barsOverlayFrame.h - yScale(d.value); });

		lines.exit().remove();

		/* Here a .parent() method would be nice, but...
		   https://groups.google.com/forum/#!topic/d3-js/mEjem7IPshY
		 Mike Bostock	- 22/10/2011
		 Yes, it's intentional that there's no way to go back up the hierarchy with method chaining: you can only descend. Thank you, Peter, for summarizing my earlier remarks!
		 
		 There are two other technical reasons for not supporting ascension via method chaining.
		 
		 First, any subselection would have to keep a reference to the parent selection that generated it, which is potentially a bit of extra baggage. It might also be possible for the two to get out of sync.
		 
		 Second, it gets more complicated with grouping. When you subselect with selectAll, you group a selection: for each element in the current selection, you select an array of child elements, and each of these arrays becomes a separate group. Separate groups are needed to bind different hierarchical data (such as multi-dimensional arrays) to each group. It's also handy for assigning indexes within a group rather than globally. If you want to go back up the hierarchy by selecting a parent node, you have to decide whether you want to select the parent for each element (in which case the same parent node may be selected multiple times for siblings), or for each group.
		 
		 It's just easier to use variables. You don't have to create a variable for everything; only those cases where you want to append multiple siblings, or bubble back up to a parent after modifying children. And yes, I believe this also encourages you to make your code more readable by naming what you are doing. :)
		 
		 Mike
		 */

		// labels group when data enter
		// create a <g> and append two <text> 
		labelsG_enter = labelsG.enter()
			.append('g')
			.attr('class', function(d) { return 'label-group '+d.id; });

		// the name is not dynamic
	  labelsG_enter
			.append('text')
				.attr('class', function(d) { return 'label name '+d.id; })
				.text(function(d){ return d.id; });

		labelsG_enter
			.append('text')
				.attr('class', function(d) { return 'label value '+d.id; });

		// updating labels group position
		labelsG
      .attr('transform', function(d) { return 'translate('+[barsFrame.w, barsOverlayFrame.h - yScale(d.value) - 5]+')'; });

		// updating <text> label value
		labelsG.selectAll('text.label.value')
      .attr('y', 16)
			.text(function(d){ return d.value; });

		labelsG.exit().remove();

    // console.log('drawed data', data.length, data);
  };

  return {
    'draw': draw
  };
};

