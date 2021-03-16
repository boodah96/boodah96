'use strict';
//requires

const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override')
    // express server
const app = express();

//uses
require('dotenv').config();
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.set('view engine', 'ejs');

//PORT
const PORT = process.env.PORT || 3030;




//switch between client

// const client = new pg.Client(process.env.DATABASE_URL);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

//***ROUTS******/
app.get('/', homeHandler)
app.post('/myCollection', addToDBHandler)
app.get('/myCollection', myCollectionHandler)
app.get('/details/:id', detailsHandler)
app.delete('/details/:id', deleteDetailsHandler)
app.put('/details/:id', UpdateDetailsHandler)




//////////not found
app.get('*', errorNotFound)
    ///******Handlers***/
function homeHandler(req, res) {
    let URL = 'https://digimon-api.herokuapp.com/api/digimon';
    superagent.get(URL)
        .then(result => {
            let allDigimons = result.body.map(digimon => new Digimon(digimon));
            res.render('pages/Home', { data: allDigimons })
        }).catch(error => errorHandler(error));
}
///digimon Constructer
function Digimon(element) {
    this.name = element.name;
    this.img = element.img;
    this.level = element.level;
}

/*****addToDBHandler***/
function addToDBHandler(req, res) {
    let { name, img, level } = req.body
    let SQL = 'INSERT INTO digimon (name,img,level) VALUES ($1,$2,$3);'
    let safeValues = [name, img, level];
    client.query(SQL, safeValues)
        .then(() => {
            res.redirect('/myCollection')
        }).catch(error => errorHandler(error));

}

//**********myCollectionHandler***/
function myCollectionHandler(req, res) {
    let SQL = 'SELECT * FROM digimon;'
    client.query(SQL)
        .then(result => {
            res.render('pages/myCollection', { data: result.rows });
        }).catch(error => errorHandler(error));
}
///////
function detailsHandler(req, res) {
    let id = req.params.id;
    let SQL = 'SELECT * FROM digimon WHERE id=$1;';
    let safeVlue = [id];
    client.query(SQL, safeVlue)
        .then(result => {
            res.render('pages/details.ejs', { data: result.rows })
        }).catch(error => errorHandler(error));
}
///deleteDetailsHandler
function deleteDetailsHandler(req, res) {
    let id = req.params.id;
    let SQL = 'DELETE FROM digimon WHERE id=$1;';
    let safeVlue = [id];
    client.query(SQL, safeVlue)
        .then(() => {
            res.redirect('/myCollection')
        }).catch(error => errorHandler(error));

}
//UpdateDetailsHandler
function UpdateDetailsHandler(req, res) {
    let id = req.params.id;
    let { name, img, level } = req.body
    let SQL = 'Update digimon SET name=$1, img=$2, level=$3 WHERE id=$4;';
    let safeVlue = [name, img, level, id];
    client.query(SQL, safeVlue)
        .then(() => {
            res.redirect(`/details/${id}`)
        }).catch(error => errorHandler(error));
}

////errorHandler


function errorHandler(error, req, res) {
    res.status(500).send(error);
}

function errorNotFound(req, res) {
    res.status(404).send("page not Found");
}








client.connect(() => {
    app.listen(PORT, () => {
        console.log(`listening to PORT ${PORT}`);
    })
})