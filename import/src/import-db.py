#!/usr/bin/python
# -*- coding: utf-8 -*-

import os
import re
import sys
import csv
import json
import argparse
import traceback
import MySQLdb as mdb
from collections import defaultdict

# global variables
# file paths
QUERY_TITLE_FILE = 'data/query/title'
QUERY_DESC_FILE = 'data/query/desc'
DOC_TITLE_LIST_FILE = 'data/corpus/title.list'
TREC_CORPUS_FILE = 'data/corpus/ret'
STEM_CORPUS_FILE = 'data/corpus/stem'
ENT_DOC_RET_FILE = 'data/ret/5-0.90'
QRELS_FILE = 'data/eval/qrels.robust2004.txt'

# table names
TABLE_TMPL = 'search_%s'
QUERY_TABLE = TABLE_TMPL % 'query'
DOC_TABLE = TABLE_TMPL % 'document'
DOC_MAP_TABLE = TABLE_TMPL % 'docmap'
DOC_RANK_TABLE = TABLE_TMPL % 'docrank'

RANK_THRED = 100
DB_CON = None

query_title_dict = dict()
query_desc_dict = dict()
doc_title_dict = dict()
doc_stem_dict = dict()
doc_ret_dict = dict()
qrels_dict = dict()

## reverse dict to look up for row-ID in DB
query_rev_dict = dict()
doc_rev_dict = dict()

class MyDB(object) :
  '''
  Configuration of MySQL DB
  '''
  HOST = '127.0.0.1'
  PORT = 8889
  USER = 'xliu'
  PASSWD = '123'
  DB = 'xliu_ent_test'

def load_query (file_path):
  '''
  Load the query file into a dict
  Query type may be title or desc

  file_path: string filesystem path to the query file
  '''
  try :
    with open(file_path) as query_file :
      print '[Info] Loading %s' % file_path

      query_dict = dict()
      for line in query_file :
        line = line.rstrip()
        row = line.split(' : ')
        if 2 != len(row) :
          print '[Error] Invalid query record: %s' % ' : '.join(row)
          continue

        query_id = row[0]
        query = row[1]
        query_dict[query_id] = query

      return query_dict
  except IOError as e :
    print '-' * 60
    traceback.print_exc(file = sys.stdout)
    print '-' * 60
    sys.exit(-1)

def load_doc_ret_list (file_path) :
  '''
  Load the retrieval list for query-document map
  '''
  ret_file = csv.reader(open(file_path, 'r'), delimiter=' ')
  print 'Loading %s' % file_path

  ret_dict = defaultdict(dict)
  for row in ret_file :
    if 6 != len(row) :
      print '[Error] Invalid ret_list record: %s' % ' '.join(row)
      continue

    query_id = row[0]
    doc_id = row[2]
    rank = int(row[3])

    if rank > RANK_THRED :
      continue

    ## for debug purpose only
    ## select one query only
    #if '301' != query_id :
      #continue

    ret_dict[doc_id][query_id] = rank

  return ret_dict

def load_qrels (file_path) :
  '''
  Load the qrels into dict
  '''
  qrels_file = csv.reader(open(file_path, 'r'), delimiter=' ')
  print 'Loading %s' % file_path

  qrels_dict = defaultdict(dict)
  for row in qrels_file :
    if 4 != len(row) :
      print '[Error] Invalid qrels record: %s' % ' '.join(row)
      continue

    query_id = row[0]
    doc_id = row[2]
    rel = int(row[3])

    qrels_dict[doc_id][query_id] = rel

  return qrels_dict

def load_doc_title_list (file_path):
  '''
  Load the title list for each document in robust04

  file_path: string filesystem path to the title list file
  '''
  try :
    with open(file_path) as title_file :
      print '[Info] Loaing %s' % file_path

      title_dict = dict()
      for line in title_file :
        line = line.rstrip()
        row = line.split(' :: ')
        if 2 != len(row) :
          print '[Error] Invalid doc-title record: %s' % ' :: '.join(row)
          continue

        doc_id = row[0]
        title = row[1]
        title_dict[doc_id] = title

      return title_dict
  except IOError as e :
    print '-' * 60
    traceback.print_exc(file = sys.stdout)
    print '-' * 60
    sys.exit(-1)

def load_trec_corpus (file_path):
  '''
  Load the corpus in TREC format

  file_path: string filesystem path to the corpus file
  '''
  global DB_CON
  db_cur = DB_CON.cursor()

  doc_imported = 0

  is_begin = False
  try:
    with open(file_path) as f:
      print '[Info] Loading %s' % file_path

      doc_id = ''
      str_list = []
      for line in f:
        #line = line.strip()
        if re.match(r'<DOC>', line):
          continue
        if re.match(r'<DOCNO> ', line):
          mo = re.match(r'<DOCNO> (.+) <\/DOCNO>', line)
          doc_id = mo.group(1)
          continue
        if re.match(r'<\/DOC>', line):
          ## import the document to DB
          doc_data = ''.join(str_list)

          if import_doc(db_cur, doc_id, doc_data) :
            doc_imported += 1

          ## clear the list: http://stackoverflow.com/a/850831/219617
          del str_list[:]
          # for debug purpose only
          #if doc_imported >= 500:
            #break

          ## perform commit every 1000 documents
          if 0 == doc_imported % 1000 :
            do_commit()
            ## for debug purpose only
            #break

        else:
          ## add the current string to str_list
          str_list.append(line)

  except IOError as e:
    print '-' * 60
    traceback.print_exec(file = sys.stdout)
    print '-' * 60
    exit(-1)

  do_commit()
  print '\n[Info] Summary:'
  print '[Info] %d documents imported' % doc_imported

def load_stem_corpus(file_path) :
  '''
  Load the stem corpus into dict

  file_path: string filesystem path to the stem_corpus file
  '''
  #Since the format of stem_corpus is the same as query, we directly
  #resue load_query() here
  return load_query(file_path)

def import_doc(db_cur, doc_id, doc_text) :
  '''
  Import one document to DB
  '''
  global doc_title_dict
  global doc_stem_dict
  global doc_rev_dict
  global doc_ret_dict

  ## for debug purpose only
  # skip documents not in the ret_dict
  if doc_id not in doc_ret_dict :
    return False

  title = 'N/A'
  if doc_id not in doc_title_dict :
    print '[Warning] Title not found for %s' % doc_id
  else :
    title = doc_title_dict[doc_id]

  if doc_id not in doc_stem_dict :
    print '[Error] STEM not found for %s' % doc_id
    return False

  stem = doc_stem_dict[doc_id]
  dlm = gen_dlm(stem)
  stem_json_str = json.dumps(dlm)

  sql = 'INSERT INTO %s(doc_id,title,text,stem) VALUES'\
        '(' % DOC_TABLE
  sql += '%s, %s, %s, %s)'
  try :
    db_cur.execute(sql, (doc_id, title, doc_text, stem_json_str))
    # http://stackoverflow.com/a/3790542
    doc_rev_dict[doc_id] = db_cur.lastrowid
    return True
  except mdb.Error, e:
    print '[Error] SQL execution: %s' % sql
    print 'Error %d: %s' % (e.args[0],e.args[1])
    return False

def gen_dlm(doc) :
  '''
  Generate the LM for a given document
  '''
  dlm = dict()
  term_list = doc.split()
  for term in term_list :
    if term in dlm :
      dlm[term] += 1
    else :
      dlm[term] = 1

  return dlm

def test_db() :
  '''
  An example to test the connection of DB
  http://zetcode.com/db/mysqlpython/
  '''
  try :
    con = mdb.connect(host=MyDB.HOST, port=MyDB.PORT, user=MyDB.USER,
        passwd=MyDB.PASSWD, db=MyDB.DB)
    cur = con.cursor()
    cur.execute("SELECT VERSION()")
    ver = cur.fetchone()
    print '[Info] Database version : %s ' % ver

  except mdb.Error, e:
    print 'Error %d: %s' % (e.args[0],e.args[1])
    sys.exit(1)

  finally :
    if con :
      con.close()

def test() :
  test_db()

def init_db() :
  try :
    global DB_CON
    DB_CON = mdb.connect(host=MyDB.HOST, port=MyDB.PORT, user=MyDB.USER,
        passwd=MyDB.PASSWD, db=MyDB.DB)
    if DB_CON :
      print '[Info] DB connection initialized'
    else :
      print '[Error] DB connection failed. Will exit.'
      sys.exit(-1)

  except mdb.Error, e:
    print "Error %d: %s" % (e.args[0],e.args[1])
    if DB_CON :
      DB_CON.close()
    sys.exit(1)

def close_db() :
  global DB_CON
  if DB_CON :
    DB_CON.close()
    DB_CON = None

def sql_execute(cur, sql) :
  '''
  Execute SQL on DB

  cur: the cursor
  sql: the SQL statement
  '''
  try :
    cur.execute(sql)
    return True
  except mdb.Error, e :
    print '[Error] SQL execution: %s' % sql
    print '%d: %s' %(e.args[0], e.args[1])
    return False

def do_commit() :
  '''
  Commit the current transaction
  '''
  try :
    DB_CON.commit()
  except mdb.Error, e :
    print '[Error] Commit - %d: %s' %(e.args[0], e.args[1])
    DB_CON.rollback()
    return False

def main() :
  init_db()
  global query_title_dict
  global query_desc_dict
  global doc_title_dict
  global doc_stem_dict
  global doc_ret_dict
  global qrels_dict
  global query_rev_dict
  global doc_rev_dict

  ## import query
  query_title_dict = load_query(QUERY_TITLE_FILE)
  query_desc_dict = load_query(QUERY_DESC_FILE)

  query_id_list = query_title_dict.keys()
  query_id_list.sort(key=lambda x: int(x))

  db_cur = DB_CON.cursor()
  for query_id in query_id_list :
    title = query_title_dict[query_id]
    description = query_desc_dict[query_id]
    sql = 'INSERT INTO %s(query_id,title,description) VALUES'\
        '(%s,' %(QUERY_TABLE, query_id)
    sql += '%s, %s)'
    try :
      db_cur.execute(sql, (title, description))
      # http://stackoverflow.com/a/3790542
      query_rev_dict[query_id] = db_cur.lastrowid
    except Exception :
      print '[Error] SQL execution: %s' % sql

  do_commit()

  ## import documents
  doc_ret_dict = load_doc_ret_list(ENT_DOC_RET_FILE)

  doc_title_dict = load_doc_title_list(DOC_TITLE_LIST_FILE)
  doc_stem_dict = load_stem_corpus(STEM_CORPUS_FILE)
  load_trec_corpus(TREC_CORPUS_FILE)

  ## import query-doc map and rank map
  db_cur = DB_CON.cursor()
  qrels_dict = load_qrels(QRELS_FILE)
  for doc_id in doc_ret_dict :
    rel = -1
    if doc_id not in doc_rev_dict :
      print '[Error] doc_id not found in doc_rev_dict: %s' % doc_id
      continue
    doc_row_id = doc_rev_dict[doc_id]

    for query_id in doc_ret_dict[doc_id] :
      if query_id not in query_rev_dict :
        print '[Error] query_id not found in query_rev_dict: %s' % query_id
        continue
      query_row_id = query_rev_dict[query_id]

      if doc_id in qrels_dict and query_id in qrels_dict[doc_id] :
        rel = qrels_dict[doc_id][query_id]

      # query-doc map
      sql = 'INSERT INTO %s(query_id,doc_id,is_rel) VALUES'\
          '(%s, %s, %d)' %(DOC_MAP_TABLE, query_row_id, doc_row_id, rel)
      sql_execute(db_cur, sql)

      # rank map
      rank = doc_ret_dict[doc_id][query_id]
      sql = 'INSERT INTO %s(query_id,doc_id,rank) VALUES'\
          '(%s, %s, %d)' %(DOC_RANK_TABLE, query_row_id, doc_row_id, rank)
      sql_execute(db_cur, sql)

  do_commit()
  close_db()
  return

if '__main__' == __name__ :
  try :
    main()
  except KeyboardInterrupt :
    print '\nGoodbye!'

