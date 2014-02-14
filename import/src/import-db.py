#!/usr/bin/python
# -*- coding: utf-8 -*-

import os
import re
import sys
import json
import argparse
import traceback
import MySQLdb as mdb
from collections import defaultdict

query_dict = dict()

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
  query_file = csv.reader(open(file_path, 'r'), delimiter=' : ')
  print 'Loading %s' % file_path

  query_dict = dict()
  for row in query_file :
    ## Skip comments
    if row[0][0] == "#" :
      continue

    query_id = row[0]
    query = row[1]
    query_dict[query_id] = query

  return query_dict

def load_ret_list (file_path) :
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
    ret_dict[doc_id][query_id] = rank

  return ret_dict

def load_trec_corpus (file_path):
  '''
  Load the corpus in TREC format

  file_path: string filesystem path to the corpus file
  '''
  doc_imported = 0
  doc_annotated = 0

  is_begin = False
  try:
    with open(file_path) as f:
      print 'Loading %s' % file_path

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

          if import_doc(doc_id, doc_data):
            doc_imported += 1

          ## clear the list: http://stackoverflow.com/a/850831/219617
          del str_list[:]
          # for debug purpose only
          #if doc_imported >= 500:
            #break
        else:
          ## add the current string to str_list
          str_list.append(line)

  except IOError as e:
    print '-' * 60
    traceback.print_exec(file = sys.stdout)
    print '-' * 60
    exit(-1)

  print '\nSummary:'
  print '%d documents imported' % doc_imported

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
    print "Database version : %s " % ver

  except mdb.Error, e:
    print "Error %d: %s" % (e.args[0],e.args[1])
    sys.exit(1)

  finally :
    if con :
      con.close()

def main() :
  test_db()

if '__main__' == __name__ :
  try :
    main()
  except KeyboardInterrupt :
    print '\nGoodbye!'

