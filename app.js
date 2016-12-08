var express = require('express');
var app = express();
var oracledb = require('oracledb');
var mongodb = require('mongodb');

var MongoClient = mongodb.MongoClient;
var url = 'mongodb://ec2-35-162-23-28.us-west-2.compute.amazonaws.com/local'

//This function allows express to load static files from the root directory. In this case the express app will load the default html file (index.html)
app.use(express.static(__dirname + '/'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

var db;

function doRelease(connection)
{
  connection.release(
    function(err) {
      if (err) {
        console.error(err.message);
      }
    });
}

MongoClient.connect(url, function (err, database) {
	if (err) {
		console.log('Unable to connect to the mongoDB server. Error:', err);
	} else {
		console.log('Connection establised to', url);
		db = database;
		app.listen('3000', function(){
			console.log('Server running on port 3000');
		});
	}
})

app.get('/', function (req, res) {
	res.render('index');
});

app.get('/athlete', function (req, res) {
	oracledb.getConnection(
	  {
	    user          : "cis550projectklr",
	    password      : "cis550projectgco",
	    connectString : "(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=cis550project.czyk6pisuibz.us-west-2.rds.amazonaws.com)(PORT=1521))(CONNECT_DATA=(SID=MyDB)))"
	  },
	  function(err, connection)
	  {
	    if (err) {
	      console.error(err.message);
	      return;
	    }
	    connection.execute(
	      "SELECT a.country, m.type, COUNT(*) FROM MEDAL m INNER JOIN ATHLETE a ON m.athlete_id = a.id WHERE a.name = \'" + req.query.name + "\' GROUP BY m.Type, a.country ",
	      function(err, result)
	      {
	        if (err) {
	          console.error(err.message);
	          doRelease(connection);
	          return;
	        }
	        res.render('athlete', {
	        	name: req.query.name,
	        	results: result.rows
	        });
	        doRelease(connection);
	      });
	  });
})

app.get('/athletesearch', function (req, res) {
	res.render('athletesearch');
})

app.get('/athleteresults', function (req, res) {
	var condition = "";
	var words = req.query.query.split(" ");
	for (var i = 0; i < words.length; i++) {
		condition += "LOWER(a.name) LIKE LOWER(\'%" + words[i] + "%\') AND ";
	}
	condition = condition.slice(0, -4);
	console.log(condition);
	oracledb.getConnection(
	  {
	    user          : "cis550projectklr",
	    password      : "cis550projectgco",
	    connectString : "(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=cis550project.czyk6pisuibz.us-west-2.rds.amazonaws.com)(PORT=1521))(CONNECT_DATA=(SID=MyDB)))"
	  },
	  function(err, connection)
	  {
	    if (err) {
	      console.error(err.message);
	      return;
	    }
	    connection.execute(
	      "SELECT * FROM MEDAL m INNER JOIN ATHLETE a ON m.athlete_id = a.id WHERE " + condition,
	      function(err, result)
	      {
	        if (err) {
	          console.error(err.message);
	          doRelease(connection);
	          return;
	        }
	        res.render('athleteresults', {
	        	headers: result.metaData,
	        	results: result.rows
	        });
	        doRelease(connection);
	      });
	  });
});

app.get('/country/:name', function (req, res) {
	console.log(db.collection.countries.find({'Country': req.params.name}));
})

