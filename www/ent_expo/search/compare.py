import re
import math
import json
from search.models import *
from search.utils import *


def load_compare_baseline(query_id):
  try :
    query = Query.objects.get(query_id=query_id)
  except Query.DoesNotExist :
    error_msg = 'Invalid query [%s]' % query_id
    return False, error_msg

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

    return True, rank_list
  except DocRank.DoesNotExist :
    error_msg = 'Document rank list not found [%s] : %s' %(query_id, query_text)
    return False, error_msg


def load_compare_second(query_id, ent_weight_list):
  try :
    query = Query.objects.get(query_id=query_id)
  except Query.DoesNotExist :
    error_msg = 'Invalid query [%s]' % query_id
    return False, error_msg

  try :
    ent_rank_list = EntRank.objects.filter(query=query)
  except EntRank.DoesNotExist :
    error_msg = 'Entity rank list not found [%s] : %s' %(query_id, query_text)
    return False, error_msg
    
  try :
    doc_rank_list = DocRank.objects.filter(query=query)
    rank_dict = entity_centric_doc_rank(query, ent_rank_list, ent_weight_list, 
      doc_rank_list)

    rel_dict = {}
    doc_rel_list = DocMap.objects.filter(query=query)
    for doc_item in doc_rel_list :
      doc_id = doc_item.doc.doc_id
      rel_dict[doc_id] = int(doc_item.is_rel)
    
    rank_list = list()
    for rank_item in doc_rank_list :
      item = dict()
      item['doc_pk'] = rank_item.doc.pk
      item['doc_id'] = rank_item.doc.doc_id
      item['title'] = rank_item.doc.title
      # for debug purpose only, generate random list
      #item['rank'] = randint(1,100)
      # TODO it should be updated once the re-ranking function finished
      #item['rank'] = int(rank_item.rank)
      item['rank'] = rank_dict[item['doc_id']]
      item['is_rel'] = rel_dict[item['doc_id']]
      item['snippet'] = gen_snippet(query, item['doc_id'], 
        rank_item.doc.text)
      rank_list.append(item)
    rank_list.sort(key=lambda x: x['rank'])
    return True, rank_list
  except DocRank.DoesNotExist :
    error_msg = 'Document rank list not found [%s] : %s' %(query_id, query_text)
    return False, error_msg

def compare(baseline, second):
  for ele_1 in second:
    doc_id = ele_1['doc_id']
    found = False
    for ele_2 in baseline:
      if doc_id == ele_2['doc_id']:
        found = True
        rank_diff = ele_2['rank'] - ele_1['rank']
        break
    if found:
      ele_1['rank_diff'] = '+' if rank_diff > 0 else ''
      ele_1['rank_diff'] += str(rank_diff)
    else:
      ele_1['rank_diff'] = 'new'

  return second

