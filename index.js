const express    = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.set('port', (process.env.PORT || 9001));
app.get('/', (req, res) => res.send('It works!'));

app.post('/post', function(req, res){
  
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
