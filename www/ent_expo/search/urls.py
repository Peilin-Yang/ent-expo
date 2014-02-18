from django.conf.urls import patterns, include, url

urlpatterns = patterns('',
  url(r'^$', 'search.views.home', name='search_home'),
  url(r'^query_list$', 'search.views.query_list', name='search_query_list'),
  url(r'^query/(?P<query_id>\d+)$', 'search.views.query',
    name='search_query'),
  url(r'^doc/(?P<doc_id>\d+)$', 'search.views.document',
    name='search_ducument'),
  url(r'^rank/(?P<query_id>\d+)$', 'search.views.rank', name='search_rank'),
  url(r'^search$', 'search.views.search', name='search_search'),
)
