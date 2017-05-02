// ------------------------------------------------------
// Variables
// ------------------------------------------------------
var map; // The map we are going to visualize...
var info = L.control(); // Variable to show additional information about the selected spatial object.
var baseMaps = {};
var overlayMaps = {};
var equipments;
var land;
var UPZlayer;
var redPrimariaLayer;
var redSecundariaLayer;
var properties;

// ------------------------------------------------------
// Functions
// ------------------------------------------------------

function setNewUPZValues(msg){
    UPZlayer = msg;
}

//Creates the indicator 1 chart
function addIndicator1Chart(msg){
    var col = [];
    col.push("ROP");
    for (var i = 0; i < msg.length; i++) {
        var value = parseFloat(msg[i].ROP);
        col.push(value);
    }
    var chart = c3.generate({
        size: {
            height: 240,
            width: 455
        },
        bindto: '#indicator1',
        data: {
            colors: {
              ROP:'#f0f0f0'
            },
            columns: [col],
            type: 'line',
            onclick: function(d,i) {
                console.log("Asking for simulation step: " + i);
                // getSpecific(socketId, i);
            },
        },
        legend: {
            show: false
        },
        zoom: {
            enabled: true
        },
        axis: {
            x: {
                label: 'Simulation Step'
            },
            y: {
                label: 'ROP Value'
            },
        },
        grid: {
            x: {
                show: true
            },
            y: {
                show: true
            }
        }
    });
}

// Creates the map
function createMap() {
    map = L.map('map').setView([6.80, -126.60], 9); // Initial position in the map (lat, long, zoom)
    map.addLayer(new L.TileLayer.provider('Esri.WorldGrayCanvas')); // The map provider we are going to use --> You must import the corresponding library in index.html
    map._layersMaxZoom = 20; // Define the maximum zoom in the map
    map._layersMinZoom = 5;

    L.control.scale({ // Manage the scale:
        position: 'bottomleft', // .. where is it located
        imperial: false // .. use the metric system (default is imperial)
    }).addTo(map);

    info.addTo(map); // Here we add the info DIV to the map itself
}

// Creates layer with data
function showData(msg) {
    if (msg.type === 'multipolygon'){
        UPZlayer = multipolygonLayer(msg);
        baseMaps.UPZ = UPZlayer;
    }
    else if (msg.type === 'polyline'){
        if (msg.table === 'red_primaria') {
            redPrimariaLayer = polylineLayer(msg);
            baseMaps.RedPrimaria = redPrimariaLayer;
        }
        else if (msg.table === 'red_secundaria') {
            redSecundariaLayer = polylineLayer(msg);
            baseMaps.RedSecundaria = redSecundariaLayer;
        }
    }
    else if (msg.type === 'point'){
        if (msg.table === "land") {
           baseMaps.Land = pointLayer(msg);
           land = msg;
        }
        else {
            if (overlayMaps.Equipments === undefined){
               overlayMaps.Equipments = pointLayer(msg);
               equipments = msg;
            }
            else {
                equipments.features.concat(msg.features);
                overlayMaps.Equipments = pointLayer(msg);
            }
        }
    }
}

// Creates layer with results
function showResults(msg) {
    properties = pointLayer(msg);
    overlayMaps.Properties = properties;
    addLayer();
}

// Adds layer to the map
function addLayer () {
    map.remove();
    createMap();

    if (UPZlayer !== undefined) baseMaps.UPZ = UPZlayer;
    if (redPrimariaLayer !== undefined) baseMaps.RedPrimaria = redPrimariaLayer;
    if (redSecundariaLayer !== undefined) baseMaps.RedSecundaria = redSecundariaLayer;
    if (equipments !== undefined) overlayMaps.Equipments = pointLayer(equipments);
    if (properties !== undefined) {
        overlayMaps.Properties = properties;
        // if (UPZlayer !== undefined){
        //     baseMaps.UPZ = UPZlayer;
        //     UPZlayer.addTo(map);
        // } 
        properties.addTo(map);
    }
    L.control.layers(baseMaps, overlayMaps, {
        position: 'topleft',
        collapsed: false
    }).addTo(map);

    addLegends();
}

// This function adds each layer legend
function addLegends() {
    var pointsLegend = L.control({
        position: 'bottomright'
    });
    var divisionsLegend = L.control({
        position: 'bottomright'
    });

    pointsLegend.onAdd = function(map) {
        var div = L.DomUtil.create('div', 'properties points legend'),
            values = getColorState(),
            labels = [];
        div.innerHTML += 'Properties<br>';
        for (var i = 0; i < values.length; i++) {
            div.innerHTML +=
                '<i style="background:' + setColorState(values[i]) + '" ></i> ' +
                values[i] + (values[i + 1] ? ' <br>' : ' ');
        }
        return div;
    };
    divisionsLegend.onAdd = function(map) {
        var div = L.DomUtil.create('div', 'divisions legend'),
            values = getDivisions(),
            labels = [];
        div.innerHTML += 'Segregation Index<br>';
        for (var i = 0; i < values.length; i++) {
            div.innerHTML +=
                '<i style="background:' + setMultipolygonColor((values[i] + 0.1)/10) + '" ></i> ' +
                (values[i]*100 + "%") + (values[i + 1] ? ' &ndash; ' + (values[i + 1]*100 + "%") +'<br>' : ' +');
        }
        return div;
    };


    map.on('overlayadd', function(eventLayer) {
        if (eventLayer.name === 'Properties') {
            this.removeControl(pointsLegend);
            pointsLegend.addTo(this);
        }
        if (eventLayer.name === 'UPZ') {
            divisionsLegend.addTo(this);
        }
    });

    map.on('overlayremove', function(eventLayer) {
        if (eventLayer.name === 'Properties') {
            this.removeControl(pointsLegend);
            pointsLegend.addTo(this);
        }
        if (eventLayer.name === 'UPZ') {
            this.removeControl(divisionsLegend);
        }
    });
    pointsLegend.addTo(map);
    divisionsLegend.addTo(map);
}

// Creates the result point layer
function pointLayer(msg) {
    return L.geoJson(msg, {
        //style: css['.layer'], // The 'css' object was created by the support.js script!
        onEachFeature: function(feature, layer) { // The event for each one of the  dictionary elements --> Each feature is one spatial object
            layer.on({ // When this layer is active (this is a leaflet-provided method)
                mouseover: function() { // Here we are going to change the color and show the attributes of the object that is under the mouse...
                    if (feature.properties.state === undefined){
                        info.update(feature.properties);
                        layer.setStyle({
                            fillColor: colorbrewer.PuBu[9][4],
                            radius: 5,
                            fillOpacity: 0.2,
                            stroke: false,
                        });
                    }
                    else{
                        info.update(feature.properties); // --> Update the info <div>
                        layer.setStyle(css['.focusedobject']); // --> and change the style...
                    }
                },
                mouseout: function() { // When the mouse leaves...
                    info.update();
                    if (feature.properties.state === undefined){
                        layer.setStyle({
                            fillColor: colorbrewer.PuBu[9][4],
                            radius: 5,
                            fillOpacity: 0.2,
                            stroke: false,
                        });
                    }
                    else{
                      info.update(); // --> Clear the info <div>
                      layer.setStyle({
                          fillColor: setColorState(feature.properties.state),
                          radius: 4,
                          fillOpacity: 1,
                          stroke: false,
                      }); // --> and set the original style...
                    }
                },
                click: function(e) {
                    map.fitBounds(e.target.getBounds()); // On click we are going to center the object in the view...
                }
            });
        },
        pointToLayer: function(feature, latlng) {
            console.log(feature);
            return L.circleMarker(latlng, {
                fillColor: setColorState(feature.properties.state),
                radius: 4,
                fillOpacity: 1,
                stroke: false,
            });
        },
        style: function(feature) {
            if (feature.properties.state === undefined){
                return {
                    fillColor: colorbrewer.PuBu[9][4],
                    radius: 5,
                    fillOpacity: 0.2,
                    stroke: false,
                };
            }
            else{
                return {
                    fillColor: setColorState(feature.properties.state),
                    radius: 4,
                    fillOpacity: 1,
                    stroke: false,
                };
            }
        }
    });
}

// Creates the multipolygon layer
function multipolygonLayer(msg) {
    return L.geoJson(msg, {
        onEachFeature: function(feature, layer) { // The event for each one of the  dictionary elements --> Each feature is one spatial object
            layer.on({ // When this layer is active (this is a leaflet-provided method)
                mouseover: function() { // Here we are going to change the color and show the attributes of the object that is under the mouse...
                    info.update(feature.properties); // --> Update the info <div>
                    layer.setStyle({
                        fillColor: 'black',
                        weight: 5,
                        opacity: 1,
                        color: 'gray',
                        dashArray: '3',
                        fillOpacity: 0.7
                    }); // --> and change the style...
                },
                mouseout: function() { // When the mouse leaves...
                    info.update(); // --> Clear the info <div>
                    layer.setStyle({
                        fillColor: setMultipolygonColor(feature.properties.si),
                        weight: 2,
                        opacity: 1,
                        color: 'white',
                        dashArray: '3',
                        fillOpacity: 0.7
                    }); // --> and set the original style...
                },
                click: function(e) {
                    map.fitBounds(e.target.getBounds()); // On click we are going to center the object in the view...
                }
            });
        },
        pointToLayer: function(feature, latlng) {
            return L.multiPolygon(latlng, {});
        },
        style: function(feature) {
            return {
                fillColor: setMultipolygonColor(feature.properties.si),
                weight: 2,
                opacity: 1,
                color: 'white',
                fillOpacity: 0.7
            };
        }
    });
}

function setMultipolygonColor(indicator) {
    indicator = indicator * 10;
    if (indicator > 0.83) return colorbrewer.Reds[6][5];
    else if (indicator > 0.67) return colorbrewer.Reds[6][4];
    else if (indicator > 0.50) return colorbrewer.Reds[6][3];
    else if (indicator > 0.33) return colorbrewer.Reds[6][2];
    else if (indicator > 0.17) return colorbrewer.Reds[6][1];
    else return colorbrewer.Reds[6][0];
}

// Creates the multipolygon layer
function polylineLayer(msg) {
    return L.geoJson(msg, {
        onEachFeature: function(feature, layer) { // The event for each one of the  dictionary elements --> Each feature is one spatial object
            layer.on({ // When this layer is active (this is a leaflet-provided method)
                mouseover: function() { // Here we are going to change the color and show the attributes of the object that is under the mouse...
                    info.update(feature.properties); // --> Update the info <div>
                    layer.setStyle({
                        weight: 5,
                        opacity: 1,
                        color: 'black',
                        dashArray: '3',
                    }); // --> and change the style...
                },
                mouseout: function() { // When the mouse leaves...
                    info.update(); // --> Clear the info <div>
                    layer.setStyle({
                        weight: 2,
                        opacity: 1,
                        color: "#f33",
                        dashArray: '3',
                    }); // --> and set the original style...
                },
                click: function(e) {
                    map.fitBounds(e.target.getBounds()); // On click we are going to center the object in the view...
                }
            });
        },
        pointToLayer: function(feature, latlng) {
            return L.polyline(latlng, {
                color: colorbrewer.PuBu[3][2],
            });
        },
        style: function(feature) {
            return {
                weight: 2,
                opacity: 1,
                color: "#f33",
                dashArray: '3',
            };
        }
    });
}

function setColorState(state) {
    if (state === "For sale") return colorbrewer.Accent[4][3];
    else if (state === "Seeking tenant") return  colorbrewer.Accent[4][2];
    else if (state === "Rented") return colorbrewer.Accent[4][1];
    else  return  colorbrewer.Accent[4][0];
}

function getDivisions() {
    return [0,0.17,0.33,0.50,0.67,0.83];
}

// This function returns an array with the possible speed colors
function getColorState() {
    return ["For sale", "Seeking tenant", "Rented", "Occupied"];
}

// This function creates the DIV to display the additional attributes of the selected spatial object
info.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'info'); // --> info refers to the CSS style to apply to the new object
    this.update();
    return this._div;
};

// This function updates the DIV when the selected spatial object changes
info.update = function(props) {
    var infoString = '<h4> Data </h4>';
    for (var item in props) {
        infoString += '<b>' + item + '</b> ' + props[item] + '</b> <br />';
    }

    this._div.innerHTML = infoString;
};
