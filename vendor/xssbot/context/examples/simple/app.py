import flask
import requests

app = flask.Flask(__name__)

@app.route('/')
def index():
    return 'hi'

@app.route('/visit')
def visit():
    requests.post('http://marvin/visit', json={
        'url': 'http://webapp:8000/'
    }, headers={
        'x-ssrf-protection': '1'
    })
    return 'ok'

app.run('0.0.0.0', 8000)