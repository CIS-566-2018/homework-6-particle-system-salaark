import {vec3,vec4,mat4} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import Particle from './Particle';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  'Load Scene': loadScene, // A function pointer, essentially
  'Click Target': false,
};

let square: Square;
let time: number = 0.0;
let particles: Particle[];
let mouseD: boolean = false;
let mouseX: number = 0.0;
let mouseY: number = 0.0;
let mouseZ: number = 0.0;

function loadScene() {
  square = new Square();
  square.create();

  // Set up particles here. Hard-coded example data for now
  let offsetsArray = [];
  let colorsArray = [];
  particles = [];
  let n: number = 100.0;
  for(let i = 0; i < n; i++) {
    for(let j = 0; j < n; j++) {
      let p: Particle = new Particle(vec3.fromValues(i,j,0));
      p.color = vec3.fromValues(i/n, j/n, 1.0);
      particles.push(p);

      offsetsArray.push(i);
      offsetsArray.push(j);
      offsetsArray.push(0);

      colorsArray.push(i / n);
      colorsArray.push(j / n);
      colorsArray.push(1.0);
      colorsArray.push(1.0); // Alpha channel
    }
  }
  let offsets: Float32Array = new Float32Array(offsetsArray);
  let colors: Float32Array = new Float32Array(colorsArray);
  square.setInstanceVBOs(offsets, colors);
  square.setNumInstances(n * n); // nxn grid of "particles"
}

function updateParticles() {
  let offsetsArray = [];
  let colorsArray = [];
  let p: any;
  for(p in particles) {
    p = particles[p];
    offsetsArray.push(p.position[0]);
    offsetsArray.push(p.position[1]);
    offsetsArray.push(p.position[2]);

    colorsArray.push(p.color[0]);
    colorsArray.push(p.color[1]);
    colorsArray.push(p.color[2]);
    colorsArray.push(1.0); // Alpha channel

    if(mouseD && controls['Click Target']) {
      p.velocity = vec3.fromValues((mouseX-p.position[0])/50.0, (mouseY-p.position[1])/50.0, (mouseZ-p.position[2])/50.0);
      vec3.normalize(p.color, p.color);
    }
    p.update(time);
  }
  let offsets: Float32Array = new Float32Array(offsetsArray);
  let colors: Float32Array = new Float32Array(colorsArray);
  square.setInstanceVBOs(offsets, colors);
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'Click Target');

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(50, 50, 10), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE); // Additive blending

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/particle-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/particle-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    updateParticles();
    camera.update();
    stats.begin();
    lambert.setTime(time++);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    renderer.render(camera, lambert, [
      square,
    ]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  window.addEventListener('mousedown', function() {
    mouseD = true;
  }, false);

  window.addEventListener('mouseup', function() {
    mouseD = false;
  }, false);

  window.addEventListener('mousemove', function(e) {
    let mouse: vec3;
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    mouse = vec3.fromValues(mouseX, mouseY, 0.0);
    vec3.sub(mouse, mouse, camera.position);

    let camup: vec3 = camera.up;
    vec3.scale(camup, camup, 1.0);
    vec3.add(mouse, camup, mouse);
    let mouse4: vec4 = vec4.fromValues(mouse[0],mouse[1],mouse[2],1.0);
    let transform: mat4 = mat4.create();
    mat4.copy(transform, camera.viewMatrix);
    mat4.invert(transform, transform);
    vec4.transformMat4(mouse4, mouse4, transform);

    mouseX = mouse4[0];
    mouseY = mouse4[1];
    mouseZ = mouse4[2];
    console.log(mouseX+", "+mouseY+", "+mouseZ);
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
