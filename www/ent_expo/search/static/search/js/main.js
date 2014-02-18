$('#search_form').submit(function(){
  return false;
});

$('input#searchQuery').focus(function(){
  $('#queryModal').modal('toggle');
});