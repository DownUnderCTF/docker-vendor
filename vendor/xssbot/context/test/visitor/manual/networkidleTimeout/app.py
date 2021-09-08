import flask
import time

app = flask.Flask(__name__)

@app.route('/')
def index():
    time.sleep(10)
    return ''

if __name__ == '__main__':
    app.run('0.0.0.0', 5000)