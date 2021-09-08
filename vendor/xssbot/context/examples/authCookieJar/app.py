import sys
import flask
import requests

app = flask.Flask(__name__)
app.config['SECRET_KEY'] = 'secret'

@app.route('/')
def index():
    if flask.session.get('admin') == '1':
        print('We were blessed by the admin', file=sys.stderr)
        return 'hi admin'
    return 'unauthed'

@app.route('/visit')
def visit():
    requests.post('http://marvin:8000/visit', json={
        'url': 'http://webapp:8000/'
    }, headers={
        'x-ssrf-protection': '1'
    })
    return 'ok'

app.run('0.0.0.0', 8000)