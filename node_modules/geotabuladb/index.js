/**
 * GeoTabulaDB: A library to query geodatabases
 * @author Juan Camilo Ibarra
 * @version 0.0.0
 * @date July 2015
 */

/**
 * Module requires 
 */
var mysql = require('mysql');
var pg = require('pg');
var wkt = require('terraformer-wkt-parser');

/**
 * Credentials for the databas 
 */
var credentials = {
	'type' : 'default',
	'host' : 'localhost',
	'user' : 'anonymous',
	'password' : '',
	'database' : ''
};


/**
 * 
 * Sets the credentials for the connection 
 * @param {Object} pCredentials
*/
var setCredentials = function(pCredentials) {
	credentials.type = pCredentials.type ? pCredentials.type : 'mysql';
	credentials.host = pCredentials.host ? pCredentials.host : 'localhost';
	credentials.user = pCredentials.user ? pCredentials.user : 'anonymous';
	credentials.password = pCredentials.password ? pCredentials.password : '';
	credentials.database = pCredentials.database ? pCredentials.database : '';
};
/**
 * Returns a String with the credentials 
 */
var logCredentials = function() {
	var output = '';
	for (each in credentials) {
		output += each + ": " + credentials[each] + "\n";
	}
	return output;
}; 

/**
 * Connects to DB depending on the current credentials 
 */
var connectToDb = function() {
	var connection;
	if (credentials.type === 'mysql') {
		console.log("connection to mysql database.\n" + logCredentials());
		connection = mysql.createConnection({
			host     : credentials.host,
			user     : credentials.user,
			password : credentials.password,
			database : credentials.database
		});
		connection.connect(function(err){
			if(err)
			{
				console.error('error connecting: ' + err.stack);
				return;
			}
			console.log('connected!');
		});
	} else if (credentials.type === 'postgis') {
		///*
		console.log("connection to postgis database.\n" + logCredentials());
		var connectString = 'postgres://' 
						+ credentials.user 
						+ ':'
						+ credentials.password
						+ '@' 
						+ credentials.host
						+ '/'
						+ credentials.database;
		console.log(connectString);
		connection = new pg.Client(connectString);
		connection.connect(function(err){
			if(err)
			{
				console.log(err.stack);
				return console.error('could not connect to postgres', err);

			}
			console.log('connected');
		});
		//*/
	} else {
		throw "there is no valid db type. [type] = " + credentials.type;
	}
	
	return connection;
}; 
/**
 * End current connection 
 */
var endConnection = function(connection){
	if (credentials.type === 'mysql') {
		connection.end(function(err){
				
		});
	}
	else if(credentials.type == 'postgis')
	{
		connection.end();
	}
	else
	{
		throw "there is no valid db type. [type] = " + credentials.type;
	}
};

/**
 * Returns an object with the attributes
 * @param {Object} object with query parameters:<br>
 * <ul>
 * 		<li> <b>limit: </b>  How many rows are going to be inside query
		<li> <b>where: </b> 
		<li> <b>properties: </b> How are the properties going to be created (all, array with properties' names)
		</ul>
 * @param {Object} callback function
 */
var query = function(queryParams, callback) {
	
	var columns = [];
	var resultRows = [];
	var connection;
	if(queryParams.properties != undefined )
	{
		if(queryParams.properties.constructor === Array){
			for (prop in queryParams.properties){
				columns.push(queryParams.properties[prop]);	
			}
		}else if(queryParams.properties == 'all' ){
			columns.push('*');
		}
		
	} else{
		columns.push('*');
	}
	
	//Mysql query
	if (credentials.type === 'mysql') {
		//TODO implemetn this fucntion for mysql db
		console.error("Method NOT IMPLEMENTED for MySql DB");
	} else if(credentials.type === 'postgis'){

		var connectString = 'postgres://' + credentials.user + ':' + credentials.password + '@' + credentials.host + '/' + credentials.database;
		//console.log("Simple query to PostGis");
		
		connection = new pg.Client(connectString);
		connection.connect(function(err) {
			if (err) {
				return console.error('could not connect to postgres', err);
			}
			//console.log('connected');
			if (queryParams.debug)
			{
				console.log("Connected!");
				console.log(connectString);
			}
				
			
			var query;
			if (queryParams.querystring) {
				
				if(queryParams.querystring.indexOf(';') != -1)
				{
					console.log("ERROR: Possible code injection: " + queryParams.querystring);
				}
				else
				{
					query = queryParams.querystring;
				}
				
			} else {
				query = 'SELECT ';
				for (col in columns) {
					query += columns[col];
					if (col < columns.length - 1) {
						query += ', ';
					}
				}

				query += ' FROM ' + queryParams.tableName;

				if (queryParams.where != undefined) {
					query += ' WHERE ' + queryParams.where;
				}
				if (queryParams.limit != undefined) {
					query += ' LIMIT ' + queryParams.limit;
				}
				if (queryParams.groupby != undefined) {
					query += ' GROUP BY ' + queryParams.groupby;
				}
				query += ';';
				
			}	
			if (queryParams.debug)
				console.log(query);
			
			connection.query(query, function(err, result) {
				if (err) {
					console.log('error');
					console.log(err.stack);
				}
				connection.end();
				callback(result.rows);
			});
			connection.on('end', function(){
				if(queryParams.debug)		
					console.log("Connection ended");
			});				
		});
		
	} else {
		throw "there is no valid db type. [type] = " + credentials.type;
	}

};


/**
 * Creates a geojson 
 * @param {Object} object with query parameters:<br>
 * <ul>
 * 		<li> <b>geometry: </b>  column name that contains the geometry
		<li> <b>tableName: </b> table from the database
		<li> <b>properties: </b> How are the properties going to be created (all, none, array with properties' names)
		</ul>
 * @param {Object} callback function
 */
var geoQuery = function(queryParams, callback) {
	var connection;
	var geojson = {
			"type" : "FeatureCollection",
			"features" : []
		};
	var columns = [];
	if(queryParams.properties != undefined )
	{
		if(queryParams.properties.constructor === Array){
			for (prop in queryParams.properties){
				columns.push(queryParams.properties[prop]);	
			}
		}else if(queryParams.properties == 'all' ){
			columns.push('*');
		}
		
	} else{
		columns.push('*');
	}
	//Mysql query
	if (credentials.type === 'mysql') {
		var query = 'SELECT *, AsWKT(' + queryParams.geometry + ') AS wkt FROM ' + queryParams.tableName;		
		if(queryParams.dateColumn != undefined && queryParams.dateRange != undefined){ 
			query += ' WHERE ' + queryParams.dateColumn + ' BETWEEN ' + queryParams.dateRange;			
		}			
		if(queryParams.limit != undefined){
			query += ' LIMIT ' + queryParams.limit;
		}
		var queryCon = connection.query(query);
		queryCon
			.on('result', function(row){
				var geometry = wkt.parse(row.wkt);
				var properties = {};
				for(i in columns)
				{
					var col = columns[i];
					properties[col] = row[col];
				}
				var feature = {
					"type" : "Feature",
					"geometry" : geometry,
					"properties" : properties
				};
				geojson.features.push(feature);
			})
			.on('fields', function(fields){
				if(queryParams.properties == 'all')
				{
					for (i in fields) {
						var name = fields[i].name;
						if (name != queryParams.geometry && name != 'wkt')
							columns.push(fields[i].name);
					}
				}
				//console.log(columns);
			})
			.on('end', function(){
				//console.log('se acabo...');
				//console.log(geojson);
				callback(geojson);
			});
	} else if(credentials.type === 'postgis'){

		var connectString = 'postgres://' + credentials.user + ':' + credentials.password + '@' + credentials.host + '/' + credentials.database;
		//console.log("Query to PostGis");
		//console.log(connectString);
		connection = new pg.Client(connectString);
		connection.connect(function(err) {
			if (err) {
				return console.error('could not connect to postgres', err);
			}
			//console.log('connected');
			
			
			var query;
			if (queryParams.querystring) {
				
				if(queryParams.querystring.indexOf(';') != -1)
				{
					console.log("ERROR: Possible code injection: " + queryParams.querystring);
				}
				else
				{
					query = queryParams.querystring;
				}
			}
			else
			{
				query = 'SELECT ';
				for (col in columns) {
					query += columns[col];
					if (col < columns.length - 1) {
						query += ', ';
					}
				}
				
				query += ', ST_AsText(' + queryParams.geometry + ') AS wkt ';

				query += ' FROM ' + queryParams.tableName;
				if(queryParams.dateColumn != undefined && queryParams.dateRange != undefined){ 
				query += ' WHERE ' + queryParams.dateColumn + ' BETWEEN ' + queryParams.dateRange;
				if (queryParams.where != undefined) {
					query += ' AND '+queryParams.where;
				}
				}else if (queryParams.where != undefined) {
						query += ' WHERE ' + queryParams.where;
				}
				if(queryParams.order != undefined){
					query += ' ORDER BY ' + queryParams.order;
				}
				if(queryParams.limit != undefined){
					query += ' LIMIT ' + queryParams.limit;
				}
				query += ';';
			}
			
			console.log(query);
			connection.query(query, function(err, result) {
				if (err) {
					console.log('error');
					console.log(err.stack);
				}

				if(queryParams.properties == 'all')
				{
					for(field in result.fields){
						var name = result.fields[field].name;
						if (name != queryParams.geometry && name != 'wkt')
							columns.push(result.fields[field].name);
					}
				}

				for (each in result.rows) {
					var properties = {};
					for(i in columns){
						var col = columns[i];
						properties[col] = result.rows[each][col];
					}
					var Terraformer = require('terraformer');
					var WKT = require('terraformer-wkt-parser');			
					var geometry = WKT.parse(result.rows[each].wkt);
					var feature = {
						"type" : "Feature",
						"geometry" : geometry,
						"properties" : properties
					};
					geojson.features.push(feature);
				}
				callback(geojson);
				//console.log(data);
				//callback(data);
				connection.end();
			});
			// connection.on('end', function(){
				// client.end();
			// });				
		});
		
	} else {
		throw "there is no valid db type. [type] = " + credentials.type;
	}
};

/**
 * Test Function 
 */
var testFunction = function(){
	console.log("It´s working!");
};

module.exports = {
	
	setCredentials : setCredentials,
	logCredentials : logCredentials,
	connectToDb : connectToDb,
	//endConnection : endConnection,
	geoQuery : geoQuery,
	query : query,
	testFunction : testFunction
};

