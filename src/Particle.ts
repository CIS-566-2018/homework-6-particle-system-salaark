import {vec3} from 'gl-matrix';
import Drawable from './rendering/gl/Drawable';
import {gl} from './globals';

class Particle {
  position: vec3;
  velocity: vec3;
  acceleration: vec3;
  color: vec3;

  constructor(pos: vec3) {
    this.position = pos;
    this.velocity = vec3.fromValues(0,0,0);
    this.acceleration = vec3.fromValues(0,0,0);
    this.color = vec3.fromValues(0,0,0);
  }

  update(time: number) {
    vec3.add(this.position, this.position, this.velocity);
    vec3.add(this.velocity, this.velocity, this.acceleration);
  }
};

export default Particle;
