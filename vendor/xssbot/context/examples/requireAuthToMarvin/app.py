import sys
import flask
import requests

app = flask.Flask(__name__)

@app.route('/')
def index():
    return 'hi'

@app.route('/visitbad')
def visitbad():
    requests.post('http://marvin:8000/visit', json={
        'url': 'http://webapp:8000/'
    }, headers={
        'x-ssrf-protection': '1'
    })
    return 'ok'

@app.route('/visitgood')
def visitgood():
    requests.post('http://marvin:8000/visit', json={
        'url': 'http://webapp:8000/'
    }, headers={
        'x-ssrf-protection': '1',
        'authorization': f'bearer mybearertoken'
    })
    return 'ok'

app.run('0.0.0.0', 8000)