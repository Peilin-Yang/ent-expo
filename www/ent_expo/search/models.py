from django.db import models

# Create your models here.

class Query(models.Model) :
  query_id = models.IntegerField()
  title = models.CharField(max_length=100)
  description = models.CharField(max_length=512)

  def __unicode__(self) :
    return '%d - [%s]' %(index, title)

class Document(models.Model) :
  doc_id = models.CharField(max_length=20)
  title = models.TextField()
  text = models.TextField()
  stem = models.TextField()

  def __unicode__(self) :
    return 'Doc - %s' % doc_id

class DocMap(models.Model) :
  query = models.ForeignKey(Query)
  doc = models.ForeignKey(Document)
  is_rel = models.BooleanField()

  def __unicode__(self) :
    return '%s - %s - %d' %(self.query.index, self.doc.doc_id,
        self.is_rel)

class DocRank(models.Model) :
  query = models.ForeignKey(Query)
  doc = models.ForeignKey(Document)
  rank = models.IntegerField()

  def __unicode__(self) :
    return '%s - %d - %s' %(self.query.index, self.rank,
        self.doc.doc_id)

