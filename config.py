"""
Configuration for Flask app and database connection.
Uses environment variables for security, tailored for XAMPP MySQL.
"""

import os
from dotenv import load_dotenv

load_dotenv()

MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_USER = os.getenv('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')  # Default empty for XAMPP
MYSQL_DB = os.getenv('MYSQL_DB', 'phishing_detection')
FLASK_ENV = os.getenv('FLASK_ENV', 'development')
API_URL = os.getenv('API_URL', 'http://localhost:5000')