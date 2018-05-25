const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const cv = require('opencv');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', function(socket) {
  socket.on('stream', function(image) {
    let base64String = image; // Not a real image
    // Remove header
    let base64Image = base64String.split(';base64,').pop();

    fs.writeFile(
      './public/img/image.png',
      base64Image,
      { encoding: 'base64' },
      function(err) {
        console.log('File created');
        cv.readImage('./public/img/image.png', function(err, im) {
          if (err) throw err;
          // if (im.width() || im.height()) throw new Error('Image has no size');
          im.detectObject(
            './node_modules/opencv/data/haarcascade_frontalface_alt2.xml',
            {},
            function(err, faces) {
              if (err) throw err;

              for (var i = 0; i < faces.length; i++) {
                var face = faces[i];
                im.ellipse(
                  face.x + face.width / 2,
                  face.y + face.height / 2,
                  face.width / 2,
                  face.height / 2,
                  [234, 57, 0],
                  3
                );
              }

              const date = new Date().getTime();

              im.save('./public/img/detection/face-detection.jpg');

              let stream = fs.createReadStream(path.resolve(__dirname, './public/img/detection/face-detection.jpg'), {
                  encoding : 'binary'
              }), chunks =  [], delay = 0;

              stream.on('readable', function(){
                console.log('image se charge');
              });

              stream.on('data', function(chunck){
                chunks.push(chunck);
                socket.emit('play', chunck);
              });

              stream.on('end', function(){
                console.log('image bien chargée');
              });

              console.log('Image saved.');
            }
          );
        });
      }
    );
  });
});

http.listen(port, function() {
  console.info('Le serveur est lancé sur le port : ', port);
});
