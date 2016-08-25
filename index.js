// ------------------------------------------------------
// Imports
// ------------------------------------------------------
var app = require('express')(); // WEB Server
var http = require('http').Server(app);
var geo = require('geotabuladb'); // Database operation
var express = require('express');
var parse = require('wellknown');

var io = require('socket.io')(http); // WebSockets handling
var fs = require('fs');

var glbs = require('./public/js/globals.js'); // With this we made the client and server shared variables available to the server

// ------------------------------------------------------
// Variables
// ------------------------------------------------------
var clients = {}; // Dictionary to storage client's sessions

geo.setCredentials({
    type: 'postgis',
    host: 'localhost',
    user: 'Meili',
    password: '',
    database: 'tomsa'
});

// Web server initialization...
app.use(express.static(__dirname + '/public')); // Setting up the public folder...

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html'); // Setting up the server root file...
});

http.listen(8082, function() { // Setting ip the server port...
    console.log('Server ready and listening on port:8082');
});

// ------------------------------------------------------
// Event Management
// ------------------------------------------------------
// When socket.io receives a connection...
io.on('connection', function(socket) {
    console.log(': Socket connection from client ' + socket.id);

    // Standard socket administration methods:
    if (!clients[socket.id]) { // If there is a new connection we should save the client id...
        console.log(':! This is a new connection request... ');
        clients[socket.id] = socket;
    }
    socket.on('disconnect', function() { // If we receive a disconnection request we should remove the client id...
        console.log(':! This is a disconnection request...');
        delete clients[socket.id];
    });

    // App specific methods:
    socket.on(glbs.INITIALIZE, function() {
        getROP(socket.id);
        getSegregationIndex(socket.id, 0);
        getData(socket.id, 'red_primaria', 'polyline');
        getInitialState(socket.id);
        console.log(':: This is a ' + glbs.INITIALIZE + ' request...');
    });

    socket.on(glbs.PREVIOUS, function(current) {
        console.log(':: This is a ' + glbs.PREVIOUS + ' request...');
        getSegregationIndex(socket.id,current - 1);
        getPrevious(socket.id, current);
    });

    socket.on(glbs.NEXT, function(current) {
        console.log(':: This is a ' + glbs.NEXT + ' request...');
        getSegregationIndex(socket.id,current + 1);
        getNext(socket.id, current);
    });
});

// ------------------------------------------------------
// Functions
// ------------------------------------------------------

function getData(socketId, table, type) {
    console.log(table);
    var parameters = {
        geometry: 'geom',
        tableName: table,
        properties: 'all',
    };

    geo.geoQuery(parameters, function(json) {
        json.type = type;
        json.table = table;
        clients[socketId].emit(glbs.SHOW_DATA, json); // Sending to the client the new event...
    });

}

function getInitialState(socketId) {
    var parameters = {
        geometry: 'geom',
        tableName: 'properties_state',
        where: '"step" = \'0\'',
        properties: 'all',
    };

    geo.geoQuery(parameters, function(json) {
        json.Time = 0;
        fs.appendFile('/Users/Meili/Desktop/dataBuena.json', JSON.stringify(json), 'utf8', function(err) {
            if (err) {
                return console.log(err);
            }
        });
        clients[socketId].emit(glbs.DRAW_MAP, json); // Sending to the client the new event...
    });
}

function getROP(socketId) {
    var query = "SELECT * FROM indicator1";
    var parameters = {
        querystring: query,
        debug: ''
    };
    geo.query(parameters, function(json) {
        clients[socketId].emit(glbs.I1_CHART, json); // Sending to the client the new event...
    });
}

function getSegregationIndex(socketId, time) {
    var query = 'SELECT i.si,i.step,u.*, ST_AsText(u.geom) AS wkt FROM indicator2 i INNER JOIN upz u ON i."idUPZ" = u.gid WHERE step = ' + time;
    console.log(query);
    var parameters = {
        querystring: query,
        debug: ''
    };
    geo.query(parameters, function(json) {
        var msg = {};
        msg.type = 'multipolygon';
        msg.features = [];
        for (var i = 0; i < json.length; i++) {
            var geometry = parse(json[i].wkt);
            var properties = {};
            var type = "Feature";
            properties.si = json[i].si;
            properties.step = json[i].step;
            properties.gid = json[i].gid;
            properties.objectid = json[i].objectid;
            properties.codigo_upz = json[i].codigo_upz;
            properties.nombre = json[i].nombre;
            properties.link = json[i].link;
            properties.zona_estac = json[i].zona_estac;
            properties.decreto_po = json[i].decreto_po;
            properties.decreto = json[i].decreto;
            properties.codigo_loc = json[i].codigo_loc;
            properties.simbolo = json[i].simbolo;
            properties.shape_leng = json[i].shape_leng;
            properties.shape_area = json[i].shape_area;
            var feature = {geometry:geometry,properties:properties,type:type};
            msg.features.push(feature);
        }
        msg.table = 'upz';
        clients[socketId].emit(glbs.SHOW_DATA, msg); // Sending to the client the new event...
    });
}

function getPrevious(socketId, current) {
    var parameters = {
        geometry: 'geom',
        tableName: 'properties_state',
        where: '"step" = \'' + (current - 1) + '\'',
        properties: 'all',
    };

    geo.geoQuery(parameters, function(json) {
        json.Time = current - 1;
        clients[socketId].emit(glbs.DRAW_MAP, json); // Sending to the client the new event...
    });
}

function getNext(socketId, current) {
    var parameters = {
        geometry: 'geom',
        tableName: 'properties_state',
        where: '"step" = \'' + (current + 1) + '\'',
        properties: 'all',
    };

    geo.geoQuery(parameters, function(json) {
        json.Time = current + 1;
        clients[socketId].emit(glbs.DRAW_MAP, json); // Sending to the client the new event...
    });
}
