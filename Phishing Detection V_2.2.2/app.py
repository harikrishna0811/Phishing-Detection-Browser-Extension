"""
Flask API for phishing detection, reporting, and analytics dashboard.
"""

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from sqlalchemy import create_engine, text
import pandas as pd
import pickle
import logging
import time
from config import MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB, FLASK_ENV
from model_training import train_model
import analytics

app = Flask(__name__)
CORS(app)  # Enable CORS for browser extension

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create SQLAlchemy engine
engine = create_engine(f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}/{MYSQL_DB}")

def get_db_connection():
    return engine.connect()

def log_prediction(url, prediction, response_time):
    try:
        connection = get_db_connection()
        query = text("INSERT INTO prediction_logs (url, prediction, response_time) VALUES (:url, :prediction, :response_time)")
        connection.execute(query, {"url": url, "prediction": prediction, "response_time": response_time})
        connection.commit()
        logger.debug(f"Logged prediction for URL: {url}")
    except Exception as e:
        logger.error(f"Error logging prediction: {e}")
    finally:
        connection.close()

def log_report(url, label, retraining_time, retraining_success):
    try:
        connection = get_db_connection()
        query = text("INSERT INTO report_logs (url, label, retraining_time, retraining_success) VALUES (:url, :label, :retraining_time, :retraining_success)")
        connection.execute(query, {
            "url": url,
            "label": label,
            "retraining_time": retraining_time,
            "retraining_success": retraining_success
        })
        connection.commit()
        logger.debug(f"Logged report for URL: {url}")
    except Exception as e:
        logger.error(f"Error logging report: {e}")
    finally:
        connection.close()

def log_interaction(action):
    try:
        connection = get_db_connection()
        query = text("INSERT INTO interaction_logs (action) VALUES (:action)")
        connection.execute(query, {"action": action})
        connection.commit()
        logger.debug(f"Logged interaction: {action}")
    except Exception as e:
        logger.error(f"Error logging interaction: {e}")
    finally:
        connection.close()

def insert_reported_url(url, label):
    try:
        connection = get_db_connection()
        query = text("INSERT INTO reported_urls (url, label) VALUES (:url, :label)")
        connection.execute(query, {"url": url, "label": label})
        connection.commit()
        logger.debug(f"Inserted reported URL: {url}")
    except Exception as e:
        logger.error(f"Error inserting URL: {e}")
        raise
    finally:
        connection.close()

@app.route('/predict', methods=['POST'])
def predict():
    try:
        start_time = time.time()
        data = request.get_json()
        if not data or 'url' not in data:
            return jsonify({'error': 'URL is required'}), 400

        url = data['url']
        try:
            with open('flask-api/phishing_model.pkl', 'rb') as model_file:
                model = pickle.load(model_file)
            with open('flask-api/vectorizer.pkl', 'rb') as vectorizer_file:
                vectorizer = pickle.load(vectorizer_file)
        except FileNotFoundError as e:
            logger.error(f"Model or vectorizer file not found: {e}")
            return jsonify({'error': 'Model files not found'}), 500

        url_features = vectorizer.transform([url])
        prediction = model.predict(url_features)
        result = 'phishing' if prediction[0] == 1 else 'legitimate'
        response_time = time.time() - start_time
        log_prediction(url, result, response_time)

        return jsonify({'result': result})
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/report', methods=['POST'])
def report():
    try:
        data = request.get_json()
        if not data or 'url' not in data or 'label' not in data:
            return jsonify({'error': 'URL and label are required'}), 400

        url = data['url']
        label = data['label']
        insert_reported_url(url, label)

        try:
            start_time = time.time()
            train_model()
            retraining_time = time.time() - start_time
            log_report(url, label, retraining_time, True)
        except Exception as e:
            log_report(url, label, None, False)
            logger.error(f"Retraining failed: {e}")
            return jsonify({'error': f"URL reported, but retraining failed: {str(e)}"}), 500

        return jsonify({'message': 'URL reported and model retrained successfully'}), 200
    except Exception as e:
        logger.error(f"Report error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/log_interaction', methods=['POST'])
def log_interaction_endpoint():
    try:
        data = request.get_json()
        if not data or 'action' not in data:
            return jsonify({'error': 'Action is required'}), 400

        action = data['action']
        log_interaction(action)
        return jsonify({'message': 'Interaction logged successfully'}), 200
    except Exception as e:
        logger.error(f"Interaction logging error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/train', methods=['POST'])
def train():
    try:
        train_model()
        return jsonify({'message': 'Model retrained successfully'}), 200
    except Exception as e:
        logger.error(f"Training error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/analytics')
def analytics_dashboard():
    try:
        return render_template('analytics.html')
    except Exception as e:
        logger.error(f"Analytics dashboard error: {e}")
        return f"Failed to load analytics: {str(e)}", 500

@app.route('/analytics-data')
def analytics_data():
    """API for AJAX polling (returns fresh analytics every time)"""
    try:
        analytics_output = analytics.get_analytics_data()
        logger.debug(f"Analytics data: {analytics_output.keys()}")
        return jsonify(analytics_output)
    except Exception as e:
        logger.error(f"Analytics data error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)