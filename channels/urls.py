from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/channels', views.api_channels, name='api_channels'),
]