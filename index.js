const http = require('http');
const port = process.env.PORT || 3210;
const fs = require('fs');
const mysql = require('mysql');
const pool = mysql.createPool({
  host: "zanner.org.ua",
  port: "33321",
  user: "user",
  password: "123456789",
  database: "world_x"
});

exports.connection = {
    query: function () {
        var queryArgs = Array.prototype.slice.call(arguments),
            events = [],
            eventNameIndex = {};

        pool.getConnection(function (err, conn) {
            if (err) {
                if (eventNameIndex.error) {
                    eventNameIndex.error();
                }
            }
            if (conn) { 
                var q = conn.query.apply(conn, queryArgs);
                q.on('end', function () {
                    conn.release();
                });

                events.forEach(function (args) {
                    q.on.apply(q, args);
                });
            }
        });

        return {
            on: function (eventName, callback) {
                events.push(Array.prototype.slice.call(arguments));
                eventNameIndex[eventName] = callback;
                return this;
            }
        };
    }
};

http.createServer(function(req, res){
    if (req.url === '/') {
        res.writeHead(200, {'Content-Type': 'text/html'});
        fs.createReadStream('pages/index.html').pipe(res);
    } 
    else if (req.url === '/css/theme.css') {
        res.writeHead(200, {'Content-Type': 'text/css'});
        fs.createReadStream('css/theme.css').pipe(res);
    } 
    else if (req.url === '/data') {
    	res.writeHead(200, {'Content-Type': 'text/html'});
		console.log("before exports");
		
		exports.connection.query('SELECT * FROM countryinfo;', function(error, results) {
		    console.log("inside exports");
		    let str = '<head><link rel="stylesheet" type="text/css" href="css/theme.css"></head><body><p>hello iasa!</p>';
	
		    if (error) throw error
		    try {
		    	str += '<table>';
		    	for(var key in results){
			    	const data = JSON.parse(results[key].doc);
			      	  str += '<tr>';
			        str += '<td>'+ data.Name+'</td>';
			        str += '<td>'+ data.geography.Continent+'</td>';
			        str += '<td>'+ data.geography.SurfaceArea+'</td>';
			      	str += '</tr>';
			    	console.log(data);
		    	}
		      	str += '</table>';
		    } 
		    catch(err) {
		      console.error(err)
			    } 
			str += "</body>";
			res.write(str);  
		    console.log(results); // [{2: 2}]
		    });
    }
    else{
        res.writeHead(404, {'Content-Type': 'text/html'});
        fs.createReadStream('pages/404.html').pipe(res);
    }    
 }).listen(port);