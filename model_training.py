"""
Train and save phishing detection model using database data.
Designed to be called automatically when new data is reported.
"""

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import CountVectorizer
import pickle
import logging
from config import MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB
from sqlalchemy import create_engine, text

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create SQLAlchemy engine
engine = create_engine(f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}/{MYSQL_DB}")

def get_db_connection():
    """Connect to MySQL database using SQLAlchemy."""
    return engine.connect()

def fetch_reported_urls():
    """Fetch reported URLs from the database."""
    try:
        connection = get_db_connection()
        query = text("SELECT url, label FROM reported_urls")
        result = connection.execute(query)
        data = result.fetchall()
        logger.info(f"Fetched {len(data)} reported URLs from database.")
        return pd.DataFrame(data, columns=['url', 'label'])
    except Exception as e:
        logger.error(f"Error fetching URLs: {e}")
        raise
    finally:
        connection.close()

def train_model():
    """Train and save the phishing detection model."""
    try:
        df = fetch_reported_urls()
        if df.empty:
            logger.warning("No data available for training.")
            return

        vectorizer = CountVectorizer(analyzer='char', ngram_range=(3, 5))
        X = vectorizer.fit_transform(df['url'])
        y = df['label'].astype(int)  # Ensure labels are integers

        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X, y)

        # Ensure flask-api directory exists
        import os
        os.makedirs('flask-api', exist_ok=True)

        with open('flask-api/phishing_model.pkl', 'wb') as model_file:
            pickle.dump(model, model_file)
        with open('flask-api/vectorizer.pkl', 'wb') as vectorizer_file:
            pickle.dump(vectorizer, vectorizer_file)

        logger.info("Model trained and saved successfully.")
    except Exception as e:
        logger.error(f"Error training model: {e}")
        raise

if __name__ == '__main__':
    train_model()