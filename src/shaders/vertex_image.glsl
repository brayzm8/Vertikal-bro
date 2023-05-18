uniform sampler2D image;
varying vec2 vUv;
varying vec3 vPosition;
varying float vNoise;

void main() {
    vUv=uv;
    vPosition=position;
    // float dist = distance(uv, vec2(0.5));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}