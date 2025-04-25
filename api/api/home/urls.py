from django.urls import path
from .views import process_tile_indices,process_fits,coordinate_data,get_scale_values,store_logs,change_scraping_status

urlpatterns = [
    # Define a URL pattern for the view
    path('process_tile_indices/', process_tile_indices, name='process_tile_indices'),
    path('process-fits/', process_fits, name='process_fits'),
    path('coordinate_data/', coordinate_data, name='coordinate_data'),
    path('get_scale_values/', get_scale_values, name='get_scale_values'),
    path('store_logs/', store_logs, name="store_logs"),
    path('update_scraping/', change_scraping_status, name="change_scraping_status"),
]
