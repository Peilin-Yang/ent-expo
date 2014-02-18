from django.template import Context, loader, RequestContext
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.shortcuts import render_to_response, get_object_or_404
from django.core.urlresolvers import reverse
import json
from collections import defaultdict
from search.models import *

def home(request) :
  return render_to_response('home.html', 
    context_instance=RequestContext(request))

def query_list(request) :
  query_list = []
  for query in Query.objects.all() :
    item = dict()
    item['id'] = query.query_id
    item['title'] = query.title
    item['desc'] = query.description
    query_list.append(item)
  return HttpResponse(json.dumps(query_list), content_type="application/json")

def query(request, query_id) :
  try :
    query = Query.objects.get(query_id=query_id)
  except Query.DoesNotExist :
    raise Http404
  item = dict()
  item['id'] = query.query_id
  item['title'] = query.title
  item['desc'] = query.description
  return HttpResponse(json.dumps(item), content_type="application/json")

def document(request, doc_id) :
  try :
    doc = Document.objects.get(pk=doc_id)
  except Document.DoesNotExist :
    raise Http404
  item = dict()
  item['id'] = doc.doc_id
  item['title'] = doc.title
  item['text'] = doc.text
  return HttpResponse(json.dumps(item), content_type="application/json")

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

def rank(request) :
  '''
  Return the default ranking list for a given query in JSON format.
  '''
  if "POST" != request.method :
    error_msg = 'Only HTTP POST accepted.'
    item = dict()
    item['error'] = error_msg
    return HttpResponse(json.dumps(item), content_type="application/json")
  
  query_id = request.POST['query_id']
  try :
    query = Query.objects.get(query_id=query_id)
  except Query.DoesNotExist :
    error_msg = 'Invalid query [%s] : %s' %(query_id, query_text)
    item['error'] = error_msg
    return HttpResponse(json.dumps(item), content_type="application/json")

  try :
    doc_rank_list = DocRank.objects.filter(query=query)
  except DocRank.Objects.get() :
    error_msg = 'Invalid query [%s] : %s' %(query_id, query_text)
    return render_to_response('error.html', {'error_message': error_msg})
