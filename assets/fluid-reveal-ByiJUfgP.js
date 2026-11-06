import{W as Y,C as N,S as J,e as K,M as Q,f as Z,T as ee,g as te,h as ae,V as w,i as O,j as F,k as re}from"./three.module-BqLNiGr5.js";const E=`varying vec2 vUv;
void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,_=`
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);
}
vec2 flow(vec2 p,float t){return vec2(noise(p+vec2(t*.17,0.)),noise(p+vec2(43.2,-t*.13)))-.5;}`,oe=`
uniform sampler2D previous;
uniform vec2 size,mouse,last;
uniform float time,dt,brush;
varying vec2 vUv;
${_}
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
}`,ne=`
uniform sampler2D maskTexture,portraitTexture,topTexture,bottomTexture;
uniform vec2 size,imageSize;
uniform vec4 portraitRect;
uniform vec3 background,typeColor,accent;
uniform float time;
varying vec2 vUv;
${_}
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
}`;async function ce(r,P){const x=P.querySelector("img");await Promise.all([x.decode(),document.fonts.ready]);const m=document.createElement("canvas");m.className="portrait-fluid",m.setAttribute("aria-hidden","true");let i;try{i=new Y({canvas:m,alpha:!0,antialias:!1,powerPreference:"low-power"})}catch{return null}i.setPixelRatio(Math.min(devicePixelRatio,1.5)),i.setClearColor(0,0);const V=new N,R=new J,G=new K(2,2),b=new Q(G);b.frustumCulled=!1,R.add(b);let s=new Z(1,1,{depthBuffer:!1,stencilBuffer:!1}),h=s.clone();const U=await new ee().loadAsync(x.currentSrc||x.src);U.colorSpace=te,U.needsUpdate=!0;const S=[".name-top",".name-bottom"].map(e=>{const l=document.createElement("canvas"),p=l.getContext("2d"),n=new ae(l);return n.generateMipmaps=!1,{element:r.querySelector(e),canvas:l,context:p,texture:n,signature:""}}),t=new w,o={previous:{value:s.texture},size:{value:t},mouse:{value:new w(-1,-1)},last:{value:new w(-1,-1)},time:{value:0},dt:{value:1/60},brush:{value:0}},j=new O({vertexShader:E,fragmentShader:oe,uniforms:o,depthTest:!1,depthWrite:!1}),D=getComputedStyle(r),B=new O({vertexShader:E,fragmentShader:ne,transparent:!0,depthTest:!1,depthWrite:!1,uniforms:{maskTexture:{value:s.texture},portraitTexture:{value:U},topTexture:{value:S[0].texture},bottomTexture:{value:S[1].texture},size:{value:t},imageSize:{value:new w(x.naturalWidth,x.naturalHeight)},portraitRect:{value:new re},time:o.time,background:{value:new F(D.backgroundColor)},typeColor:{value:new F(D.getPropertyValue("--portrait-type").trim())},accent:{value:new F(D.getPropertyValue("--accent").trim())}}});let f=!0,z=!0,W=!1,T=0,M=0,d=-1/0,u;const y=()=>{for(const e of[s,h])i.setRenderTarget(e),i.clear();i.setRenderTarget(null),i.clear()},I=()=>{if(!(t.x===r.clientWidth&&t.y===r.clientHeight)){t.set(r.clientWidth,r.clientHeight),i.setSize(t.x,t.y,!1),s.setSize(512,Math.max(128,Math.round(512*t.y/t.x))),h.setSize(s.width,s.height);for(const e of S)e.canvas.width=t.x,e.canvas.height=t.y,e.signature="";u=null,d=-1/0,y()}},H=e=>{for(const l of S){const p=[...l.element.querySelectorAll(".title-glyph")].map(c=>{const v=c.getBoundingClientRect(),g=getComputedStyle(c);return{text:c.textContent.toUpperCase(),box:v,opacity:+g.opacity,fontSize:parseFloat(g.fontSize)}}),n=p.map(c=>[c.box.x,c.box.y,c.box.width,c.opacity].map(v=>v.toFixed(1)).join(",")).join(";");if(n===l.signature)continue;l.signature=n;const a=l.context;a.clearRect(0,0,t.x,t.y),a.fillStyle="white";for(const{text:c,box:v,opacity:g,fontSize:$}of p){if(!g||v.bottom<e.top||v.top>e.bottom)continue;a.font=`400 ${$}px Anton`;const A=a.measureText(c),q=A.fontBoundingBoxAscent,X=A.fontBoundingBoxDescent;a.save(),a.globalAlpha=g,a.translate(v.left-e.left,v.top-e.top+(v.height-q-X)/2+q),a.scale(v.width/A.width,1),a.fillText(c,0,0),a.restore()}l.texture.needsUpdate=!0}},C=new w(-1,-1),L=e=>{if(T=0,!f||!z||document.hidden)return;const l=Math.min((e-M)/1e3||1/60,1/30);M=e;const p=e-d;if(p>2100){y();return}const n=r.getBoundingClientRect();u&&(o.mouse.value.set((u.clientX-n.left)/n.width,1-(u.clientY-n.top)/n.height),p<30&&o.last.value.copy(o.mouse.value).lerp(C,.5)),o.dt.value=l,o.time.value=e*.001,o.brush.value=u?Math.max(0,1-p/350):0,o.previous.value=s.texture,b.material=j,i.setRenderTarget(h),i.render(R,V),[s,h]=[h,s],o.last.value.copy(o.mouse.value),H(n);const a=P.getBoundingClientRect();B.uniforms.portraitRect.value.set(a.left-n.left,a.top-n.top,a.width,a.height),B.uniforms.maskTexture.value=s.texture,b.material=B,i.setRenderTarget(null),i.render(R,V),T=requestAnimationFrame(L)},k=()=>{!T&&f&&z&&!document.hidden&&(M=performance.now(),T=requestAnimationFrame(L))};return new ResizeObserver(I).observe(r),new IntersectionObserver(([e])=>{z=e.isIntersecting,z?k():(u=null,d=-1/0,y())}).observe(r),document.addEventListener("visibilitychange",()=>{document.hidden?(u=null,d=-1/0,y()):k()}),m.addEventListener("webglcontextlost",e=>{e.preventDefault(),W=!0,f=!1,m.hidden=!0,r.classList.add("portrait-static")}),r.append(m),I(),{move(e){f&&(C.copy(o.mouse.value),u=e,performance.now()-d>150&&C.set((e.clientX-r.getBoundingClientRect().left)/t.x,1-(e.clientY-r.getBoundingClientRect().top)/t.y),o.last.value.copy(C),d=performance.now(),k())},leave(){u=null,d=Math.min(d,performance.now()-350)},setEnabled(e){f=e&&!W,m.hidden=!f,u=null,d=-1/0,y()}}}export{ce as createFluidReveal};
