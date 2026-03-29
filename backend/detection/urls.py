from rest_framework.routers import DefaultRouter
from .views import DetectionViewSet, AlertListView
from django.urls import path,include

router = DefaultRouter()
router.register(r'detections', DetectionViewSet, basename='detection')

# Ici, on définit les urlpatterns propres à l'application
urlpatterns = [
    path('alerts/', AlertListView.as_view(), name='alert-list'),
    path('', include(router.urls)),
]