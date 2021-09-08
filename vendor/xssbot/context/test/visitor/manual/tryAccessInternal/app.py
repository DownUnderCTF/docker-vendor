import flask
import time

app = flask.Flask(__name__)

@app.route('/')
def index():
    return '<iframe src="https://google.com"></iframe><iframe src="http://localhost:8000/statuz"></iframe>'

if __name__ == '__main__':
    app.run('0.0.0.0', 5000)
