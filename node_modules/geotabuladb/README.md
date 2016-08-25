**Welcome to the geotabuladb!**

GeoTabulaDB is a library to get geojson files from queries to different geodatabases. Currently, geotabuladb supports MySQL and PostgreSQL. The resulting geojson can have only geometry or geometry plus all properties or a subset of properties from the database. 

**Usage**  
Create a folder to hold the project and initialize it.
```
$ mkdir my_project
$ cd my_proyect
$ npm init
```
Install the library from npm
```
$ npm install geotabuladb
```

**Example**
```
var geo = require('geotabuladb');
geo.setCredentials({
    type: 'mysql',
    host: 'localhost',
    user: 'USER',
    password: 'PASSWORD',
    database: 'DATABASE_NAME'
});
geo.connectToDb();
geo.geoQuery({
	geometry : 'COLUMN_WITH_GEOMETRY',
	tableName : 'TABLE_NAME',
	properties : 'all'
}, function(json) {
	console.log(json);
});
```

**Credentials**  
To create a connection, first a user must set the credentials. The method `setCredentials()` receives as parameter an object with the following keys:  
* type: type of database. ('mysql', postgis')
* host: address of the host
* user: user
* password: password for the user
* database: database name  


**Queries**  
There are two types of queries: 

*GeoQuery*

The method `geoQuery(queryParams, callback)` receives an object and a callback function:
* queryParams
	* tableName: name of the table inside the database
	* geometry: name of the column that has the geometry
	* properties: the properties that will be added to the geojson ('none', 'all', array). If an array is provided, the geojson will have only the properties set inside the array
* callback: function to be called when the query returns 

*Query* 

The method `query(queryParams, callback)` receives an object and a callback function:
* queryParams
	*  tableName: name of the table inside the database
	*  where: 
	*  limit: How many rows are going to be retrieved
	*  properties: How are the properties going to be created ('all', array with properties' names)

