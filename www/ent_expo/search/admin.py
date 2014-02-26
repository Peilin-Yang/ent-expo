from django.contrib import admin
import search.models

# Register your models here.
admin.site.register(search.models.Query)
admin.site.register(search.models.Document)
admin.site.register(search.models.DocMap)
