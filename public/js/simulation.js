(function () {
  var app = angular.module('simulation', []);

  app.controller('SimulationController', function(){
    var _this = this;
    _this.socket = io();

    _this.socket.on(DRAW_MAP, function (msg) {
      console.log(DRAW_MAP+' request: '+msg);
      _this.time = msg.Time;
      showResults(msg);
    });

    _this.socket.on(SHOW_DATA, function (msg){
      // console.log(SHOW_DATA+' request: '+msg);
      showData(msg);
    });
    
    _this.socket.on(SHOW_ADD_DATA, function (msg){
      // console.log(SHOW_DATA+' request: '+msg);
      showData(msg);
    });

    _this.socket.on(I1_CHART, function (msg){
      console.log(I1_CHART+' request');
      addIndicator1Chart(msg);
    });

    _this.begin = begin;
    _this.previous = previous;
    _this.next = next;
    if (_this.time === undefined) _this.time = 0;

    function begin(){
      _this.socket.emit(INITIALIZE);
    }

    function previous(){
      _this.socket.emit(PREVIOUS,_this.time);
    }

    function next(){
      _this.socket.emit(NEXT,_this.time);
    }
  });
})();
