from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.shortcuts import render_to_response, get_object_or_404
from django.core.urlresolvers import reverse


def home(request) :
  return render_to_response('hello.html')

def query(request, query_id) :
  return render_to_response('hello.html')

def document(request, doc_id) :
  return render_to_response('hello.html')

def rank(request, query_id) :
  return render_to_response('hello.html')
