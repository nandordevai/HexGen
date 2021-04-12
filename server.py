import codecs
import json

from flask import Flask, request, Response, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route('/<path:path>')
def static_file(path):
    return app.send_static_file(path)


@app.route('/save', methods=['POST'])
def save():
    with codecs.open(
        './maps/{}-{}.hm'.format(request.json['seed'],
                                 request.json['elevation']),
            'w', 'utf-8') as map_data:
        map_data.write(json.dumps(request.json['data']))
    return Response(status=201)


@app.route('/load/<seed>/<elevation>', methods=['GET'])
def load(seed, elevation):
    try:
        content = codecs.open(
            'maps/{}-{}.hm'.format(seed, elevation), 'r', 'utf-8').read()
    except IOError:
        content = None
    return jsonify(json.loads(content))
