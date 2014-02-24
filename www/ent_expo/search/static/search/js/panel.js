var canvas_width = 500;
var canvas_height = 400;
var cir_rad = 16;
var rel_ent_color = '#3385FF';
var qry_ent_color = '#ED2A34';
var canvas = null;

function init_query_ent_coords(num_ent){
  var coords = new Array();
  if(1 == num_ent){
    var point = {
      x: canvas_width / 2,
      y: canvas_height / 2
    }
    coords.push(point);
  }else if (2 == num_ent){
    var point = {
      x: canvas_width / 3,
      y: canvas_height / 2
    }
    coords.push(point);
    var point = {
      x: canvas_width / 3 * 2,
      y: canvas_height / 2
    }
    coords.push(point);
  }else if (3 == num_ent){
    var point = {
      x: canvas_width / 4,
      y: canvas_height / 2
    }
    coords.push(point);
    var point = {
      x: canvas_width / 4 * 2,
      y: canvas_height / 2
    }
    coords.push(point);
    var point = {
      x: canvas_width / 4 * 3,
      y: canvas_height / 2
    }
    coords.push(point);
  }
  return coords;
}

function init_rel_ent_coords(){
   var coords = new Array();
   // there are always 5 related entities
   // two on the top
   var point = {
     x: canvas_width / 5,
     y: canvas_height / 4
   }
   coords.push(point);
   var point = {
     x: canvas_width / 5 * 4,
     y: canvas_height / 4
   }
   coords.push(point);
   // three on the bottom
   var point = {
     x: canvas_width / 6,
     y: canvas_height / 4 * 3
   }
   coords.push(point);
   var point = {
     x: canvas_width / 6 * 3,
     y: canvas_height / 4 * 3
   }
   coords.push(point);
   var point = {
     x: canvas_width / 6 * 5,
     y: canvas_height / 4 * 3
   }
   coords.push(point);
   return coords;
}

function makeCircle(canvas, coord, text, color, attr, flip) {
  var c = new fabric.Circle({
    left: coord.x,
    top: coord.y,
    strokeWidth: 0,
    radius: cir_rad,
    fill: color,
    stroke: color
  });
  c.hasControls = c.hasBorders = false;
  c.attr = attr;
  
  if(true == flip){
    makeText(canvas, coord.x + 30, coord.y - 40, text);
  }else{
    makeText(canvas, coord.x + 30, coord.y + 40, text)
  }
  canvas.add(c);
}

function makeLine(canvas, p1, p2) {
  coords = [p1.x, p1.y, p2.x, p2.y];
  line = new fabric.Line(coords, {
    fill: '#989898',
    strokeWidth: 5,
    selectable: false
  });
  canvas.add(line);
}

function makeText(canvas, left, top, text) {
  text = new fabric.Text(text, { 
    fontFamily: 'Delicious_500', 
    left: left, 
    top: top,
    fontSize: 16 
  });
  canvas.add(text);
}

function init_ent_canvas(){
  query_ent_coords = init_query_ent_coords(1);
  rel_ent_coords = init_rel_ent_coords();

  var query_ent_array = new Array();
  query_ent_array.push('human smuggling');
  
  var rel_ent_array = new Array();
  rel_ent_array.push('illegal immigration');
  rel_ent_array.push('organized crime');
  rel_ent_array.push('human trafficking');
  rel_ent_array.push('golden venture');
  rel_ent_array.push('illegal entry');
  
  canvas = new fabric.Canvas('c', { selection: false });
  
  for(var i = 0; i < rel_ent_coords.length; ++i){
    makeLine(canvas, query_ent_coords[0], rel_ent_coords[i]);
  }

  makeCircle(canvas, query_ent_coords[0], query_ent_array[0], qry_ent_color, 
    null, true);
  
  for(var i = 0; i < rel_ent_coords.length; ++i){
    makeCircle(canvas, rel_ent_coords[i], rel_ent_array[i], 
      rel_ent_color, 'rel-ent-' + i, i < 2);
  }

  // piggyback on `canvas.findTarget`, to fire "object:over" 
  // and "object:out" events

  canvas.findTarget = (function(originalFn) {
    return function() {
      var target = originalFn.apply(this, arguments);
      if (target) {
        if (this._hoveredTarget !== target) {
          canvas.fire('object:over', { target: target });
          if (this._hoveredTarget) {
            canvas.fire('object:out', { target: this._hoveredTarget });
          }
          this._hoveredTarget = target;
        }
      }
      else if (this._hoveredTarget) {
        canvas.fire('object:out', { target: this._hoveredTarget });
        this._hoveredTarget = null;
      }
      return target;
    };
  })(canvas.findTarget);

  // now we can observe "object:over" and "object:out" events
  // in this example, object is set to red color on hover over and 
  // green color on hover out

  canvas.observe('object:over', ent_hover_over);
  canvas.observe('object:out', ent_hover_out);
}

function ent_hover_over(e){
  e.memo.target.setStrokeWidth(5);
  e.memo.target.setStroke('#111111');
  canvas.renderAll();

  var fill = e.memo.target.getFill();
  if(qry_ent_color == fill){
    $('span.query-ent').attr(
        'prev-bg-color', $('span.query-ent').css('background-color'));
    $('span.query-ent').css('background-color', fill);
  }else if(rel_ent_color == fill){
    var id = e.memo.target.attr;
    id = "span#" + id;
    $('span.rel-ent').attr(
        'prev-bg-color', $('span.rel-ent').css('background-color'));
    $(id).css('background-color', fill);
  }
}

function ent_hover_out(e){
  var fill = e.memo.target.getFill();
  e.memo.target.setStrokeWidth(1);
  e.memo.target.setStroke(fill);  
  canvas.renderAll();

  if(qry_ent_color == fill){
    var color =  $('span.query-ent').attr('prev-bg-color');
    $('span.query-ent').css('background-color', color);
  }else if(rel_ent_color == fill){
    var color =  $('span.rel-ent').attr('prev-bg-color');
    $('span.rel-ent').css('background-color', color);
  }
}

/*
* Initialize the weight panel with jquery.slider on bootstrap
*/
$('div#weight-panel input').each(function(){
  init_ent_canvas();
  $(this).slider({
    formater: function(value) {
      return value.toFixed(1);
    }
  });
});
