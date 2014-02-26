function update_compare_page(div_name, rank_list, is_baseline, show_rank_diff){
  var num_per_list = 10;
  var list_num = rank_list.length / num_per_list;
  
  // rank lists
  var rank_list_wrapper = $('<div id="'+div_name+'"></div>');
  for(var i = 0; i < list_num; ++i){
    // one list for every num_per_list documents
    var list_html = '<div class="rank-sub-list" id='+div_name+'_rl_' + i + '"></div>';
    var list_wrapper = $(list_html);
    
    for (var j = 0; j < num_per_list; ++j) {
      var global_idx = num_per_list * i + j;
      if(global_idx >= rank_list.length){
        break;
      }
      var rank_item = rank_list[global_idx];
      var doc_meta_html = '<span class="doc-meta"> [' 
        + rank_item.doc_id + ']</span>';
      var snippet_html = '<p class="snippet">' + rank_item.snippet 
        + doc_meta_html + '</p>';
      var title_html = '<a href="doc/' + rank_item.doc_pk 
        + '" target="_blank"> ' + (global_idx+1) + ". " + rank_item.title + '</a>';

      if (is_baseline) {
        if (rank_item.is_rel > 0) {
          title_html += '<i class="fa fa-check-circle-o" style="color:green;"></i>';
        } else {
          title_html += '<i class="fa fa-times-circle-o" style="color:red;"></i>';
        }
      }

      if (show_rank_diff) {
        title_html += '(' + rank_item.rank_diff + ')';
        if (rank_item.is_rel > 0) {

          if (parseInt(rank_item.rank_diff) > 0) {
            title_html += '<i class="fa fa-arrow-up" style="color:green;"></i>';
          } else if (parseInt(rank_item.rank_diff) < 0) {
            title_html += '<i class="fa fa-arrow-down" style="color:red;"></i>';
          }
        } else {
          if (parseInt(rank_item.rank_diff) > 0) {
            title_html += '<i class="fa fa-arrow-up" style="color:orange;"></i>';
          } else if (parseInt(rank_item.rank_diff) < 0) {
            title_html += '<i class="fa fa-arrow-down" style="color:cyan;"></i>';
          }  
        }
      }

      var rank_item_html = '<div class="rank-item" href="#">' + title_html
        +  snippet_html + '</div>';
      
      list_wrapper.append(rank_item_html);
    }
    
    rank_list_wrapper.append(list_wrapper);
  }
  $('div#'+div_name).replaceWith(rank_list_wrapper);
}

function setup_pagination(div_name, rank_list){
  // pagination
  var num_per_list = 10;
  var list_num = rank_list.length / num_per_list;
  var ul_item = '<ul class="pagination" id="compare-pagination"></ul>';
  var pg_list = $(ul_item);
  for(var i = 0; i < list_num; ++i){
    var li_item = '<li><a href="#" attr="' + i + '">' + (i + 1) + '</a></li>';
    pg_list.append(li_item);
  }
  
  $('div#compare-pagination').empty().append(pg_list);
  
  // initialization
  $('div[id^='+div_name+'_rl_'+']').hide();
  $('div[id^='+div_name+'_rl_0'+']').show();
  $('ul#compare-pagination li').each(function(index){
    if("0" == $(this).find('a').attr('attr')){
      $(this).addClass('active');
    }
  });
  
  var summary = '<p id="compare-rank-summary">Page ' 
   + '<span id="compare-cur_rank_page">1</span> of ' + rank_list.length 
   + ' results in total</p>';
  $('p#compare-rank-summary').replaceWith(summary);
}



$("body").on("click", "button#compare-btn", function(event){
  var query_id = $("input[name='query_id']").val();
  var url_path = 'api/compare/' + query_id;

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

  /*
  if ($('#ent-weight-list').attr('value') == "false") {
    $('p#compare-no-para-hint').show();
    return;
  }
  */

  $('#loading-compare-list-error').hide();
  // show up the waiting banner
  $('#loading-compare-list-info').show();

  $('div#original-ranking-list').hide();
  $('div#original-panel').hide();

  $.getJSON(url_path, {'paras':weight_json_str})
    .done(function(data) {
      //console.log( "get compare results success" );
      $('div#compare-heading').show();
      $('div#compare-ranking-list-left').show();
      $('div#compare-ranking-list-right').show();
      $('#compare-pagination').show();

      update_compare_page("compare-ranking-list-left", data.rank_list[0], true, false);
      update_compare_page("compare-ranking-list-right", data.rank_list[1], false, true);
      setup_pagination("compare-ranking-list-left", data.rank_list[0]);
      setup_pagination("compare-ranking-list-right", data.rank_list[1]);

      // event handling setup
      $('ul#compare-pagination li a').click(function(){
        var index = $(this).attr('attr');
        var rl_id1 = 'div[id^='+'compare-ranking-list-left'+'_rl_'+index+']';
        var rl_id2 = 'div[id^='+'compare-ranking-list-right'+'_rl_'+index+']';
        $('div[id^='+'compare-ranking-list-left_rl_'+']').hide();
        $('div[id^='+'compare-ranking-list-right_rl_'+']').hide();
        $(rl_id1).show();
        $(rl_id2).show();
        $('ul#compare-pagination li.active').removeClass('active');
        $(this).parent().addClass('active');
        $('span#compare-cur_rank_page').text(parseInt(index) + 1);
        return false;
      });
    })
    .fail(function() {
      //console.log( "get compare results error" );
      msg = 'Oops. An error has occurred: ' + response.error_msg;
      $('p#loading-compare-list-error').text(msg).show();
    })
    .always(function() {
      //console.log( "get compare complete" );
      $('#loading-compare-list-info').hide();
    });
});


$("body").on("click", "button#compare-close", function(event){
  $('div#compare-heading').hide();
  $('div#compare-ranking-list-left').hide();
  $('div#compare-ranking-list-right').hide();
  $('p#loading-compare-list-error').hide();
  $('#loading-compare-list-info').hide();
  $('p#compare-no-para-hint').hide();
  $('p#compare-rank-summary').hide();
  $('#compare-pagination').hide();

  $('div#original-ranking-list').show();
  $('div#original-panel').show();
});


$(document).ready(function(){
  $('div#compare-heading').hide();
  $('div#compare-ranking-list-left').hide();
  $('div#compare-ranking-list-right').hide();
  $('p#loading-compare-list-error').hide();
  $('#loading-compare-list-info').hide();
  $('p#compare-no-para-hint').hide();
  $('p#compare-rank-summary').hide();
  $('#compare-pagination').hide();

  $('#compare-close').tooltip();
  //$('#compare-btn').tooltip();
});

