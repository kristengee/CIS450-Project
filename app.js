var express = require('express');
var app = express();
var oracledb = require('oracledb');
var mongodb = require('mongodb');
var infobox = require('wiki-infobox');
var md5 = require("blueimp-md5");
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

app.get('/athlete/:id', function (req, res) {
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
	      "SELECT a.name, a.gender, a.country, m.year, m.type, m.city, s.sport, s.event " +
	      "FROM Athlete a " +
	      "INNER JOIN Medal m ON a.id = m.athleteID " +
	      "INNER JOIN Sport s ON m.sportID = s.id " +
	      "WHERE a.id = '" + req.params.id + "' " +
	      "ORDER BY m.year",
	      function(err, result)
	      {
	        if (err) {
	          console.error(err.message);
	          doRelease(connection);
	          return;
	        }
	        var name = result.rows[0][0].split(", ");
	        var page = (name[1] + " " + name[0]).replace(/\w\S*/g, function (txt) {
	        	return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	        });
			var language = 'en';
			var a;
		
			infobox(page, language, function (err, data) {
				if (err) {
					// Render page without infobox data if it was not found
					res.render('athlete', {
						id: req.params.id,
						results: result.rows
					})
					//Fix case for strange names (kristen babb-sprague)
					return;
				} else {
					a = data;
					var bday = a.birth_date.value.replace(/[{}]/g, "").split('|');
					var birthdate = bday[2] + '/' + bday[3] + '/' + bday[1];
					var imgURL;
					if (data.image) {
						var imgFileName = data.image.value.replace(/ /g, "_");
						var hash = md5(imgFileName);
						imgURL = "https://upload.wikimedia.org/wikipedia/commons/" + hash.substring(0,1) + "/" + hash.substring(0,2) + "/" + imgFileName;
					} else {
						imgURL = null;
					}
					
	        		res.render('athlete', {
	        			id: req.params.id,
	        			results: result.rows,
	        			birth_date: birthdate,
	        			pic: imgURL
	        		});
	        		doRelease(connection);
				}
			});
	      });
	  });
})

app.get('/athletesearch', function (req, res) {
	res.render('athletesearch');
})

app.get('/countrysearch', function (req, res) {
	res.render('countrysearch');
})

app.get('/athleteresults', function (req, res) {
	var condition = "";
	var words = req.query.query.split(" ");
	for (var i = 0; i < words.length; i++) {
		condition += "LOWER(name) LIKE LOWER(\'%" + words[i] + "%\') AND ";
	}
	condition = condition.slice(0, -4);
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
	      "SELECT id, name FROM Athlete WHERE " + condition,
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

app.get('/country/:code', function (req, res) {
	db.collection('countries').findOne({Country: req.params.code}, function (error, results) {
		if(error) {
			console.log(error);
			return;
		}
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
		      "SELECT numAthletes, numMedals FROM Country WHERE countryCode = '" + req.params.code + "'",
		      function(err, result)
		      {
		        if (err) {
		          console.error(err.message);
		          doRelease(connection);
		          return;
		        }
		        res.render('country', {
		        	numAthletes: result.rows[0][0],
		        	numMedals: result.rows[0][1],
		        	data: results
		        });
		        doRelease(connection);
		      });
		  });
	});
})

app.get('/countryresults', function (req, res) {
	var condition = "";
	var words = req.query.query.split(" ");
	for (var i = 0; i < words.length; i++) {
		condition += "LOWER(name) LIKE LOWER(\'%" + words[i] + "%\') AND ";
	}
	
	condition = condition.slice(0, -4);
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
	      "SELECT * FROM Country WHERE " + condition,
	      function(err, result)
	      {
	        if (err) {
	          console.error(err.message);
	          doRelease(connection);
	          return;
	        }
	        console.log(result.rows);
	        res.render('countryresults', {
	        	headers: result.metaData,
	        	results: result.rows
	        });
	        doRelease(connection);
	      });
	  });
});

