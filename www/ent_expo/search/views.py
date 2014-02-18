from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.shortcuts import render_to_response, get_object_or_404
from django.core.urlresolvers import reverse
from search.models import *

def home(request) :
  query_list = Query.objects.all()
  return render_to_response('home.html', {'query_list': query_list})

def query_list(request) :
  query_list = Query.objects.all()
  return render_to_response('query_list.html', {'query_list': query_list})

def query(request, query_id) :
  return render_to_response('hello.html')

def document(request, doc_id) :
  return render_to_response('hello.html')

def rank(request, query_id) :
  return render_to_response('hello.html')
