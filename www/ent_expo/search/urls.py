from django.conf.urls import patterns, include, url

urlpatterns = patterns('',
  url(r'^$', 'search.views.home', name='search_home'),
  url(r'^search$', 'search.views.search', name='search_search'),
  url(r'^doc/(?P<doc_id>\d+)$', 'search.views.document',\
    name='search_ducument'),
    
  url(r'^api/query_list$', 'search.views.api_query_list', \
    name='search_query_list'),
  url(r'^api/query/(?P<query_id>\d+)$', 'search.views.api_query',\
    name='search_query'),
  url(r'^api/rank/(?P<query_id>\d+)$', 'search.views.api_rank', \
    name='search_rank'),
  url(r'^api/ent_list/(?P<query_id>\d+)$', 'search.views.api_ent_list', \
    name='search_ent_list'),
  url(r'^api/ent/(?P<ent_id>\d+)$', 'search.views.api_ent', \
    name='search_ent'),
  url(r'^api/rerank/(?P<query_id>\d+)$', 'search.views.api_rerank', \
    name='search_rerank'),
)
