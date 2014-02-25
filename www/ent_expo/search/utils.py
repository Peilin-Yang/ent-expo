import re
import math
import json
from search.models import *

MU = 1000
PWC_UNSEEN = 0.0000040495 ## (1000 / TOTAL_TERM_COUNT)
LAMBDA = 0.9

def gen_snippet(query, doc_id, doc_text) :
  # output the first 250 characeters as snippet at this moment
  return doc_text[0:250]
  
def format_document(doc_text) :
  '''
  Apply format to the document
  '''
  paragraphs = doc_text.split('\n')
  p_html_list = list()
  for p in paragraphs :
    p_html = '<p class="paragraph">%s</p>' % p
    p_html_list.append(p_html)
  return '\n'.join(p_html_list)

def sanitize (str) :
  ## remove non-ascii characters
  sstr = removeNonAscii(str)

  ## remove the underscore and other non-alphabetical characters
  sstr = re.sub(r'[\_\W]+', ' ', sstr)

  ## remove leading spaces
  sstr = re.sub(r'^\s+', '', sstr)

  ## remove trailing spaces
  sstr = re.sub(r'\s+$', '', sstr)

  return sstr.lower()

def removeNonAscii(s) :
  '''
  remove non-ASCII characters
  http://stackoverflow.com/a/1342373/219617
  '''
  return ''.join(filter(lambda x: ord(x)<128, s))

def kl_div(qlm, dlm, pwc_cache) :
  '''
  Estimate the KL-divergence between QLM and DLM
  '''
  ## TODO pwc_cache should be collected from DB
  pwc_cache = dict()
  
  ## apply Dirichlet smoothing
  sum = 0.0
  for term in dlm :
    sum += dlm[term]
  if 0.0 == sum :
    ## empty document actually, apply penalty
    return -100.0
  denom = sum + MU

  sm_dlm = dict()
  for term in dlm :
    cwd = dlm[term]
    pwc = PWC_UNSEEN
    if term in pwc_cache :
      pwc = pwc_cache[term]
    sm = (cwd + MU * pwc) / denom
    sm_dlm[term] = sm

  score = 0.0
  for term in qlm :
    delta = 0.0

    if term not in sm_dlm :
      pwc = PWC_UNSEEN
      if term in pwc_cache :
        pwc = pwc_cache[term]
      pt = MU * pwc / denom
      delta = qlm[term] * math.log(pt)
    else :
      delta = qlm[term] * math.log(sm_dlm[term])

    score += delta

  return score

def est_lm(doc) :
  '''
  Estimate LM for a given document
  '''
  lm = dict()
  doc_snt = sanitize(doc)
  token_list = doc_snt.split(' ')
  for token in token_list :
    if token in lm :
      lm[token] += 1
    else :
      lm[token] = 1

  ## Apply normalization
  sum = 0.0
  for term in lm :
    sum += lm[term]
  if 0.0 == sum :
    print '[Error] zero sum in QLM!'
    return dict()
  for term in lm :
    lm[term] /= sum

  return lm

def entity_centric_doc_rank(query, ent_rank_list, weight_List, doc_rank_list) :
  '''
  Document ranking based on entity-centric query expansion
  '''
  qlm = est_lm(query.title)
  ent_weight_dict = dict()
  is_default = True
  for item in weight_List :
    ent_weight_dict[int(item['id'])] = float(item['weight'])
    if '0.5' != item['weight'] :
      is_default = False
  
  ## Trick: if the weight of every entity is 0.5, we use the original rank
  ## TODO this trick should be removed after entity_centric_doc_rank works
  ## properly
  if True == is_default :
    rank_dict = dict()
    for doc_item in doc_rank_list :
      doc_id = doc_item.doc.doc_id
      rank = int(doc_item.rank)
      rank_dict[doc_id] = rank
    return rank_dict
  
  ## estimate the entity based REL-LM
  rel_lm = dict()
  for ent_item in ent_rank_list :
    ent_id = ent_item.ent.pk
    if ent_id not in ent_weight_dict :
      print '[Error] ent_id not found in ent_weight_dict: %s' % ent_id
      continue
    ent_weight = ent_weight_dict[ent_id]
    ent_lm = json.loads(ent_item.lm)
    for term in ent_lm :
      prob = float(ent_lm[term])
      if term in rel_lm :
        rel_lm[term] += ent_weight * prob
      else :
        rel_lm[term] = ent_weight * prob
    
  ## Apply normalization
  sum = 0.0
  for term in rel_lm :
    sum += rel_lm[term]
  if 0.0 == sum :
    print '[Error] zero sum in REL-LM!'
    return dict()
  for term in rel_lm :
    rel_lm[term] /= sum
  
  ## apply linear interpolation
  ## the union of two sets: http://goo.gl/BiaEd2
  intep_lm = dict()
  term_union = set(qlm) | set(rel_lm)
  for term in term_union :
    q_w = 0.0
    if term in qlm :
      q_w = qlm[term]
    
    rel_w = 0.0
    if term in rel_lm :
      rel_w = rel_lm[term]
    
    intep_w = (1 - LAMBDA) * q_w + LAMBDA * rel_w
    intep_lm[term] = intep_w
  
  ## now rank the documents using INTEP-LM
  score_list = list()
  for doc_item in doc_rank_list :
    stem_lm = json.loads(doc_item.doc.stem)
    dlm = dict()
    for term in stem_lm :
      dlm[term] = float(stem_lm[term])
    score = kl_div(intep_lm, dlm, dict())
    item = dict()
    item['doc_id'] = doc_item.doc.doc_id
    item['score'] = score
    score_list.append(item)
    
  score_list.sort(key=lambda x: x['score'], reverse=True)
  rank_dict = dict()
  for idx, item in enumerate(score_list) :
    rank_dict[item['doc_id']] = idx + 1
  
  return rank_dict