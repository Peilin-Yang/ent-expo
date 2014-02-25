var canvas_width = 400;
var canvas_height = 300;
var cir_rad = 16;
var rel_ent_color = '#3385FF';
var qry_ent_color = '#ED2A34';
var hover_strock_color = '#111111';
var hover_strock_width = 5;
var canvas = null;
var rel_ent_weight_list;

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
    $('p#loading-ent-info').hide();
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
  var canvas_html = 
    $('<canvas id="ent-graph" width="400" height="300"></canvas>');
  $('div#entity-relation').append(canvas_html);
  canvas = new fabric.Canvas('ent-graph', { selection: false });
  
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
  var attr = e.memo.target.attr;
  var ent_id = attr.split('-').pop();
  console.log('object:selected: ' + ent_id);
  update_ent_infobox(ent_id);
}

function init_weight_panel(rel_ent_list){
  /*
  * Initialize the weight panel with jquery.slider on bootstrap
  */
  
  var slider_template = '\
  <tr>\
    <td class="ent">${name}</td>\
    <td class="weight">\
      <b>0.0</b>\
      <input data-slider-id="${id}" type="text" data-slider-min="0" \
        data-slider-max="1.0" data-slider-step="0.1" data-slider-value="0.5"/>\
      <b>1.0</b>\
    </td>\
  </tr>'
  
  for(var idx in rel_ent_list){
    $.tmpl(slider_template, { 'name': rel_ent_list[idx].name, 
      'id': rel_ent_list[idx].id }).appendTo('table#ent-weight tbody');
  }
          
  $('div#weight-panel input').each(function(){
    $(this).slider({
      formater: function(value) {
        return value.toFixed(1);
      }
    });
  }).on('slide', update_ret_list);
}

function update_ret_list(slideEvt){
  /*
  * Update the ranking results with the re-weighted related entities
  */
  // first, clear the related entity weight list
  rel_ent_weight_list = new Array();
  // then, update it with the new weight
  $('div#weight-panel input').each(function(){
    var ent_id = $(this).attr('data-slider-id');
    var weight = $(this).slider('getValue');
    rel_ent_weight_list.push({
      id: ent_id,
      weight: weight.toFixed(1)
    });
  });
  weight_json_str = JSON.stringify(rel_ent_weight_list);
  console.log(weight_json_str);
  $("input[name='ent-weight-list']").val(weight_json_str);
  
  query_id = $("input[name='query_id']").val();
  url_path = 'api/rerank/' + query_id;
  $('p#loading-error').hide();
  // show up the waiting banner
  $('p#loading-info').show();
  
  $.post(url_path, $('form#ent-weight-form').serialize())
  .done(function(response){
    update_rank_list(response.rank_list);
  })
  .fail(function(response) {
    msg = 'Oops. An error has occurred: ' + response.error_msg;
    $('p#loading-error').text(msg).show();
  })
  .always(function() {
    $('p#loading-info').hide();
  });
}

function update_ent_infobox(ent_id){
  url_path = 'api/ent/' + ent_id;
  $.get(url_path)
  .done(function(response){
    var ent_infobox_table = $('<table id="ent_infobox" class="table \
      table-condensed">\
      <thead>\
      <tr>\
        <th>Name</th>\
        <th>Value\
          <button title="click to close" type="button" class="close"\
          id="close-ent-infobox">&times;</button></th>\
      </tr>\
      </thead>\
      </table>');
      
    $.tmpl( '<tr><td>DBpedia URI</td><td><a target="_blank" href="${uri}">\
      ${uri}</a></td></tr>', { 'name':  response.name, 
      'uri': response.uri}).appendTo(ent_infobox_table);
    var infobox_hash = response.infobox;
    for(var predicate in infobox_hash){
      var value = infobox_hash[predicate];
      var name = predicate.split('\/').pop();
      $.tmpl( '<tr><td>${name}</td><td>${value}</td></tr>',
        { 'name':  name, 'value': value}).appendTo(ent_infobox_table);
    }
    var abstract = response.abstract;
    if('' !== abstract){
      name = 'Abstract';
      value = abstract;
      $.tmpl( '<tr><td>${name}</td><td>${value}</td></tr>',
        { 'name':  name, 'value': value}).appendTo(ent_infobox_table);
    }
    $('table#ent_infobox').replaceWith(ent_infobox_table);
    $('table#ent_infobox button#close-ent-infobox').click(function(){
      $('table#ent_infobox').hide();
    })
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
  $.tmpl('<p>${test}</p>', { 'test' : 'jQuery \
    template works.' }).appendTo('div#footer');
});

