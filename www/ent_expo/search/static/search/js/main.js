function loadQueryList(){
  // first, check whether the query list exist
  if(!$('div#query_list div.ql').length){
    // fetch the query list
    $.getJSON("query_list", function(data){
      // apply pagination on the query list
      var num_per_list = 20;
      var query_sm_info = ' <small>' + data.length + ' queries in total.</small>';
      $('div#queryModal h4.modal-title').append(query_sm_info);
      
      var ul_num = data.length / num_per_list;
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
      pg_list = $(ul_item);
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
        $('#queryModal').modal('toggle');
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

$('form#search_form').submit(function(event){
  // if no query is selected, prevent it from search
  if("" === $("input[name='query_id']").val()){
    event.preventDefault();
    loadQueryList();
    $('#queryModal').modal('toggle');
  }else{
    return;
  }
});
