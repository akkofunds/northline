import * as THREE from 'three';
import {Batcher,boxGeo,uvScale,addSky,addSun} from '../engine.js';

// Map 1: Industrial Shipping Yard (80 x 60 m). Spawns W/E, two raised platforms w/ ramps, warehouses, container mazes.
export function buildYard(scene,world,M){
  const HX=40,HZ=30;world.setBounds(HX,HZ);addSky(scene);const sunDir=addSun(scene,HX,HZ);
  const solids=[],B=new Batcher(24);
  const add=(w,h,d,x,y,z,mat,tile=3,col=true)=>{B.add(boxGeo(w,h,d,x,y,z,tile),mat,x,z);if(col)world.addBox(x-w/2,y,z-d/2,x+w/2,y+h,z+d/2);};

  const gg=new THREE.PlaneGeometry(HX*2+4,HZ*2+4).rotateX(-Math.PI/2);uvScale(gg,(HX*2+4)/4,(HZ*2+4)/4);
  const ground=new THREE.Mesh(gg,M.concrete);ground.receiveShadow=true;scene.add(ground);solids.push(ground);

  for(const[w,d,x,z]of[[HX*2+2,1,0,-HZ-.5],[HX*2+2,1,0,HZ+.5],[1,HZ*2,-HX-.5,0],[1,HZ*2,HX+.5,0]])add(w,6,d,x,0,z,M.concrete,3,false);
  add(12,5,8,-14,0,-18,M.metalGrey,1);add(12,5,8,14,0,18,M.metalGrey,1);                        // warehouses
  add(10,2.4,8,-24,0,14,M.concrete);add(10,2.4,8,24,0,-14,M.concrete);                           // raised platforms
  const ramp=(cx,cz,len,wid,h,dir)=>{const[dx,dz,ry]={px:[1,0,0],nx:[-1,0,Math.PI],pz:[0,1,-Math.PI/2],nz:[0,-1,Math.PI/2]}[dir];
    const s=new THREE.Shape();s.moveTo(0,0);s.lineTo(len,0);s.lineTo(len,h);
    const g=new THREE.ExtrudeGeometry(s,{depth:wid,bevelEnabled:false});uvScale(g,1/3);
    g.translate(-len/2,0,-wid/2).rotateY(ry).translate(cx,0,cz);B.add(g,M.concrete,cx,cz);world.addRamp(cx,cz,len,wid,h,dx,dz);};
  ramp(-16,14,6,4,2.4,'nx');ramp(16,-14,6,4,2.4,'px');                                         // ramps up to platforms
  add(8,1.3,1,0,0,-3,M.concrete);add(8,1.3,1,0,0,5,M.concrete);add(1,1.3,6,-9,0,1,M.concrete);add(1,1.3,6,9,0,-1,M.concrete); // head-glitch walls
  B.build(scene,solids);

  const inst=(geo,mat,list,fn)=>{const m=new THREE.InstancedMesh(geo,mat,list.length),o=new THREE.Object3D();
    list.forEach((it,i)=>{o.position.set(0,0,0);o.rotation.set(0,0,0);o.scale.set(1,1,1);fn(it,o,m,i);o.updateMatrix();m.setMatrixAt(i,o.matrix);});
    m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;m.computeBoundingSphere();
    m.castShadow=m.receiveShadow=true;scene.add(m);solids.push(m);};
  const cols=[0xb8452f,0x2f5f8f,0x3d7a4a,0xd09a2b,0x8a8a84,0xa84f2a].map(c=>new THREE.Color(c));
  // [x,z,rot90,level,colour]
  const C=[[-33,-20,1,0,0],[-33,-20,1,1,1],[-30,-8,0,0,2],[-8,10,0,0,3],[-8,10,0,1,0],[6,-12,1,0,1],[12,-5,0,0,4],[-4,-24,0,0,5],[20,-24,0,0,2],
    [30,8,0,0,3],[30,8,0,1,1],[33,22,1,0,0],[8,24,0,0,5],[-20,2,1,0,4],[22,0,1,0,2],[0,12,1,0,3],[-2,-14,1,0,0],[28,-4,0,0,1]];
  inst(boxGeo(6,2.6,2.4,0,-1.3,0,1),M.metal,C,(c,o,m,i)=>{o.position.set(c[0],c[3]*2.6+1.3,c[1]);o.rotation.y=c[2]?Math.PI/2:0;m.setColorAt(i,cols[c[4]]);
    const w=c[2]?2.4:6,d=c[2]?6:2.4;world.addBox(c[0]-w/2,c[3]*2.6,c[1]-d/2,c[0]+w/2,c[3]*2.6+2.6,c[1]+d/2);});
  const K=[[-26,-3,1.2,1.2],[-26,-4.3,1.2,1.2],[-25,-3.6,1,.9],[-2,-6,1.2,1.2],[2,7,1.2,1.2],[10,-10,1.2,1.2],[-10,12,1.2,1.2],[18,-18,1,1.2],
    [-18,20,1.2,1.2],[34,-12,1.2,1.2],[35,-13.3,1,.9],[-36,8,1.2,1.2],[-5,0,1,1.2],[6,2,1,.9]];
  inst(new THREE.BoxGeometry(1,1,1).translate(0,.5,0),M.wood,K,(k,o,m,i)=>{o.position.set(k[0],0,k[1]);o.scale.set(k[2],k[3],k[2]);o.rotation.y=i*.7;
    m.setColorAt(i,new THREE.Color().setScalar(.85+(i%3)*.1));const h=k[2]*.72;world.addBox(k[0]-h,0,k[1]-h,k[0]+h,k[3],k[1]+h);}); // rot-safe AABB
  const Bl=[[-24,-10],[-23.4,-10.8],[16,10],[16.7,10.6],[34,-2],[-6,26],[28,-26],[-34,12],[2,-8],[3,-8.6],[-12,-3],[26,14]];
  inst(new THREE.CylinderGeometry(.3,.3,.9,12).translate(0,.45,0),M.barrel,Bl,(b,o,m,i)=>{o.position.set(b[0],0,b[1]);
    m.setColorAt(i,cols[(i*2)%6]);world.addBox(b[0]-.3,0,b[1]-.3,b[0]+.3,.9,b[1]+.3);});
  return {name:'Shipping Yard',solids,sunDir,spawns:[[-36,0,0,-Math.PI/2],[-36,0,6,-Math.PI/2],[36,0,0,Math.PI/2],[36,0,-6,Math.PI/2]]};
}
