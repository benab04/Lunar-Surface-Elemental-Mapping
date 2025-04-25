from django.apps import AppConfig
from django.core.management import call_command

class HomeConfig(AppConfig):
    name = 'home'

    def ready(self):
        # Start the scraping process automatically when the app is ready
        call_command('start_scraping')
