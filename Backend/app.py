import logging
import os
from flask import Flask
from flask_cors import CORS
from config import Config
from models.db import db
from models.views import init_db_views
from routes import register_blueprints

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler('app.log'), logging.StreamHandler()]
)

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
INSTANCE_DIR = os.path.join(BACKEND_DIR, 'instance')

os.makedirs(INSTANCE_DIR, exist_ok=True)

app = Flask(__name__, instance_path=INSTANCE_DIR)
app.config.from_object(Config)

CORS(app)

db.init_app(app)

with app.app_context():
    logging.info("Creating database tables...")
    db.create_all()
    logging.info("Creating lookup views...")
    init_db_views(app)
    logging.info("Registering blueprints...")
    register_blueprints(app)

if __name__ == '__main__':
    logging.info("Starting Flask server...")
    app.run(debug=True, host='127.0.0.1', port=5000)
