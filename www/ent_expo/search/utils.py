import json

def gen_snippet(query_id, doc_id, doc_text) :
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