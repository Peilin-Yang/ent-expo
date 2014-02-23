from django.db import models

# Create your models here.

class Query(models.Model) :
  query_id = models.IntegerField()
  title = models.CharField(max_length=100)
  description = models.CharField(max_length=512)
  # entities embedded in query, in JSON format
  ent_list = models.TextField()

  def __unicode__(self) :
    return '%d - [%s]' %(self.query_id, self.title)

class Document(models.Model) :
  doc_id = models.CharField(max_length=20)
  title = models.TextField()
  text = models.TextField()
  stem = models.TextField()

  def __unicode__(self) :
    return 'Doc - %s' % self.doc_id

class DocMap(models.Model) :
  query = models.ForeignKey(Query)
  doc = models.ForeignKey(Document)
  is_rel = models.BooleanField()

  def __unicode__(self) :
    return '%s - %s - %d' %(self.query.query_id, self.doc.doc_id,
        self.is_rel)

class DocRank(models.Model) :
  query = models.ForeignKey(Query)
  doc = models.ForeignKey(Document)
  rank = models.IntegerField()

  def __unicode__(self) :
    return '%s - %d - %s' %(self.query.query_id, self.rank,
        self.doc.doc_id)

class Entity(models.Model) :
  uri = models.CharField(max_length=256)
  name = models.CharField(max_length=256)
  infobox = models.TextField()
  abstract = models.TextField()

  def __unicode__(self) :
    return 'Ent - %s' % self.uri

class EntRank(models.Model) :
  query = models.ForeignKey(Query)
  ent = models.ForeignKey(Entity, related_name='entrank_ents')
  rank = models.IntegerField()
  lm = models.TextField()
  # relation with query entity
  predicate = models.CharField(max_length=256)
  query_ent = models.ForeignKey(Entity, related_name='entrank_query_ents')
  link_type = models.CharField(max_length=8)

  def __unicode__(self) :
    return '%s - %d - %s' %(self.query.query_id, self.rank,
        self.ent.uri)
