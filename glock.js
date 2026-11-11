import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {rng,fbm,grayTex,normalTex} from './textures.js';

// ---- geometry helpers (all merged per material => ~9 draw calls for the entire viewmodel) ----
const ni=g=>g.index?g.toNonIndexed():g;
const merge=l=>{const g=mergeGeometries(l.map(ni));l.forEach(x=>x.dispose());return g;};
const T=(g,x=0,y=0,z=0,rx=0,ry=0,rz=0)=>g.rotateX(rx).rotateY(ry).rotateZ(rz).translate(x,y,z);
const box=(w,h,d,...a)=>T(new THREE.BoxGeometry(w,h,d),...a);
function bevBox(w,h,d,b=.002,...a){const hw=w/2-b,hh=h/2-b,s=new THREE.Shape();
  s.moveTo(-hw,-hh);s.lineTo(hw,-hh);s.lineTo(hw,hh);s.lineTo(-hw,hh);s.closePath();
  const g=new THREE.ExtrudeGeometry(s,{depth:d-2*b,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:1});
  return T(g.translate(0,0,-(d-2*b)/2),...a);}
const ease=x=>x*x*(3-2*x),clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));

function makeMats(){const r=rng(7),S=128,st=new Float32Array(S*S).map(()=>r()),f=fbm(S,r,4,8);
  const rep=(t,n)=>{t.repeat.set(n,n);return t;};
  const poly=new THREE.MeshStandardMaterial({color:0x232427,roughness:1,roughnessMap:rep(grayTex(S,st,.55,.95),40),normalMap:rep(normalTex(S,st,1.4),40)});
  const slide=new THREE.MeshStandardMaterial({color:0x2a2d32,metalness:.85,roughness:1,roughnessMap:rep(grayTex(S,f,.28,.5),30),normalMap:rep(normalTex(S,f,5),30)});
  const dark=new THREE.MeshStandardMaterial({color:0x0e0f11,metalness:.5,roughness:.6});
  const bare=new THREE.MeshStandardMaterial({color:0x8a8f96,metalness:1,roughness:.28});
  const glove=new THREE.MeshStandardMaterial({color:0x202226,roughness:.95,normalMap:rep(normalTex(S,st,.7),30)});
  const sleeve=new THREE.MeshStandardMaterial({color:0x363c30,roughness:.95});
  const white=new THREE.MeshBasicMaterial({color:0xf4f4f0});
  return {poly,slide,dark,bare,glove,sleeve,white};}
function flashTex(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'#fff');g.addColorStop(.25,'#ffd28a');g.addColorStop(.6,'rgba(255,120,30,.45)');g.addColorStop(1,'rgba(255,80,0,0)');
  x.fillStyle=g;x.fillRect(0,0,64,64);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}

export class Glock{
  constructor(){
    const M=makeMats(),mesh=(g,m)=>{const o=new THREE.Mesh(g,m);return o;};
    this.root=new THREE.Group();this.gun=new THREE.Group();this.root.add(this.gun);
    // Frame: dust cover + tactical rail ribs + trigger guard
    const guard=new THREE.TorusGeometry(.02,.0035,6,14,Math.PI).rotateZ(Math.PI).scale(1,1,3.5).rotateY(Math.PI/2).translate(0,.006,-.03);
    this.gun.add(mesh(merge([bevBox(.026,.024,.15,.002,0,.017,-.06),guard,box(.0215,.003,.006,0,.0033,-.1),box(.0215,.003,.006,0,.0033,-.115),box(.0215,.003,.006,0,.0033,-.13)]),M.poly));
    this.gun.add(mesh(T(new THREE.CylinderGeometry(.0065,.0065,.066,10),0,.045,-.139,Math.PI/2),M.bare)); // barrel
    // Slide (animated): beveled body, iron sights; serrations + ejection port in dark; sight dots unlit white
    this.slide=new THREE.Group();this.gun.add(this.slide);
    this.slide.add(mesh(merge([bevBox(.028,.032,.19,.003,0,.045,-.075),box(.006,.007,.01,-.0075,.0645,.004),box(.006,.007,.01,.0075,.0645,.004),box(.004,.008,.009,0,.065,-.16)]),M.slide));
    const ser=[];for(let i=0;i<6;i++)ser.push(box(.0305,.018,.0014,0,.046,.012-i*.0045));for(let i=0;i<3;i++)ser.push(box(.0305,.018,.0014,0,.046,-.145-i*.0045));
    ser.push(box(.0024,.011,.036,.0143,.053,-.04));this.slide.add(mesh(merge(ser),M.dark));
    this.slide.add(mesh(merge([box(.0022,.0022,.001,0,.0666,-.1553),box(.002,.002,.001,-.0075,.0655,.0093),box(.002,.002,.001,.0075,.0655,.0093)]),M.white));
    // Grip pivot (rakes back ~19deg) holds grip, magazine, glove hand
    this.grip=new THREE.Group();this.grip.position.set(0,.026,0);this.grip.rotation.x=-.34;this.gun.add(this.grip);
    this.grip.add(mesh(bevBox(.03,.1,.044,.002,0,-.05,0),M.poly));
    this.mag=new THREE.Group();this.grip.add(this.mag);
    this.mag.add(mesh(merge([bevBox(.0225,.11,.032,.0015,0,-.058,.001),box(.03,.009,.044,0,-.108,.0015)]),M.poly));
    this.grip.add(mesh(merge([bevBox(.036,.08,.03,.004,0,-.04,.034),bevBox(.036,.017,.026,.004,0,-.052,-.034),bevBox(.036,.017,.026,.004,0,-.07,-.034),
      bevBox(.036,.017,.026,.004,0,-.088,-.034),bevBox(.014,.018,.07,.004,-.024,-.004,-.012),bevBox(.012,.013,.075,.004,.0215,-.012,-.055)]),M.glove));
    this.trigger=mesh(box(.006,.022,.006,0,-.008,0),M.dark);this.trigger.position.set(0,.012,-.022);this.trigger.rotation.x=.25;this.gun.add(this.trigger);
    const arm=mesh(new THREE.CylinderGeometry(.042,.034,.34,12).rotateX(Math.PI/2),M.sleeve);arm.position.set(.012,-.115,.19);arm.rotation.x=.38;this.gun.add(arm);
    // Muzzle flash: 3 additive quads + point light (cheap "light pooling" on gun/hand)
    const fm=new THREE.MeshBasicMaterial({map:flashTex(),blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,toneMapped:false,side:THREE.DoubleSide});
    this.flash=new THREE.Group();this.flash.position.set(0,.045,-.19);
    this.flash.add(new THREE.Mesh(new THREE.PlaneGeometry(.2,.1).rotateY(Math.PI/2).translate(0,0,-.07),fm),new THREE.Mesh(new THREE.PlaneGeometry(.2,.1).rotateX(Math.PI/2).translate(0,0,-.07),fm),new THREE.Mesh(new THREE.PlaneGeometry(.1,.1),fm));
    this.flash.visible=false;this.gun.add(this.flash);
    this.light=new THREE.PointLight(0xffa04a,0,1.5,2);this.light.position.set(0,.06,-.23);this.gun.add(this.light);
    // state
    this.MAG=20;this.ammo=20;this.reserve=120;this.cool=0;this.kick=0;this.slideK=0;this.flashT=0;this.bobT=0;this.bobAmp=0;this.swX=0;this.swY=0;this.land=0;this.air=0;
    this.reloading=false;this.rt=0;this.RELOAD=1.8;
  }
  canFire(){return!this.reloading&&this.ammo>0&&this.cool<=0;}
  fire(){if(!this.canFire())return false;this.ammo--;this.cool=.09;this.kick=1;this.slideK=1;this.flashT=.045;this.flash.rotation.z=Math.random()*6.28;this.flash.scale.setScalar(.8+Math.random()*.5);return true;}
  startReload(){if(this.reloading||this.ammo>=this.MAG||this.reserve<=0)return false;this.reloading=true;this.rt=0;return true;}
  update(dt,s){ // s:{speed,grounded,mdx,mdy,landImpact}
    this.cool-=dt;this.kick*=Math.exp(-18*dt);this.slideK=Math.max(0,this.slideK-dt*14);this.flashT=Math.max(0,this.flashT-dt);
    const k=1-Math.exp(-14*dt);this.swX+=(clamp(-s.mdx*.0011,-.045,.045)-this.swX)*k;this.swY+=(clamp(s.mdy*.0011,-.045,.045)-this.swY)*k; // look sway
    this.bobT+=s.speed*dt*2.1*(s.grounded?1:0);this.bobAmp+=((s.grounded?clamp(s.speed/5.7):0)-this.bobAmp)*(1-Math.exp(-10*dt));       // walk bob
    if(s.landImpact>0)this.land=clamp(s.landImpact/9);this.land*=Math.exp(-9*dt);this.air+=((s.grounded?0:1)-this.air)*(1-Math.exp(-6*dt));
    let tilt=0,rack=0;
    if(this.reloading){this.rt+=dt;const t=this.rt,p=(a,b)=>clamp((t-a)/(b-a));tilt=ease(p(0,.25))-ease(p(1.4,1.8));
      const out=ease(p(.25,.5));this.mag.visible=t<.5||t>.55;this.mag.position.y=t<.5?-out*.25:-.25*(1-ease(p(.55,.95)));
      rack=ease(p(1,1.15))-ease(p(1.2,1.4));
      if(t>=this.RELOAD){this.reloading=false;this.mag.visible=true;this.mag.position.y=0;const n=Math.min(this.MAG-this.ammo,this.reserve);this.ammo+=n;this.reserve-=n;}}
    const lock=this.ammo===0&&!(this.reloading&&this.rt>1);       // slide locks back on empty
    this.slide.position.z=.032*(lock?1:Math.max(ease(this.slideK),rack)); // blowback
    this.trigger.position.z=-.022+.004*this.slideK;
    const bx=Math.sin(this.bobT)*.006*this.bobAmp,by=-Math.abs(Math.cos(this.bobT))*.008*this.bobAmp;
    this.root.position.set(.12+bx+this.swX*.5-tilt*.03,-.135+by+this.swY*.5-this.land*.03+this.air*.008-tilt*.05,-.3+this.kick*.025);
    this.root.rotation.set(this.kick*.14+this.swY*1.1-tilt*.3,-this.swX*1.4,this.swX*.8+tilt*.5+Math.cos(this.bobT*.5)*.012*this.bobAmp);
    this.flash.visible=this.flashT>0;this.light.intensity=this.flashT>0?.12*this.flashT/.045:0;
  }
}
