from django.template import Context, loader, RequestContext
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.shortcuts import render_to_response, get_object_or_404
from django.core import serializers
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
  try:
    query = Query.objects.get(query_id=query_id)
  except Query.DoesNotExist:
    raise Http404
  item = dict()
  item['id'] = query.query_id
  item['title'] = query.title
  item['desc'] = query.description
  return HttpResponse(json.dumps(item), content_type="application/json")

def document(request, doc_id) :
  try:
    doc = Document.objects.get(pk=doc_id)
  except Document.DoesNotExist:
    raise Http404
  item = dict()
  item['id'] = doc.doc_id
  item['title'] = doc.title
  item['text'] = doc.text
  return HttpResponse(json.dumps(item), content_type="application/json")

def rank(request) :
  if "GET" == request.method :
    error_msg = 'Only HTTP POST accepted.'
    return render_to_response('error.html', {'error_message': error_msg})
    
  return render_to_response('hello.html')
