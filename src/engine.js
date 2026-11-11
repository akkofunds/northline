import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

export function createRenderer(canvas){
  const r=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',stencil:false});
  r.setPixelRatio(Math.min(devicePixelRatio,1.5));r.setSize(innerWidth,innerHeight);
  r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap;
  r.shadowMap.autoUpdate=false;           // static map: shadows rendered ONCE (needsUpdate) -> huge FPS win
  r.toneMapping=THREE.ACESFilmicToneMapping;r.autoClear=false;return r;}
export function envMap(renderer){const p=new THREE.PMREMGenerator(renderer);const t=p.fromScene(new RoomEnvironment(),.04).texture;p.dispose();return t;}

// Merges static geometry per (material, 24m grid cell) -> few draw calls AND real frustum culling per chunk.
export class Batcher{
  constructor(cell=24){this.cell=cell;this.b=new Map();}
  add(geo,mat,x,z){const k=mat.uuid+'|'+Math.floor(x/this.cell)+'|'+Math.floor(z/this.cell);let e=this.b.get(k);
    if(!e)this.b.set(k,e={mat,geos:[]});e.geos.push(geo.index?geo.toNonIndexed():geo);}
  build(scene,solids){for(const{mat,geos}of this.b.values()){const m=new THREE.Mesh(mergeGeometries(geos),mat);
    geos.forEach(g=>g.dispose());m.castShadow=m.receiveShadow=true;scene.add(m);solids.push(m);}this.b.clear();}}
export function uvScale(g,su,sv=su){const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*su,uv.getY(i)*sv);}
// Box with base at y, UVs in world metres (no texture stretching)
export function boxGeo(w,h,d,x,y,z,tile=3){const g=new THREE.BoxGeometry(w,h,d),uv=g.attributes.uv;
  const D=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
  for(let i=0;i<24;i++){const f=i>>2;uv.setXY(i,uv.getX(i)*D[f][0]/tile,uv.getY(i)*D[f][1]/tile);}
  return g.translate(x,y+h/2,z);}

export function addSky(scene){const g=new THREE.SphereGeometry(350,24,12),p=g.attributes.position,c=[];
  const top=new THREE.Color(0x4f8fd8),hor=new THREE.Color(0xcfe3f2),t=new THREE.Color();
  for(let i=0;i<p.count;i++){t.copy(hor).lerp(top,Math.pow(Math.max(0,p.getY(i)/350),.6));c.push(t.r,t.g,t.b);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false}));
  m.frustumCulled=false;m.renderOrder=-1;scene.add(m);scene.fog=new THREE.Fog(0xcfe3f2,80,240);}
export function addSun(scene,hx,hz){const dir=new THREE.Vector3(-.5,.8,.35).normalize();
  const s=new THREE.DirectionalLight(0xfff0d6,3.4);s.position.copy(dir).multiplyScalar(80);s.castShadow=true;
  s.shadow.mapSize.set(4096,4096);const c=s.shadow.camera,R=Math.hypot(hx,hz)*1.05;
  c.left=-R;c.right=R;c.top=R;c.bottom=-R;c.near=10;c.far=200;s.shadow.bias=-.0003;s.shadow.normalBias=.05;
  scene.add(s,s.target,new THREE.HemisphereLight(0xbcd7ff,0x7a6e60,.55));return dir;}
