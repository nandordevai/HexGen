import codecs
from io import BytesIO
import json
import base64

from flask import Flask, request, Response, jsonify, render_template
from flask_cors import CORS
from PIL import Image

app = Flask(__name__)
CORS(app)


@app.route('/<path:path>')
def static_file(path):
    return app.send_static_file(path)


@app.route('/save', methods=['POST'])
def save():
    filename = '{}-{}-{}'.format(request.json['seed'],
                                 request.json['elevationUp'], request.json['elevationDown'])
    with codecs.open(
        './maps/{}.hm'.format(filename),
            'w', 'utf-8') as map_data:
        map_data.write(json.dumps(request.json['data']))
    # data:image/png;base64,
    image = Image.open(BytesIO(base64.b64decode(request.json['image'][22:])))
    image.thumbnail((640, 360), resample=Image.LANCZOS)
    image.save('./maps/{}.png'.format(filename))
    return Response(status=201)


@app.route('/load/<seed>/<elevation>', methods=['GET'])
def load(seed, elevationUp, elevationDown):
    try:
        content = codecs.open(
            'maps/{}-{}-{}.hm'.format(seed, elevationUp, elevationDown), 'r', 'utf-8').read()
    except IOError:
        content = None
    return jsonify(json.loads(content))


@app.route('/')
def index():
    return render_template('index.html')


if __name__ == '__main__':
    app.run(debug=True, use_reloader=True)
