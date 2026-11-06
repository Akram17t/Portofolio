import * as THREE from 'three';

// Fluid-mask feedback approach: Cullen Webber's three-skull (MIT), see asset-credits.txt.
const vertexShader = `varying vec2 vUv;
void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const noise = `
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);
}
vec2 flow(vec2 p,float t){return vec2(noise(p+vec2(t*.17,0.)),noise(p+vec2(43.2,-t*.13)))-.5;}`;
const fluidShader = `
uniform sampler2D previous;
uniform vec2 size,mouse,last;
uniform float time,dt,brush;
varying vec2 vUv;
${noise}
void main(){
  vec2 aspect=vec2(size.x/size.y,1.);
  vec2 eddy=flow(vUv*13.,time);
  vec2 drift=eddy*.15*dt/aspect;
  vec2 uv=vUv-drift;
  vec2 spread=(.0015+abs(eddy)*.0025)/aspect;
  float dye=texture2D(previous,uv).r;
  dye=max(dye,texture2D(previous,uv+vec2(spread.x,0.)).r*.995);
  dye=max(dye,texture2D(previous,uv-vec2(spread.x,0.)).r*.995);
  dye=max(dye,texture2D(previous,uv+vec2(0.,spread.y)).r*.995);
  dye=max(dye,texture2D(previous,uv-vec2(0.,spread.y)).r*.995);
  dye=max(0.,dye-dt*.82);
  vec2 a=last*aspect,b=mouse*aspect,p=vUv*aspect;
  vec2 segment=b-a;
  float along=clamp(dot(p-a,segment)/max(dot(segment,segment),.000001),0.,1.);
  float distance=length(p-a-segment*along);
  float speed=min(length(segment)*4.,.12);
  float radius=.07+speed+noise(vUv*28.+time*.15)*.085;
  float stamp=(1.-smoothstep(radius*.7,radius,distance))*brush;
  gl_FragColor=vec4(max(dye,stamp),0.,0.,1.);
}`;
const revealShader = `
uniform sampler2D maskTexture,portraitTexture,topTexture,bottomTexture;
uniform vec2 size,imageSize;
uniform vec4 portraitRect;
uniform vec3 background,typeColor,accent;
uniform float time;
varying vec2 vUv;
${noise}
void main(){
  float density=texture2D(maskTexture,vUv).r;
  float wet=smoothstep(.3,.34,density+(noise(vUv*45.+time*.1)-.5)*.12);
  if(wet<.001){gl_FragColor=vec4(0.);return;}
  vec2 aspect=vec2(size.y/size.x,1.);
  vec2 warp=flow(vUv*18.,time)*aspect*.03*density;
  vec2 uv=vUv+warp;
  vec3 color=mix(background,typeColor,texture2D(topTexture,uv).a);
  // The photograph keeps its original coordinates; only the lettering is displaced.
  vec2 pos=vec2(vUv.x,1.-vUv.y)*size;
  vec2 local=(pos-portraitRect.xy)/portraitRect.zw;
  float scale=max(portraitRect.z/imageSize.x,portraitRect.w/imageSize.y);
  vec2 imageUV=(local-.5)*portraitRect.zw/(imageSize*scale)+.5;
  vec4 photo=texture2D(portraitTexture,vec2(imageUV.x,1.-imageUV.y));
  float inside=step(0.,local.x)*step(local.x,1.)*step(0.,local.y)*step(local.y,1.);
  color=mix(color,photo.rgb,photo.a*inside);
  color=mix(color,accent,texture2D(bottomTexture,uv).a);
  gl_FragColor=vec4(color,wet);
  #include <colorspace_fragment>
}`;

export async function createFluidReveal(stage, portrait) {
  const image = portrait.querySelector('img');
  await Promise.all([image.decode(), document.fonts.ready]);
  const canvas = document.createElement('canvas');
  canvas.className = 'portrait-fluid';
  canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
  } catch { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0, 0);
  const camera = new THREE.Camera();
  const scene = new THREE.Scene();
  const geometry = new THREE.PlaneGeometry(2, 2);
  const quad = new THREE.Mesh(geometry);
  quad.frustumCulled = false;
  scene.add(quad);
  let read = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false, stencilBuffer: false });
  let write = read.clone();
  const photo = await new THREE.TextureLoader().loadAsync(image.currentSrc || image.src);
  photo.colorSpace = THREE.SRGBColorSpace;
  photo.needsUpdate = true;
  const labels = ['.name-top', '.name-bottom'].map(selector => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    return { element: stage.querySelector(selector), canvas, context, texture, signature: '' };
  });
  const size = new THREE.Vector2();
  const uniforms = {
    previous: { value: read.texture }, size: { value: size },
    mouse: { value: new THREE.Vector2(-1,-1) }, last: { value: new THREE.Vector2(-1,-1) },
    time: { value: 0 }, dt: { value: 1/60 }, brush: { value: 0 },
  };
  const fluid = new THREE.ShaderMaterial({ vertexShader, fragmentShader: fluidShader, uniforms, depthTest: false, depthWrite: false });
  const styles = getComputedStyle(stage);
  const output = new THREE.ShaderMaterial({
    vertexShader, fragmentShader: revealShader, transparent: true, depthTest: false, depthWrite: false,
    uniforms: {
      maskTexture: { value: read.texture }, portraitTexture: { value: photo },
      topTexture: { value: labels[0].texture }, bottomTexture: { value: labels[1].texture },
      size: { value: size }, imageSize: { value: new THREE.Vector2(image.naturalWidth,image.naturalHeight) },
      portraitRect: { value: new THREE.Vector4() }, time: uniforms.time,
      background: { value: new THREE.Color(styles.backgroundColor) },
      typeColor: { value: new THREE.Color(styles.getPropertyValue('--portrait-type').trim()) },
      accent: { value: new THREE.Color(styles.getPropertyValue('--accent').trim()) },
    },
  });
  let enabled = true, visible = true, lost = false, frame = 0, lastTime = 0, lastMove = -Infinity, pointer;
  const clear = () => {
    for (const target of [read,write]) { renderer.setRenderTarget(target); renderer.clear(); }
    renderer.setRenderTarget(null); renderer.clear();
  };
  const resize = () => {
    if(size.x===stage.clientWidth&&size.y===stage.clientHeight)return;
    size.set(stage.clientWidth,stage.clientHeight);
    renderer.setSize(size.x,size.y,false);
    read.setSize(512,Math.max(128,Math.round(512*size.y/size.x)));
    write.setSize(read.width,read.height);
    // WebGL texture storage cannot grow with its canvas; reallocate after a resize.
    for(const label of labels){label.texture.dispose();label.canvas.width=size.x;label.canvas.height=size.y;label.texture.needsUpdate=true;label.signature='';}
    pointer=null;lastMove=-Infinity;clear();
  };
  const drawLabels = bounds => {
    for(const label of labels){
      const glyphs=[...label.element.querySelectorAll('.title-glyph')].map(glyph=>{
        const box=glyph.getBoundingClientRect(),style=getComputedStyle(glyph);
        return {text:glyph.textContent.toUpperCase(),box,opacity:+style.opacity,fontSize:parseFloat(style.fontSize)};
      });
      const signature=glyphs.map(g=>[g.box.x,g.box.y,g.box.width,g.opacity].map(v=>v.toFixed(1)).join(',')).join(';');
      if(signature===label.signature)continue;
      label.signature=signature;
      const ctx=label.context;ctx.clearRect(0,0,size.x,size.y);ctx.fillStyle='white';
      for(const {text,box,opacity,fontSize} of glyphs){
        if(!opacity||box.bottom<bounds.top||box.top>bounds.bottom)continue;
        ctx.font=`400 ${fontSize}px Anton`;
        const metrics=ctx.measureText(text);
        const ascent=metrics.fontBoundingBoxAscent,descent=metrics.fontBoundingBoxDescent;
        ctx.save();ctx.globalAlpha=opacity;
        ctx.translate(box.left-bounds.left,box.top-bounds.top+(box.height-ascent-descent)/2+ascent);
        ctx.scale(box.width/metrics.width,1);ctx.fillText(text,0,0);ctx.restore();
      }
      label.texture.needsUpdate=true;
    }
  };
  const previousMouse = new THREE.Vector2(-1,-1);
  const render = now => {
    frame=0;
    if(!enabled||!visible||document.hidden)return;
    const dt=Math.min((now-lastTime)/1000||1/60,1/30);lastTime=now;
    const age=now-lastMove;
    if(age>2100){clear();return;}
    const bounds=stage.getBoundingClientRect();
    if(pointer){
      uniforms.mouse.value.set((pointer.clientX-bounds.left)/bounds.width,1-(pointer.clientY-bounds.top)/bounds.height);
      if(age<30)uniforms.last.value.copy(uniforms.mouse.value).lerp(previousMouse,.5);
    }
    uniforms.dt.value=dt;uniforms.time.value=now*.001;
    uniforms.brush.value=pointer?Math.max(0,1-age/350):0;
    uniforms.previous.value=read.texture;
    quad.material=fluid;renderer.setRenderTarget(write);renderer.render(scene,camera);
    [read,write]=[write,read];
    uniforms.last.value.copy(uniforms.mouse.value);
    drawLabels(bounds);
    const box=portrait.getBoundingClientRect();
    output.uniforms.portraitRect.value.set(box.left-bounds.left,box.top-bounds.top,box.width,box.height);
    output.uniforms.maskTexture.value=read.texture;
    quad.material=output;renderer.setRenderTarget(null);renderer.render(scene,camera);
    frame=requestAnimationFrame(render);
  };
  const start = () => { if(!frame&&enabled&&visible&&!document.hidden){lastTime=performance.now();frame=requestAnimationFrame(render);} };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  const intersectionObserver = new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(!visible){pointer=null;lastMove=-Infinity;clear();}else start();});
  intersectionObserver.observe(stage);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pointer=null;lastMove=-Infinity;clear();}else start();});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;enabled=false;canvas.hidden=true;stage.classList.add('portrait-static');});
  stage.append(canvas);resize();
  return {
    move(event){
      if(!enabled)return;
      previousMouse.copy(uniforms.mouse.value);
      pointer=event;
      if(performance.now()-lastMove>150)previousMouse.set((event.clientX-stage.getBoundingClientRect().left)/size.x,1-(event.clientY-stage.getBoundingClientRect().top)/size.y);
      uniforms.last.value.copy(previousMouse);lastMove=performance.now();start();
    },
    leave(){pointer=null;lastMove=Math.min(lastMove,performance.now()-350);},
    setEnabled(value){enabled=value&&!lost;canvas.hidden=!enabled;pointer=null;lastMove=-Infinity;clear();},
  };
}
