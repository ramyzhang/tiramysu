import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';

// ----------- set up the scene ------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xFFE5B4); // peach

const camera = new THREE.PerspectiveCamera(
    75, // fov
    window.innerWidth / window.innerHeight, // aspect ratio
    0.1, // near clipping plane
    1000 // far clipping plane
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight, false); // crunch!
document.body.appendChild(renderer.domElement);

// -------------- make a cube --------------
const textureLoader = new THREE.TextureLoader();
const textureIcing = textureLoader.load('/cake.png');
const textureSides = textureLoader.load('/cake-sides.png');
const textureBottom = textureLoader.load('/cake-bottom.png');

const geometry = new THREE.BoxGeometry(3, 1, 3);
const material = [
    new THREE.MeshBasicMaterial({ map: textureSides }), // right
    new THREE.MeshBasicMaterial({ map: textureSides }), // left
    new THREE.MeshBasicMaterial({ map: textureIcing }), // top
    new THREE.MeshBasicMaterial({ map: textureBottom }), // bottom
    new THREE.MeshBasicMaterial({ map: textureSides }), // front
    new THREE.MeshBasicMaterial({ map: textureSides }) // back
];
const cake = new THREE.Mesh(geometry, material);
cake.rotation.x = Math.PI / 6;
scene.add(cake);

camera.position.z = 5;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

// ----------- render the scene ------------
function animate() {
    cake.rotation.y += 0.01;
    renderer.render(scene, camera); // do this always at the end
}

// check if webgl is available
if (WebGL.isWebGL2Available()) {
	renderer.setAnimationLoop(animate); // 60 frames per sec
} else {
	const warning = WebGL.getWebGL2ErrorMessage();
	document.body.appendChild(warning);
}