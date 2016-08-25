// ------------------------------------------------------
// Variables
// ------------------------------------------------------
var map; // The map we are going to visualize...
var info = L.control(); // Variable to show additional information about the selected spatial object.
var baseMaps = {};
var overlayMaps = {};
var equipments;
var UPZlayer;
var redPrimariaLayer;
var redSecundariaLayer;
var properties;

// ------------------------------------------------------
// Functions
// ------------------------------------------------------

//Creates the indicator 1 chart
function addIndicator1Chart(msg){
    var col = [];
    col.push("ROP");
    for (var i = 0; i < msg.length; i++) {
        var value = parseFloat(msg[i].ROP);
        col.push(value);
    }
    var chart = c3.generate({
        bindto: '#indicator1',
        data: {
            columns: [col],
            type: 'bar',
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
        legend: {
            position: 'right'
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
    map = L.map('map').setView([4.69, -74.06], 11); // Initial position in the map (lat, long, zoom)
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
        equipments = pointLayer(msg);
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
    if (equipments !== undefined) overlayMaps.Equipments = equipments;
    if (properties !== undefined) {
      overlayMaps.Properties = properties;
      UPZlayer.addTo(map);
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

    map.on('overlayadd', function(eventLayer) {
        if (eventLayer.name === 'Properties') {
            this.removeControl(pointsLegend);
            pointsLegend.addTo(this);
        }
    });

    map.on('overlayremove', function(eventLayer) {
        if (eventLayer.name === 'Properties') {
            this.removeControl(pointsLegend);
            pointsLegend.addTo(this);
        }
    });
    pointsLegend.addTo(map);
}

// Creates the result point layer
function pointLayer(msg) {
    return L.geoJson(msg, {
        //style: css['.layer'], // The 'css' object was created by the support.js script!
        onEachFeature: function(feature, layer) { // The event for each one of the  dictionary elements --> Each feature is one spatial object
            layer.on({ // When this layer is active (this is a leaflet-provided method)
                mouseover: function() { // Here we are going to change the color and show the attributes of the object that is under the mouse...
                    info.update(feature.properties); // --> Update the info <div>
                    layer.setStyle(css['.focusedobject']); // --> and change the style...
                },
                mouseout: function() { // When the mouse leaves...
                    info.update(); // --> Clear the info <div>
                    layer.setStyle({
                        fillColor: setColorState(feature.properties.state),
                        radius: 4,
                        fillOpacity: 1,
                        stroke: true,
                        color: 'black',
                    }); // --> and set the original style...
                },
                click: function(e) {
                    map.fitBounds(e.target.getBounds()); // On click we are going to center the object in the view...
                }
            });
        },
        pointToLayer: function(feature, latlng) {
            return L.circleMarker(latlng, {
                fillColor: setColorState(feature.properties.state),
                radius: 4,
                fillOpacity: 1,
                stroke: true,
                color: 'black',
            });
        },
        style: function(feature) {
            return {
                fillColor: setColorState(feature.properties.state),
                radius: 4,
                fillOpacity: 1,
                stroke: true,
                color: 'black',
            };
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
    indicator = indicator * 100;
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
    if (state === "For sale") return colorbrewer.RdYlGn[4][3];
    else if (state === "Seeking tenant") return  colorbrewer.RdYlGn[4][2];
    else if (state === "Rented") return colorbrewer.RdYlGn[4][1];
    else  return  colorbrewer.RdYlGn[4][0];
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
