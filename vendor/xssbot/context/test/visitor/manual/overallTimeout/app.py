import flask
import time

app = flask.Flask(__name__)

@app.route('/')
def index():
    return flask.redirect('/1')

@app.route('/<int:i>')
def redir(i):
    if i > 100:
        print('Too Many Redirect, cancelling')
        return 'Stop'
    time.sleep(0.5)
    # Js redirect so browser doesnt complain
    return f"<script>window.location = '/{i+1}';</script>"

if __name__ == '__main__':
    app.run('0.0.0.0', 5000)
