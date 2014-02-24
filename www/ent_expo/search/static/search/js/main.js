function loadQueryList(){
  // first, check whether the query list exist
  if(!$('div#query_list div.ql').length){
    // fetch the query list
    $.getJSON("api/query_list", function(data){
      // apply pagination on the query list
      var num_per_list = 20;
      var query_sm_info = ' <small>' + data.length + ' queries in total.</small>';
      $('div#queryModal h4.modal-title').append(query_sm_info);
      
      var ul_num = data.length / num_per_list;
      // query lists
      for(var i = 0; i < ul_num; ++i){
        // one list for every num_per_list queries
        var ul_item = '<div class="ql list-group" id="ql_' + i + '"></div>';
        var query_list = $(ul_item);
        
        for (var j = 0; j < num_per_list; ++j) {
          if(num_per_list * i + j >= data.length){
            break;
          }
          var query = data[num_per_list * i + j];
          var li_item = '<a class="list-group-item" attr="' + query.id 
            + '" href="#">' +  query.id + ' - ' + query.title + '</a>';
          query_list.append(li_item);
        }
        
        $('div#query_list').append(query_list);
      }
      
      // pagination
      var ul_item = '<ul class="pagination" id="ql_pg"></ul>';
      var pg_list = $(ul_item);
      for(var i = 0; i < ul_num; ++i){
        var li_item = '<li><a href="#" attr="' + i + '">' + (i + 1) + '</a></li>';
        pg_list.append(li_item);
      }
      
      $('div#query_pg').append(pg_list);
      
      // initialization
      $('div.ql').hide();
      $('div#ql_0').show();
      $('ul#ql_pg li').each(function(index){
        if("0" == $(this).find('a').attr('attr')){
          $(this).addClass('active');
        }
      });
      
      // event handling setup
      $('ul#ql_pg li a').click(function(){
        var index = $(this).attr('attr');
        var ql_id = 'div#ql_' + index;
        $('div.ql').hide();
        $(ql_id).show();
        $('ul#ql_pg li.active').removeClass('active');
        $(this).parent().addClass('active');
        return false;
      });
      
      $('div.ql a').click(function(){
        query_id = $(this).attr('attr');
        query_text = $(this).text().split(' - ')[1];
        // set the query id and query text in the search box
        $("input[name='query_id']").val(query_id);
        $("input[name='query_text']").val(query_text);
        
        if($('div#home_container form#search_form').length){
          $('div#home_container form#search_form').submit();
        }
        if($('div#search_container form#search_form').length){
          $('div#search_container form#search_form').submit();
          $('#queryModal').modal('toggle');
        }
        
        return false;
      });
    });
  }
}

$("input[name='query_text']").focus(function(){
  loadQueryList();
  // now show up the modal
  $('#queryModal').modal('toggle');
});

$('div#home_container form#search_form').submit(function(event){
  // if no query is selected, prevent it from search
  if("" === $("input[name='query_id']").val()){
    event.preventDefault();
    loadQueryList();
    $('#queryModal').modal('toggle');
  }else{
    return;
  }
});

$('div#search_container form#search_form').submit(function(event){
  // if no query is selected, prevent it from search
  if("" === $("input[name='query_id']").val()){
    loadQueryList();
    $('#queryModal').modal('toggle');
  }else{
    loadRankResults();
  }
  event.preventDefault();
});

function loadRankResults(){
  query_id = $("input[name='query_id']").val();
  url_path = 'api/rank/' + query_id;
  $('p#loading-error').hide();
  // show up the waiting banner
  $('p#loading-info').show();
  
  $.get(url_path)
  .done(function(response){
    //response_json = jQuery.parseJSON(response);
    var rank_list = response.rank_list;
    var num_per_list = 10;
    var list_num = rank_list.length / num_per_list;
    
    // rank lists
    var rank_list_wrapper = $('<div id="rank_list"></div>');
    for(var i = 0; i < list_num; ++i){
      // one list for every num_per_list documents
      var list_html = '<div class="rank-sub-list" id="rl_' + i + '"></div>';
      var list_wrapper = $(list_html);
      
      for (var j = 0; j < num_per_list; ++j) {
        if(num_per_list * i + j >= rank_list.length){
          break;
        }
        var rank_item = rank_list[num_per_list * i + j];
        var doc_meta_html = '<span class="doc-meta"> [' 
          + rank_item.doc_id + ']</span>';
        var snippet_html = '<p class="snippet">' + rank_item.snippet 
          + doc_meta_html + '</p>';
        var title_html = '<a href="doc/' + rank_item.doc_pk 
          + '" target="_blank"> ' + rank_item.title + '</a>';
        var rank_item_html = '<div class="rank-item" href="#">' + title_html
          +  snippet_html + '</div>';
        list_wrapper.append(rank_item_html);
      }
      
      rank_list_wrapper.append(list_wrapper);
    }
    $('div#rank_list').replaceWith(rank_list_wrapper);
    
    // pagination
    var ul_item = '<ul class="pagination" id="rank_pg"></ul>';
    var pg_list = $(ul_item);
    for(var i = 0; i < list_num; ++i){
      var li_item = '<li><a href="#" attr="' + i + '">' + (i + 1) + '</a></li>';
      pg_list.append(li_item);
    }
    
    $('div#rank_pg').empty().append(pg_list);
    
    // initialization
    $('div.rank-sub-list').hide();
    $('div#rl_0').show();
    $('ul#rank_pg li').each(function(index){
      if("0" == $(this).find('a').attr('attr')){
        $(this).addClass('active');
      }
    });
    
    $('p#loading-info').hide();
    var summary = '<p id="rank-summary">Page ' 
     + '<span id="cur_rank_page">1</span> of ' + rank_list.length 
     + ' results in total</p>';
    $('p#rank-summary').replaceWith(summary);
    
    // event handling setup
    $('ul#rank_pg li a').click(function(){
      var index = $(this).attr('attr');
      var rl_id = 'div#rl_' + index;
      $('div.rank-sub-list').hide();
      $(rl_id).show();
      $('ul#rank_pg li.active').removeClass('active');
      $(this).parent().addClass('active');
      $('span#cur_rank_page').text(parseInt(index) + 1);
      return false;
    });
  })
  .fail(function(response) {
    msg = 'Oops. An error has occurred: ' + response.error_msg;
    $('p#loading-error').text(msg).show();
    $('p#loading-info').hide();
  })
  .always(function() {
    // TODO clear up the waiting banner
  });
}

$(document).ready(function(){
  if(!$('div#search_container form#search_form').length){
    return;
  }
  $('div#search_container form#search_form').submit();
  
  // fix the position of footer
  $('div#footer').css('position', 'relative');
});
