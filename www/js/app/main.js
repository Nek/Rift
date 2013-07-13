require(['three.min','jquery', 'CSVToArray', 'domReady'],function (THREE, $, CSVToArray) {
// couple of constants
var POS_X = 1800;
var POS_Y = 500;	
var POS_Z = 1800;


var renderer = new THREE.WebGLRenderer();
renderer.setSize( 800, 600 );
document.body.appendChild( renderer.domElement );

var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(
    35,             // Field of view
    800 / 600,      // Aspect ratio
    0.1,            // Near plane
    10000           // Far plane
);
camera.position.set( POS_X, POS_Y, POS_Z );
camera.lookAt( scene.position );

var light = new THREE.DirectionalLight(0x3333ee, 3.5, 500 );
scene.add( light );
light.position.set(POS_X, POS_Y, POS_Z);

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

// simple function that converts the density data to the markers on screen
// the height of each marker is relative to the density.
function addDensity(data) {
	console.log("!");
   // the geometry that will contain all our cubes
   var everything = new THREE.Geometry();
   // material to use for each of our elements. Could use a set of materials to
   // add colors relative to the density. Not done here.
   var cubeMat = new THREE.MeshLambertMaterial({color: 0x000000,opacity:0.6, emissive:0xffffff});
   for (var i = 0 ; i < data.length-1 ; i++) {

       //get the data, and set the offset, we need to do this since the x,y coordinates
       //from the data aren't in the correct format
       var x = parseInt(data[i][0])+180;
       var y = parseInt((data[i][1])-84)*-1;
       var value = parseFloat(data[i][2]);

       // calculate the position where we need to start the cube
       var position = latLongToVector3(y, x, 600, 2);
       //console.log(position);
       // create the cube
       var cubeGeom = new THREE.CubeGeometry(5,5,1+value/8,1,1,1);
       cubeGeom.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0, -(1+value/8)/2 ) );
       var cube = new THREE.Mesh(cubeGeom, cubeMat);

       // position the cube correctly
       cube.position = position;
       cube.lookAt( new THREE.Vector3(0,0,0) );

       // merge with main model
       THREE.GeometryUtils.merge(everything,cube);
   }

   // create a new mesh, containing all the other meshes.
   var total = new THREE.Mesh(everything,cubeMat);

   // and add the total mesh to the scene
   scene.add(total);
}		
// add a simple light
function addLights() {
    light = new THREE.DirectionalLight(0x3333ee, 3.5, 500 );
    light.position.set(POS_X,POS_Y,POS_Z);
    scene.add( light );
}
function render() {
    var timer = Date.now() * 0.0001;
    camera.position.x = (Math.cos( timer ) *  1800);
    camera.position.z = (Math.sin( timer ) *  1800) ;
    camera.lookAt( scene.position );
    light.position = camera.position;
    light.lookAt(scene.position);
    renderer.render( scene, camera );
    requestAnimationFrame( render );
}
});