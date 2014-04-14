requirejs(['three.min','jquery', 'CSVToArray', 'domReady'],function (THREE, $, CSVToArray) {

process.chdir(process.env.HOME);

var osc = require('node-osc/lib/osc');
var oscServer;
var renderID;


var init = {};

init.cameraX = 1800;
init.rotation = 0;
init.verticalPosition = 500;
init.distance = 5000;
init.flatness = 0;

var frames = [];

var frameData = {};
var sceneReady = false;

var frames;
var recordMode = false;

function parseOSCValue(v){
  switch (v[0]) {
    case "/rotation":
      frameData.rotation = v[1];
      break;
    case "/vertical position":
      frameData.verticalPosition = v[1];
      break;
    case "/distance to camera":
      frameData.distance = v[1];
      break;
    case "/flatness":
      frameData.flatness = v[1];
      var d = {
          rotation: frameData.rotation,
          verticalPosition: frameData.verticalPosition,
          distance: frameData.distance,
          flatness: frameData.flatness,
          cameraX: 1800
        };
      if (recordMode) frames.push(d);
      renderID = requestAnimationFrame(function(){
        if (sceneReady) updateAndRender(d);
      });
      frameData = {};
      break;
    case "/record":
      recordMode = !recordMode;
      if (recordMode) frames = [];
      else console.log(frames);
    default: null;
  }
};

var data, id;

oscServer = new osc.Server(3333, '0.0.0.0');
oscServer.on("message", function (msg, rinfo) {
    if (msg[0] === "#bundle") {
      msg.slice(2).forEach(parseOSCValue);
    } else {
      parseOSCValue(msg);
    }
});

var currentFrame, saveMode;
saveMode = false;


$('body').keypress(function(e){
  if (e.keyCode === 114) {
    cancelAnimationFrame(renderID);
    currentFrame = 0;
    saveMode = true;
    renderID = requestAnimationFrame(render);
    console.log("started rendering");
  };
});


var renderer, scene, camera, light, total;

renderer = new THREE.WebGLRenderer({antialias:true, preserveDrawingBuffer: true});
renderer.setSize( 1200, 1200 );
renderer.domElement.setAttribute("id", "globe");
document.body.appendChild( renderer.domElement );

scene = new THREE.Scene();

camera = new THREE.PerspectiveCamera(
    35,             // Field of view
    1,      // Aspect ratio
    0.1,            // Near plane
    15000           // Far plane
);

//THREEx.WindowResize(renderer, camera);

camera.position.set( init.cameraX, init.verticalPosition, init.distance );
camera.lookAt( scene.position );

light = new THREE.DirectionalLight(0x3333ee, 3.5, 500 );
scene.add( light );
light.position.set(init.cameraX, init.verticalPosition, init.distance);

// convert the positions from a lat, lon to a position on a sphere.
function latLongToVector3(lat, lon, radius, heigth) {
    var phi = (lat)*Math.PI/180;
    var theta = (lon-180)*Math.PI/180;

    var x = -(radius+heigth) * Math.cos(phi) * Math.cos(theta);
    var y = (radius+heigth) * Math.sin(phi);
    var z = (radius+heigth) * Math.cos(phi) * Math.sin(theta);

    return new THREE.Vector3(x,y,z);
};

// simple function that converts the density data to the markers on screen
// the height of each marker is relative to the density.

function addDensity(data, rainbow) {
   // the geometry that will contain all our cubes
   var everything = new THREE.Geometry();
   var flatten = new THREE.Geometry();
   // material to use for each of our elements. Could use a set of materials to
   // add colors relative to the density. Not done here.

   var max = 0;
   var min = 1;
   for (var i = 0 ; i < data.length-1 ; i++) {

       //get the data, and set the offset, we need to do this since the x,y coordinates
       //from the data aren't in the correct format
       var x = parseInt(data[i][0])+180;
       var y = parseInt((data[i][1])-84)*-1;
       var value = parseFloat(data[i][2]);

       // calculate the position where we need to start the cube
       var position = latLongToVector3(y, x, 600, 2);
       //position = new THREE.Vector3(x*5,y*5,0);
       //console.log(position);
       // create the cube

       var depth = (5+Math.sqrt(4*value*5));
       var max = Math.max(max, depth);
       var min = Math.min(min, depth);
       //depth = 5;
       var color = rainbow.colourAt(depth);
       var cubeMat = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors });


       var cubeGeom = new THREE.CubeGeometry(5,5,depth,1,1,1);
       cubeGeom.faces.forEach(function(v){
        v.color.setHex(parseInt(color,16));
       });
       cubeGeom.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0, -(depth)/2 ) );
       var cube = new THREE.Mesh(cubeGeom, cubeMat);
       cube.position = position;
       cube.lookAt( new THREE.Vector3(0,0,0) );

       THREE.GeometryUtils.merge(everything,cube);


       var flatGeom = new THREE.CubeGeometry(5,5,5,1,1,1);
       //flatGeom.faces.forEach(function(v){
       // v.color.setHex(parseInt(color,16));
       //});
       //new THREE.MeshBasicMaterial({ color: parseInt(color,16) });
       var flat = new THREE.Mesh(flatGeom, cubeMat);
       // position the cube correctly
       flat.position = position;
       flat.lookAt( new THREE.Vector3(0,0,0) );

       // merge with main model
       THREE.GeometryUtils.merge(flatten,flat);
   }
   // create a new mesh, containing all the other meshes.
   //console.log(materials);
   everything.morphTargets.push({name:"target0", vertices: flatten.vertices})

   total = new THREE.Mesh(everything, new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors, morphTargets: true }));

   // and add the total mesh to the scene
   scene.add(total);

   sceneReady = true;

   updateAndRender(init);
};

//1. render frame to disk
//2. increase frame
//2. modify 3d scene
//3. request next frame


function updateAndRender(d) {
  total.morphTargetInfluences[0] = d.flatness;
  camera.position.set(1800, d.verticalPosition, d.distance);
  total.rotation.y = d.rotation * Math.PI / 180;
  camera.lookAt( scene.position );
  light.position = camera.position;
  light.lookAt(scene.position);
  renderer.render( scene, camera );
}

var fs = require('fs');

function formatFrame(n) {
  if (n < 10) return "00"+n;
  else if (n < 100) return "0"+n;
  else return n;
}

function render() {
  updateAndRender(frames[currentFrame]);
  renderID = requestAnimationFrame(function(){
    var image = renderer.domElement.toDataURL('image/png').slice(22);
    function onRender(err){
      if (err) throw err;
      console.log("rendered " + currentFrame + '.png');
      currentFrame ++;
      if (currentFrame === frames.length) {
        saveMode = false;
        console.log("done rendering")
      } else {
        renderID = requestAnimationFrame(render);
      };
    }
    fs.writeFile( formatFrame(currentFrame) + '.png', new Buffer(image, 'base64'), onRender);
  });
};

// we wait until the document is loaded before loading the
// density data.
$.get('data/density.csv', function(data) {

  var rainbow, colors;
  rainbow = new Rainbow();
  colors = [
       0x1A0822,
       0x541E72,
       0xA1365C,
       0xD85133,
       0xFA750D,
       0xFE9B19,
       0xFFC142,
       0xFFE48A
       //,0xFFF8DE
       ];
  rainbow.setSpectrum.apply(rainbow, colors.map(function(v){
    return '#' + v.toString(16);
  }));
  rainbow.setNumberRange(1, 200 );

  addDensity(CSVToArray(data), rainbow);
});

});

