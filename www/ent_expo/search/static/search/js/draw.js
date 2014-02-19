var point0 = {
    x: 220,
    y: 160
}

var point1 = {
    x: 75,
    y: 80
}

var point2 = {
    x: 275,
    y: 80
}

var point3 = {
    x: 30,
    y: 250
}

var point4 = {
    x: 200,
    y: 300
}

var point5 = {
    x: 360,
    y: 250
}

var str0 = 'human smuggling';
var str1 = 'illegal immigration';
var str2 = 'organized crime';
var str3 = 'human trafficking';
var str4 = 'golden venture';
var str5 = 'illegal entry';

var cir_rad = 16;
var rel_ent_color = '#3385FF';
var qry_ent_color = '#ED2A34';

var canvas = new fabric.Canvas('c', { selection: false });

function makeCircle(left, top, text, spc, flip, line1, line2, line3, 
    line4, line5, line6) {
  var c = new fabric.Circle({
    left: left,
    top: top,
    strokeWidth: 0,
    radius: cir_rad,
    fill: rel_ent_color,
    stroke: rel_ent_color
  });
  c.hasControls = c.hasBorders = false;

  c.line1 = line1;
  c.line2 = line2;
  c.line3 = line3;
  c.line4 = line4;
  c.line5 = line5;
  c.line6 = line6;
  
  c.spc = spc;
  
  if(true == flip){
      canvas.add(
        makeText(left + 30, top - 40, text)
      );  
  }else{
      canvas.add(
          makeText(left + 30, top + 40, text)
      );
  }
  
  return c;
}

function makeQueryCircle(left, top, text, line1, line2, line3, 
    line4, line5, line6) {
  var c = new fabric.Circle({
    left: left,
    top: top,
    strokeWidth: 0,
    radius: cir_rad,
    fill: qry_ent_color,
    stroke: qry_ent_color
  });
  c.hasControls = c.hasBorders = false;

  c.line1 = line1;
  c.line2 = line2;
  c.line3 = line3;
  c.line4 = line4;
  c.line5 = line5;
  c.line6 = line6;

  canvas.add(
    makeText(left + 100, top, text)
  );

  return c;
}

function makeLine(coords) {
  return new fabric.Line(coords, {
    fill: '#989898',
    strokeWidth: 5,
    selectable: false
  });
}

function makeText(cord_left, cord_top, text) {
  return new fabric.Text(text, { 
    fontFamily: 'Delicious_500', 
    left: cord_left, 
    top: cord_top,
    fontSize: 16 
  });
}

var line1 = makeLine([ point0.x, point0.y, point1.x, point1.y ]),
    line2 = makeLine([ point0.x, point0.y, point2.x, point2.y ]),
    line3 = makeLine([ point0.x, point0.y, point3.x, point3.y ]),
    line4 = makeLine([ point0.x, point0.y, point4.x, point4.y ]),
    line5 = makeLine([ point0.x, point0.y, point5.x, point5.y ]);

canvas.add(line1, line2, line3, line4, line5);

canvas.add(
  makeQueryCircle(line1.get('x1'), line1.get('y1'), str0, 
      null, line1, line2, line3, line4, line5),
  makeCircle(line1.get('x2'), line1.get('y2'), str1, 'rel-ent-1', true, line1),
  makeCircle(line2.get('x2'), line2.get('y2'), str2, 'rel-ent-2', true, line2),
  makeCircle(line3.get('x2'), line3.get('y2'), str3, 'rel-ent-3', false, line3),
  makeCircle(line4.get('x2'), line4.get('y2'), str4, 'rel-ent-4', false, line4),
  makeCircle(line5.get('x2'), line5.get('y2'), str5, 'rel-ent-5', false, line5)
);

canvas.observe('object:moving', function(e) {
  var p = e.memo.target;
  if(p.isType('circle')){
    p.line1 && p.line1.set({ 'x2': p.left, 'y2': p.top });
    p.line2 && p.line2.set({ 'x1': p.left, 'y1': p.top });
    p.line3 && p.line3.set({ 'x1': p.left, 'y1': p.top });
    p.line4 && p.line4.set({ 'x1': p.left, 'y1': p.top });
    p.line5 && p.line5.set({ 'x1': p.left, 'y1': p.top });
    p.line6 && p.line6.set({ 'x1': p.left, 'y1': p.top });
  }
  canvas.renderAll();
});


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

canvas.observe('object:over', function(e) {
  e.memo.target.setStrokeWidth(5);
  e.memo.target.setStroke('#111111');
  canvas.renderAll();
  
  var fill = e.memo.target.getFill();
  if(qry_ent_color == fill){
    $('span.query-ent').attr(
        'prev-bg-color', $('span.query-ent').css('background-color'));
    $('span.query-ent').css('background-color', fill);
  }else if(rel_ent_color == fill){
    var id = e.memo.target.spc;
    id = "span#" + id;
    $('span.rel-ent').attr(
        'prev-bg-color', $('span.rel-ent').css('background-color'));
    $(id).css('background-color', fill);
  }
});

canvas.observe('object:out', function(e) {
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
});

jQuery_1_7_1('.slider').slider({ 
  from: 0.0, 
  to: 1.0, 
  scale: [0.0, 0.2, 0.4, 0.6, 0.8, 1.0], 
  limits: false, 
  step: 0.1, 
  dimension: '',
  round: 1,
  format: { 
      format: '0.#', locale: 'us' 
  },
  skin: "plastic", 
  callback: function( value ){ 
      console.dir( this ); 
  } 
});
