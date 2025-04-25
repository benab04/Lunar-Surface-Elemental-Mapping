from django.core.management.base import BaseCommand
import threading
import time
from home import scraper  # Assuming the script is saved in myapp/scraper.py
import os
from django.conf import settings
import json

SCRAPING_CONTROLLER = os.path.join(settings.BASE_DIR, "scraping_controller.json")
class Command(BaseCommand):
    help = "Start the scraping process and run it every 15 minutes"

    def handle(self, *args, **kwargs):
        TIME_INTERVAL_MINS = 15
        
        def run_scraping_task():
            while True:
                if os.path.exists(SCRAPING_CONTROLLER):
                    with open(SCRAPING_CONTROLLER, "r") as file:
                        data = json.load(file)
                        if data["status"] == "TRUE":
                            print("Starting scraping task...")
                            scraper.main()  # Call the main function in your scraper script
                        else:
                            print("Scraping skipped...")
                            
                # Sleep for 30 minutes
                time.sleep(TIME_INTERVAL_MINS*60)

        # Run the task in a separate background thread
        threading.Thread(target=run_scraping_task, daemon=True).start()

        print("Scraping started in the background!")
