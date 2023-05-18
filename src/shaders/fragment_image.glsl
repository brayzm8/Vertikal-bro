uniform sampler2D image;
uniform sampler2D uDisplacement;
uniform float progress;
uniform float uSpeed;
uniform float uResolution;
varying vec2 vUv;
uniform vec2 uMouse;
varying vec3 vPosition;

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

void main()	{
    
    float mouseDist = length(vUv-uMouse);
    
    float prox = 1.- map(mouseDist, 0., 0.1, 0., 1.);

	prox = clamp( prox, 0., 1.0 );

    vec2 zoomedUVmixed = mix(vUv, uMouse.xy + vec2(0.5) ,prox*progress);
    // vec4 textColor = texture2D(image, vUv);
    vec4 textColor = texture2D(image, zoomedUVmixed);
    
    // gl_FragColor = textColor;
    // gl_FragColor = vec4(prox,prox,prox, 1.);
    // gl_FragColor = vec4(1.,0.,0., 1.);

    // vec2 newUV = (vUv - vec2(0.5))*uResolution.zw + vec2(0.5);
    float normSpeed = clamp(uSpeed*5.,0.,1.);
    float circle = smoothstep(0.7, 0.,mouseDist);
  
    float r = texture2D(image,vUv + 0.1*0.5*circle*normSpeed).r;
    float g = texture2D(image,vUv + 0.1*0.3*circle*normSpeed).g;
    float b = texture2D(image,vUv + 0.1*0.1*circle*normSpeed).b;
    // gl_FragColor = vec4(normSpeed*mouseDist,0.,0., 1.);
    // gl_FragColor = vec4(circle,0.,0., 1.);
    gl_FragColor = vec4(r,g,b, 1.);
    // gl_FragColor = textColor;
    // gl_FragColor = vec4(1.,1.,1., 1.);

}