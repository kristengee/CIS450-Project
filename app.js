var express = require('express');
var app = express();
var oracledb = require('oracledb');

//This function allows express to load static files from the root directory. In this case the express app will load the default html file (index.html)
app.use(express.static(__dirname + '/'));


oracledb.getConnection(
  {
    user          : "cis550projectlkr",
    password      : "cis550projectcgo",
    connectString : "(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=project.c2ntpcxpaf12.us-west-2.rds.amazonaws.com)(PORT=1521))(CONNECT_DATA=(SID=mydb)))"
  },
  function(err, connection)
  {
    if (err) {
      console.error(err.message);
      return;
    }
    connection.execute(
      "SELECT * FROM MEDAL",
      function(err, result)
      {
        if (err) {
          console.error(err.message);
          doRelease(connection);
          return;
        }
        console.log(result.metaData);
        console.log(result.rows);
        doRelease(connection);
      });
  });

function doRelease(connection)
{
  connection.release(
    function(err) {
      if (err) {
        console.error(err.message);
      }
    });
}

// When the server receives a get request on the root level, it will respond with a message using send() function
//app.get('/', function(req, res){
//        res.send('Hello from the other side');
//});

// When the server receives a get request with the path /hello, it will respnd by send an html file back to the client using the sendfile() function
app.get('/hello', function(req, res){
        res.sendfile("./hello.html");
});

app.listen('3333', function(){
	console.log('Server running on port 3333');
});
