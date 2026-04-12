from flask import Flask
from flask_cors import CORS

from .config import Config
from .db import close_db, init_db
from .routes import api


def create_app(test_config=None):
    app = Flask(__name__)
    app.config.from_object(Config)

    if test_config:
        app.config.update(test_config)

    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    app.register_blueprint(api, url_prefix="/api")
    app.teardown_appcontext(close_db)

    with app.app_context():
        init_db()

    return app
