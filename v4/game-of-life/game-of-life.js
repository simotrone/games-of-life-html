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
        hard_limit = 1000,
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

var Chart = function(args) {
  var chartId = args.chartId,
    data = args.data || [],
    w = 600,
    h = 400,
    header_h = 30,
    barsG_h = h - header_h;
  
  var svg = d3.select('#'+chartId)
    .append('svg')
      .attr('width', w)
      .attr('height', h)
      .style('background', 'white');

  var textG = svg.append('g')
    .attr('width', w)
    .attr('height', header_h)
    // .attr('transform', 'translate('+[0, 0]+')')
    .attr('class', 'chart-header');

  // textG.append('text').text('pippo');

  var barsG = svg.append('g')
    .attr('width', w)
    .attr('height', barsG_h)
    .attr('transform', 'translate('+[0, header_h]+')')
    .attr('class', 'chart-bars');

  var xScale = d3.scale.linear().range([0, w]),
      yScale = d3.scale.linear().range([1, barsG_h]);

  var floatFmt = d3.format('.2f');

  var draw = function(data) {
    var barWidth = Math.floor(w / data.length),
      bars = barsG.selectAll('rect').data(data),
      labelValues = [
        { 'id': 'gen0', 'value': data[0] },
        { 'id': 'min',  'value': d3.min(data) },
        { 'id': 'mean', 'value': floatFmt(d3.mean(data)) },
        { 'id': 'max',  'value': d3.max(data) },
        { 'id': 'gen'+(data.length - 1), 'value': data.slice(-1) }
    
      ],
      labels = textG.selectAll('text').data(labelValues);

    labels.enter()
      .append('text')
      .attr('class', 'label')
      .attr('text-anchor', 'middle')

    labels
      .attr('y', 20)
      .attr('x', function(d,i){ return 50 + i * w / labelValues.length; })
      .text(function(d,i){ return d.id+' = '+d.value; });

    labels.exit()
      .remove();

    xScale.domain([0, data.length]);
    yScale.domain([0, d3.max(data)]);

    bars.enter()
      .append('rect')
        // .attr('opacity', 0)
        .attr('class', 'bar');

    bars
      // .transition()
      // .attr('opacity', 1)
      .attr('x', function(d,i){ return xScale(i); })
      .attr('y', function(d,i){ return barsG_h - yScale(d); })
      .attr('width', barWidth)
      .attr('height', function(d,i){ return yScale(d); });

    // .text(function(d,i){ return '('+i+','+d+')'; });o

    bars.exit()
      .remove();

    // console.log('drawed data', data.length, data);
  };

  draw(data);

  return {
    'draw': draw
  };
};

