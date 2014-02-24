from django.template import Context, loader, RequestContext
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.shortcuts import render_to_response, get_object_or_404
from django.core.urlresolvers import reverse
from collections import defaultdict
from search.models import *
from search.utils import *

def home(request) :
  return render_to_response('home.html', 
    context_instance=RequestContext(request))

def search(request) :
  if "POST" != request.method :
    return HttpResponseRedirect(reverse('search.views.home'))

  query_id = request.POST['query_id']
  query_text = request.POST['query_text']
  try :
    query = Query.objects.get(query_id=query_id)
  except Query.DoesNotExist :
    error_msg = 'Invalid query [%s] : %s' %(query_id, query_text)
    return render_to_response('error.html', {'error_message': error_msg})
    
  query_id = request.POST['query_id']
  query_text = request.POST['query_text']
  return render_to_response('search.html', 
    {'query_id': query_id, 'query_text': query_text},
    context_instance=RequestContext(request))

def document(request, doc_id) :
  try :
    doc = Document.objects.get(pk=doc_id)
  except Document.DoesNotExist :
    raise Http404
  item = dict()
  item['doc_id'] = doc.doc_id
  item['title'] = doc.title
  item['text'] = format_document(doc.text)
  return render_to_response('doc.html', {'doc_item': item})

def api_query_list(request) :
  query_list = []
  for query in Query.objects.all() :
    item = dict()
    item['id'] = query.query_id
    item['title'] = query.title
    item['desc'] = query.description
    query_list.append(item)
  return HttpResponse(json.dumps(query_list), content_type="application/json")

def api_query(request, query_id) :
  try :
    query = Query.objects.get(query_id=query_id)
  except Query.DoesNotExist :
    item = dict()
    error_msg = 'Invalid query ID: %s' % query_id
    item['error_msg'] = error_msg
    return HttpResponse(json.dumps(item), content_type="application/json")

  item = dict()
  item['id'] = query.query_id
  item['title'] = query.title
  item['desc'] = query.description
  item['ent_list'] = json.loads(query.ent_list)
  return HttpResponse(json.dumps(item), content_type="application/json")

def api_document(request, doc_id) :
  try :
    doc = Document.objects.get(pk=doc_id)
  except Document.DoesNotExist :
    item = dict()
    error_msg = 'Invalid document ID: %s' % doc_id
    item['error_msg'] = error_msg
    return HttpResponse(json.dumps(item), content_type="application/json")

  item = dict()
  item['doc_id'] = doc.doc_id
  item['title'] = doc.title
  item['text'] = format_document(doc.text)
  return HttpResponse(json.dumps(item), content_type="application/json")

def api_rank(request, query_id) :
  '''
  Return the default ranking list for a given query in JSON format.
  '''
  '''
  if "POST" != request.method :
    error_msg = 'Only HTTP POST accepted.'
    item = dict()
    item['error_msg'] = error_msg
    return HttpResponse(json.dumps(item), content_type="application/json")
  
  query_id = request.POST['query_id']
  '''
  
  try :
    query = Query.objects.get(query_id=query_id)
  except Query.DoesNotExist :
    item = dict()
    error_msg = 'Invalid query [%s]' % query_id
    item['error_msg'] = error_msg
    return HttpResponse(json.dumps(item), content_type="application/json")

  try :
    doc_rank_list = DocRank.objects.filter(query=query)
    rank_list = list()
    for rank_item in doc_rank_list :
      item = dict()
      item['doc_pk'] = rank_item.doc.pk
      item['doc_id'] = rank_item.doc.doc_id
      item['title'] = rank_item.doc.title
      item['rank'] = int(rank_item.rank)
      item['snippet'] = gen_snippet(query_id, item['doc_id'], 
        rank_item.doc.text)
      rank_list.append(item)
    rank_list.sort(key=lambda x: x['rank'])
    response = dict()
    response['rank_list'] = rank_list
    return HttpResponse(json.dumps(response), content_type="application/json")
  except DocRank.DoesNotExist :
    item = dict()
    error_msg = 'Document rank list not found [%s] : %s' %(query_id, query_text)
    item['error_msg'] = error_msg
    return HttpResponse(json.dumps(item), content_type="application/json")

def api_ent_list(request, query_id) :
  '''
  Get the list of related for a given query
  '''
  try :
    query = Query.objects.get(query_id=query_id)
  except Query.DoesNotExist :
    item = dict()
    error_msg = 'Invalid query [%s]' % query_id
    item['error_msg'] = error_msg
    return HttpResponse(json.dumps(item), content_type="application/json")

  try :
    ent_rank_list = EntRank.objects.filter(query=query)
    rank_list = list()
    for rank_item in ent_rank_list :
      item = dict()
      item['ent_id'] = rank_item.ent.pk
      item['ent_uri'] = rank_item.ent.uri
      item['ent_rank'] = int(rank_item.rank)
      item['ent_name'] = rank_item.ent.name
      item['predicate'] = rank_item.predicate
      item['query_ent_id'] = rank_item.query_ent.pk
      item['query_ent_uri'] = rank_item.query_ent.uri
      item['query_ent_name'] = rank_item.query_ent.name
      item['link_type'] = rank_item.link_type
      rank_list.append(item)
    rank_list.sort(key=lambda x: x['ent_rank'])
    response = dict()
    response['rank_list'] = rank_list
    return HttpResponse(json.dumps(response), content_type="application/json")
  except EntRank.DoesNotExist :
    item = dict()
    error_msg = 'Entity rank list not found [%s] : %s' %(query_id, query_text)
    item['error_msg'] = error_msg
    return HttpResponse(json.dumps(item), content_type="application/json")

def api_ent(request, ent_id) :
  try :
    entity = Entity.objects.get(pk=ent_id)
  except Entity.DoesNotExist :
    item = dict()
    error_msg = 'Invalid entity ID: %s' % ent_id
    item['error_msg'] = error_msg
    return HttpResponse(json.dumps(item), content_type="application/json")

  item = dict()
  item['uri'] = entity.uri
  item['name'] = entity.name
  if '' != entity.infobox :
    entity.infobox = json.loads(entity.infobox)
  item['infobox'] = entity.infobox
  if '' != entity.abstract :
    entity.abstract = json.loads(entity.abstract)
  item['abstract'] = entity.abstract
  return HttpResponse(json.dumps(item), content_type="application/json")
