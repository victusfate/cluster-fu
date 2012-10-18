var cluster = require('cluster');
var http = require('http');
var numCPUs = require('os').cpus().length;
var fs = require('fs');

var timeouts = [];

fs.readFile(__dirname + '/chainsaw-bobross.png', function(err, image_data){
  if (err) throw err;


  if (cluster.isMaster) {
    // Fork workers.
    for (var i = 0; i < numCPUs; i++) {
      cluster.fork();
    }
    cluster.on('fork', function(worker) {

      function errorMsg() {
        console.error("Something must be wrong with the connection, worker",worker.id,"failed to start");
      }      
      timeouts[worker.id] = setTimeout(errorMsg, 2000);
    });
    cluster.on('online', function(worker) {
      console.log("Yay, the worker responded after it was forked");
    });
    cluster.on('listening', function(worker, address) {
      console.log("worker ",worker.id,"is now connected to " + address.address + ":" + address.port);
      clearTimeout(timeouts[worker.id]);
    });
    cluster.on('disconnect', function(worker) {
      console.log('The worker #' + worker.id + ' has disconnected');
    });  
    cluster.on('exit', function(worker, code, signal) {
      clearTimeout(timeouts[worker.id]);
      console.log('worker ' + worker.process.pid + ' died ('+exitCode+'). restarting...');
      cluster.fork();
    });

  } else {
    // Workers can share any TCP connection
    // In this case its a HTTP server
    http.createServer(function(req, res) {
      res.writeHead(200);
      res.end(image_data);
    }).listen(8000);
  }

});
