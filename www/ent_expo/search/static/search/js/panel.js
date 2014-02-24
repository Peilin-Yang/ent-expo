var canvas_width = 500;
var canvas_height = 300;
var cir_rad = 16;
var rel_ent_color = '#3385FF';
var qry_ent_color = '#ED2A34';
var hover_strock_color = '#111111';
var hover_strock_width = 5;
var canvas = null;

canvas = new fabric.Canvas('c', { selection: false });

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
  // round up the float numbers to int
  //for(var i = 0; i < coords.length; ++i){
    //coords[i].x = Math.round(coords[i].x);
    //coords[i].y = Math.round(coords[i].y);
  //}
  return coords;
}

function init_rel_ent_coords(num_ent){
   var coords = new Array();
   // there are always 5 related entities
   // two on the top
   var point = {
     x: canvas_width / 5,
     y: canvas_height / 5
   }
   coords.push(point);
   var point = {
     x: canvas_width / 5 * 4,
     y: canvas_height / 5
   }
   coords.push(point);
   // three on the bottom
   var point = {
     x: canvas_width / 6,
     y: canvas_height / 5 * 4
   }
   coords.push(point);
   var point = {
     x: canvas_width / 6 * 3,
     y: canvas_height / 5 * 4
   }
   coords.push(point);
   var point = {
     x: canvas_width / 6 * 5,
     y: canvas_height / 5 * 4
   }
   coords.push(point);
   
   var ret_coords = new Array();
   for(var i = 0; i < num_ent; ++i){
     ret_coords.push(coords[i]);
   }
   
   // round up the float numbers to int
   //for(var i = 0; i < ret_coords.length; ++i){
     //ret_coords[i].x = Math.round(ret_coords[i].x);
     //ret_coords[i].y = Math.round(ret_coords[i].y);
   //}
   return ret_coords;
}

function makeCircle(coord, text, color, attr, flip) {
  var c = new fabric.Circle({
    left: coord.x,
    top: coord.y,
    strokeWidth: 1,
    radius: cir_rad,
    fill: color,
    stroke: color
  });
  c.hasControls = c.hasBorders = false;
  c.attr = attr;
  c.set('lockMovementX', true);
  c.set('lockMovementY', true);
  
  if(true == flip){
    makeText(coord.x + 30, coord.y - 30, text);
  }else{
    makeText(coord.x + 30, coord.y + 30, text)
  }
  canvas.add(c);
}

function makeLine(p1, p2) {
  coords = [p1.x, p1.y, p2.x, p2.y];
  line = new fabric.Line(coords, {
    fill: '#989898',
    strokeWidth: 5,
    selectable: false
  });
  canvas.add(line);
}

function makeText(left, top, text) {
  text = new fabric.Text(text, { 
    fontFamily: 'Delicious_500', 
    left: left, 
    top: top,
    fontSize: 16,
    selectable: false
  });
  canvas.add(text);
}

function load_rel_ent_list(){
  query_id = $("input[name='query_id']").val();
  url_path = 'api/ent_list/' + query_id;
  $('p#loading-ent-error').hide();
  // show up the waiting banner
  $('p#loading-ent-info').show();
  
  $.get(url_path)
  .done(function(response){
    var rank_list = response.rank_list;
    var qry_ent_hash = new Object();
    
    // collect all the query entities
    for(var i = 0; i < rank_list.length; ++i){
      var rank_item = rank_list[i];
      qry_ent_hash[rank_item.query_ent_uri] = {
        uri: rank_item.query_ent_uri,
        name: rank_item.query_ent_name,
        id: rank_item.query_ent_id
      };
    }
    
    var qry_ent_list = new Array();
    for(var qry_ent in qry_ent_hash){
      qry_ent_list.push(qry_ent_hash[qry_ent]);
    }
    
    // re-map each query entity to an index in qent_array
    var qry_ent_idx_hash = new Object();
    for(var i = 0; i < qry_ent_list.length; ++i){
      var uri = qry_ent_list[i].uri;
      qry_ent_idx_hash[uri] = i;
    }
    
    var rel_ent_list = new Array();
    for(var i = 0; i < rank_list.length; ++i){
      var rank_item = rank_list[i];
      rel_ent = {
        uri: rank_item.ent_uri,
        name: rank_item.ent_name,
        id: rank_item.ent_id,
        qry_ent_idx: qry_ent_idx_hash[rank_item.query_ent_uri]
      };
      rel_ent_list.push(rel_ent);
    }
    
    init_ent_canvas(qry_ent_list, rel_ent_list);
    init_weight_panel(rel_ent_list);
  })
  .fail(function(response) {
    msg = 'Oops. An error has occurred: ' + response.error_msg;
    $('p#loading-ent-error').text(msg).show();
  })
  .always(function() {
    $('p#loading-ent-info').hide();
  });
}

function init_ent_canvas(qry_ent_list, rel_ent_list){
  // first, load the related entites
  qry_ent_coords = init_query_ent_coords(qry_ent_list.length);
  rel_ent_coords = init_rel_ent_coords(rel_ent_list.length);
  
  for(var i = 0; i < rel_ent_coords.length; ++i){
    qry_ent_idx = rel_ent_list[i].qry_ent_idx;
    makeLine(qry_ent_coords[qry_ent_idx], rel_ent_coords[i]);
  }
  
  for(var i = 0; i < qry_ent_coords.length; ++i){
    makeCircle(qry_ent_coords[i], qry_ent_list[i].name, 
      qry_ent_color, 'qry-ent-' + qry_ent_list[i].id, true);
  }
  
  for(var i = 0; i < rel_ent_coords.length; ++i){
    makeCircle(rel_ent_coords[i], rel_ent_list[i].name, 
      rel_ent_color, 'rel-ent-' + rel_ent_list[i].id, i < 2);
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
  canvas.observe('object:over', ent_hover_over);
  canvas.observe('object:out', ent_hover_out);
  canvas.observe('object:selected', ent_selected);
}

function ent_hover_over(e){
  e.memo.target.setStrokeWidth(hover_strock_width);
  e.memo.target.setStroke(hover_strock_color);
  canvas.renderAll();

  // use fill color to determine whether it is query entity or related entity
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

  // use fill color to determine whether it is query entity or related entity
  //var fill = e.memo.target.getFill();
  if(qry_ent_color == fill){
    var color =  $('span.query-ent').attr('prev-bg-color');
    $('span.query-ent').css('background-color', color);
  }else if(rel_ent_color == fill){
    var color =  $('span.rel-ent').attr('prev-bg-color');
    $('span.rel-ent').css('background-color', color);
  }
}

function ent_selected(e){
  var id = e.memo.target.attr;
  console.log('object:selected: ' + id);
}

function init_weight_panel(){
  /*
  * Initialize the weight panel with jquery.slider on bootstrap
  */
  $('div#weight-panel input').each(function(){
    $(this).slider({
      formater: function(value) {
        return value.toFixed(1);
      }
    });
  });
}

function update_ent_panel(ent_id){
  query_id = $("input[name='query_id']").val();
  url_path = 'api/ent_list/' + query_id;
  $('p#loading-ent-error').hide();
  // show up the waiting banner
  $('p#loading-ent-info').show();
  
  $.get(url_path)
  .done(function(response){
    //response_json = jQuery.parseJSON(response);
    var rank_list = response.rank_list;

  })
  .fail(function(response) {
    msg = 'Oops. An error has occurred: ' + response.error_msg;
    console.log(msg);
  })
  .always(function() {
  });
}

$(document).ready(function(){
  setTimeout(load_rel_ent_list, 500);
  $.tmpl( "<p>${Name}</p>", { "Name" : "jQuery template works." }).appendTo('div#footer');
});



