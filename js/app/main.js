require(['three.min','jquery', 'CSVToArray', 'domReady'],function (THREE, $, CSVToArray) {

// Setup scene parameters object
function Params() {
  this.cameraX = 1800;
  this.cameraY = 500;
  this.cameraZ = 1800;
}
var params = new Params();

var renderer = new THREE.WebGLRenderer({'antialias':true});
renderer.setSize( 1200, 1200 );
document.body.appendChild( renderer.domElement );
window.el = renderer.domElement;

var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(
    35,             // Field of view
    1,      // Aspect ratio
    0.1,            // Near plane
    15000           // Far plane
);

//THREEx.WindowResize(renderer, camera);

camera.position.set( params.cameraX, params.cameraY, params.cameraZ );
camera.lookAt( scene.position );

var light = new THREE.DirectionalLight(0x3333ee, 3.5, 500 );
scene.add( light );
light.position.set(params.cameraX, params.cameraY, params.cameraZ);

 // we wait until the document is loaded before loading the
 // density data.
$.get('data/density.csv', function(data) {
  addDensity(CSVToArray(data));
  render();
});
 //});

// convert the positions from a lat, lon to a position on a sphere.
function latLongToVector3(lat, lon, radius, heigth) {
    var phi = (lat)*Math.PI/180;
    var theta = (lon-180)*Math.PI/180;

    var x = -(radius+heigth) * Math.cos(phi) * Math.cos(theta);
    var y = (radius+heigth) * Math.sin(phi);
    var z = (radius+heigth) * Math.cos(phi) * Math.sin(theta);

    return new THREE.Vector3(x,y,z);
}

var total;
// simple function that converts the density data to the markers on screen
// the height of each marker is relative to the density.
var rainbow = new Rainbow();
var colors = [
       0x1A0822,
       0x541E72,
       0xA1365C,
       0xD85133,
       0xFA750D,
       0xFE9B19,
       0xFFC142,
       0xFFE48A,
       0xFFF8DE
       ];
rainbow.setSpectrum.apply(rainbow, colors.map(function(v){
  return '#' + v.toString(16);
}));
rainbow.setNumberRange(1, 200 ); 
function addDensity(data) {
   // the geometry that will contain all our cubes
   everything = new THREE.Geometry();
   // material to use for each of our elements. Could use a set of materials to
   // add colors relative to the density. Not done here.
      var materials = [];

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
       var cubeGeom = new THREE.CubeGeometry(5,5,depth,1,1,1);
       cubeGeom.faces.forEach(function(v){
        v.color.setHex(parseInt(color,16));
       });
       cubeGeom.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0, -(depth)/2 ) );
       var cubeMat = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors });
       //new THREE.MeshBasicMaterial({ color: parseInt(color,16) });
       materials.push(cubeMat);
       var cube = new THREE.Mesh(cubeGeom, cubeMat);

       // position the cube correctly
       cube.position = position;
       cube.lookAt( new THREE.Vector3(0,0,0) );

       // merge with main model
       THREE.GeometryUtils.merge(everything,cube,i);
   }
   // create a new mesh, containing all the other meshes.
   //console.log(materials);
   total = new THREE.Mesh(everything, new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors }));

   // and add the total mesh to the scene
   scene.add(total);
}   
// add a simple light
function addLights() {
    light = new THREE.DirectionalLight(0x3333ee, 3.5, 500 );
    light.position.set(params.cameraX,params.cameraY,params.cameraZ);
    scene.add( light );
}

var axis = new THREE.Vector3(0,1,0);

function render() {
    var timer = Date.now() * 0.0001;
    //camera.position.x = (Math.cos( timer ) *  params.cameraX);
    //camera.position.z = (Math.sin( timer ) *  params.cameraZ) ;
    camera.lookAt( scene.position );
    light.position = camera.position;
    light.lookAt(scene.position);
    renderer.render( scene, camera );
    requestAnimationFrame( render );
    rotateAroundWorldAxis(total, axis, (Math.PI / 180)/90);

}

// Rotate an object around an arbitrary axis in object space
var rotObjectMatrix;
function rotateAroundObjectAxis(object, axis, radians) {
    rotObjectMatrix = new THREE.Matrix4();
    rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);

    // old code for Three.JS pre r54:
    // object.matrix.multiplySelf(rotObjectMatrix);      // post-multiply
    // new code for Three.JS r55+:
    object.matrix.multiply(rotObjectMatrix);

    // old code for Three.js pre r49:
    // object.rotation.getRotationFromMatrix(object.matrix, object.scale);
    // new code for Three.js r50+:
    object.rotation.setEulerFromRotationMatrix(object.matrix);
}

var rotWorldMatrix;
// Rotate an object around an arbitrary axis in world space       
function rotateAroundWorldAxis(object, axis, radians) {
    rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);

    // old code for Three.JS pre r54:
    //  rotWorldMatrix.multiply(object.matrix);
    // new code for Three.JS r55+:
    rotWorldMatrix.multiply(object.matrix);                // pre-multiply

    object.matrix = rotWorldMatrix;

    // old code for Three.js pre r49:
    // object.rotation.getRotationFromMatrix(object.matrix, object.scale);
    // new code for Three.js r50+:
    object.rotation.setEulerFromRotationMatrix(object.matrix);
}

// Setup GUI


var gui = new dat.GUI({
        load: 'presets.json'
    });

function updateCam() {
  camera.position.set(params.cameraX, params.cameraY, params.cameraZ);
}
 
gui.add(params, 'cameraX').onChange(updateCam);
gui.add(params, 'cameraY').onChange(updateCam);
gui.add(params, 'cameraZ').onChange(updateCam);

gui.remember(params);
gui.revert();
});