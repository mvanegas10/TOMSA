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

var port = 3000;

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

http.listen(port, function() { // Setting ip the server port...
    console.log('Server ready and listening on port: ' + port);
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
        getSegregationIndex(socket.id,0);
        getROP(socket.id);        
        getData(socket.id, 'red_primaria', 'polyline', '"gid" IN (176,784,794,793,798,796,822,819,856,852,849,885,894,891,937,932,938,984,990,986,1029,1028,1076,1077,1113,1114,1117,1165,1164,1218,1221,1220,1280,1281,1284,1332,1330,1373,1368,1374,1418,1416,1455,1453,1487,1533,1527,51,48,52,64,63,76,94,91,90,96,102,101,106,110,109,114,113,118,117,122)');
        getAdditionalData(socket.id, 'bienestar', 'point');
        getAdditionalData(socket.id, 'culto', 'point');
        getAdditionalData(socket.id, 'cultura', 'point');
        getAdditionalData(socket.id, 'cysf', 'point');
        getAdditionalData(socket.id, 'deportes', 'point');
        getAdditionalData(socket.id, 'educacion', 'point');
        getAdditionalData(socket.id, 'edusup', 'point');
        getAdditionalData(socket.id, 'recintos_feriales', 'point');
        getAdditionalData(socket.id, 'sa', 'point');
        getAdditionalData(socket.id, 'salud', 'point');
        getAdditionalData(socket.id, 'seguridad', 'point');
        getAdditionalData(socket.id, 'land', 'point');
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
        if (current + 1 == 3) {
            getData(socket.id, 'red_primaria', 'polyline', '"gid" IN (985,974,973,1022,1020,1018,1015,1014,1013,1011,1002,1001,1006,1005,996,994,442,443,443,435,434,427,425,420,419,417,416,415,412,411,487,483,472,471,468,463,530,578)');
        }
        getSegregationIndex(socket.id,current + 1);
        getNext(socket.id, current);
    });
});

// ------------------------------------------------------
// Functions
// ------------------------------------------------------


function getAdditionalData(socketId, table, type) {
    var query = 'SELECT *, ST_AsText(geom) AS wkt FROM ' + table;
    // + ' WHERE "codigo_upz" IN (85,81,80,46,112,116,31,30,29,28,27)';
    var parameters = {
        querystring: query,
    };

    geo.query(parameters, function(json) {
        var msg = {};
        msg.type = 'point';
        msg.features = [];
        for (var i = 0; i < json.length; i++) {
            try{
                var geometry = parse(json[i].wkt);
                var properties = {};
                var type = "Feature";
                properties.gid = json[i].gid;
                properties.type = table;
                var feature = {geometry:geometry,properties:properties,type:type};
                msg.features.push(feature);
              }
              catch (err){}
        }
        msg.table = table;
        clients[socketId].emit(glbs.SHOW_ADD_DATA, msg); // Sending to the client the new event...
    });

}

function getData(socketId, table, type, specifics) {
    var parameters = {};
    if (specifics !== undefined) {
        parameters = {
            geometry: 'geom',
            tableName: table,
            properties: 'all',            
            where: specifics,
            debug: '',
        };
    }
    else {
        parameters = {
            geometry: 'geom',
            tableName: table,
            properties: 'all',
            debug: '',
        };
    }

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

function getSpecific(socketId, specificTime) {
    var parameters = {
        geometry: 'geom',
        tableName: 'properties_state',
        where: '"step" = \'' + specificTime + '\'',
        properties: 'all',
    };

    geo.geoQuery(parameters, function(json) {
        json.Time = specificTime;
        clients[socketId].emit(glbs.DRAW_MAP, json); // Sending to the client the new event...
    });
}
