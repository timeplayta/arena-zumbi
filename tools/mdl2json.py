import struct,sys,json,math
D=sys.argv[1]
M=open(D+'/h.mdl','rb').read(); V=open(D+'/h.vvd','rb').read(); X=open(D+'/h.vtx','rb').read()
u=lambda b,f,o: struct.unpack_from(f,b,o)
# ---------- VVD ----------
idv,ver,ck,nlod=u(V,'4siii',0); nlv=u(V,'8i',16); nfix,fixs,vstart,tstart=u(V,'4i',48)
nv=nlv[0]
raw=[]
for i in range(u(V,'i',20)[0] if False else nv):
    pass
def vert(i):
    o=vstart+i*48
    w=u(V,'3f',o); b=u(V,'3B',o+12); nb=V[o+15]
    p=u(V,'3f',o+16); n=u(V,'3f',o+28); t=u(V,'2f',o+40)
    return w,b,nb,p,n,t
verts=[]
if nfix:
    for k in range(nfix):
        lod,src,cnt=u(V,'3i',fixs+12*k)
        if lod>=0:
            for j in range(cnt): verts.append(vert(src+j))
else:
    verts=[vert(i) for i in range(nv)]
print('verts',len(verts),'fixups',nfix,file=sys.stderr)
# ---------- MDL: bodyparts/models/meshes ----------
nbp,bpi=u(M,'ii',232)
meshes=[]   # (material, vbase)
for b in range(nbp):
    bo=bpi+16*b; nmodels,base,mi=u(M,'iii',bo+4)
    for m in range(nmodels):
        mo=bo+mi+148*m; nmesh,meshi,nverts,vidx=u(M,'iiii',mo+72)
        for k in range(nmesh):
            so=mo+meshi+116*k; mat,_,mnv,voff=u(M,'iiii',so)
            meshes.append((b,m,k,mat,vidx//48+voff))
print('meshes',meshes,file=sys.stderr)
# ---------- VTX ----------
xver,vcs,mbs,mbt,mbv,xck,xnlod,mro,xnbp,xbpo=u(X,'iiHHiiiiii',0)
mdlver=u(M,'i',4)[0]
sgsize=33 if mdlver>=49 else 25
tris={}
mi_=0
for b in range(xnbp):
    bo=xbpo+8*b; nmo,moo=u(X,'ii',bo)
    for m in range(nmo):
        mo=bo+moo+8*m; nl,lo=u(X,'ii',mo)
        lo=mo+lo   # LOD 0
        nme,meo,sw=u(X,'iif',lo)
        for k in range(nme):
            me=lo+meo+9*k; nsg,sgo=u(X,'ii',me)
            mat,vbase=[(q[3],q[4]) for q in meshes if q[0]==b and q[1]==m and q[2]==k][0]
            for g in range(nsg):
                so=me+sgo+sgsize*g
                nvt,vto,nidx,ido,nst,sto=u(X,'6i',so)
                vlist=[u(X,'H',so+vto+9*j+4)[0] for j in range(nvt)]
                idx=[u(X,'H',so+ido+2*j)[0] for j in range(nidx)]
                L=tris.setdefault(mat,[])
                for j in range(0,nidx,3):
                    a,b2,c=[vbase+vlist[idx[j+t]] for t in range(3)]
                    L.append((a,c,b2))     # inverte a ordem (Source = horário)
for k in tris: print('mat',k,'tris',len(tris[k]),file=sys.stderr)
# ---------- ossos ----------
nb,bi=u(M,'ii',156)
bones=[]
for i in range(nb):
    o=bi+216*i
    par=u(M,'i',o+4)[0]; pos=u(M,'3f',o+32); q=u(M,'4f',o+44); rot=u(M,'3f',o+60); ps=u(M,'3f',o+72); rs=u(M,'3f',o+84)
    bones.append(dict(par=par,pos=pos,q=q,rot=rot,ps=ps,rs=rs))
# ---------- animações ----------
def half(h): return struct.unpack('<e',struct.pack('<H',h))[0]
def q48(o):
    x,y,zw=u(M,'HHH',o); z=zw&0x7FFF; neg=zw>>15
    x=(x-32768)/32768.0; y=(y-32768)/32768.0; z=(z-16384)/16384.0
    w=math.sqrt(max(0,1-x*x-y*y-z*z)); return (x,y,z,-w if neg else w)
def q64(o):
    v=int.from_bytes(M[o:o+8],'little')
    x=(v&0x1FFFFF); y=(v>>21)&0x1FFFFF; z=(v>>42)&0x1FFFFF; neg=v>>63
    x=(x-1048576)/1048576.5; y=(y-1048576)/1048576.5; z=(z-1048576)/1048576.5
    w=math.sqrt(max(0,1-x*x-y*y-z*z)); return (x,y,z,-w if neg else w)
def animval(o,frame):
    k=frame
    while True:
        valid,total=M[o],M[o+1]
        if total==0: return 0
        if total<=k: k-=total; o+=2*(valid+1); continue
        break
    if valid>k: return u(M,'h',o+2*(k+1))[0]
    return u(M,'h',o+2*valid)[0]
def e2q(x,y,z):
    sr,cr=math.sin(x/2),math.cos(x/2); sp,cp=math.sin(y/2),math.cos(y/2); sy,cy=math.sin(z/2),math.cos(z/2)
    return (sr*cp*cy-cr*sp*sy, cr*sp*cy+sr*cp*sy, cr*cp*sy-sr*sp*cy, cr*cp*cy+sr*sp*sy)
na,ai=u(M,'ii',180)
ns,si=u(M,'ii',188)
def seq_anim(name):
    for i in range(ns):
        o=si+212*i; lab=u(M,'i',o+4)[0]; nm=M[o+lab:o+lab+40].split(b'\0')[0].decode()
        if nm==name:
            aii=u(M,'i',o+60)[0]; return u(M,'h',o+aii)[0]
def decode(aidx):
    o=ai+100*aidx
    fps,flags,nfr=u(M,'fii',o+8); ablock,aind=u(M,'ii',o+52); secidx,secfr=u(M,'ii',o+80)
    assert ablock==0, 'animblock externo'
    frames=[]
    for f in range(nfr):
        if secfr:
            sec=f//secfr; sb,so_=u(M,'ii',o+secidx+8*sec); pa=o+so_; fr=f-sec*secfr
        else: pa=o+aind; fr=f
        pose=[[b['pos'],b['q']] for b in bones]
        p=pa
        while True:
            bone,fl,nxt=M[p],M[p+1],u(M,'h',p+2)[0]; d=p+4; B=bones[bone]
            q=B['q']; pos=B['pos']
            if fl&0x02: q=q48(d)
            elif fl&0x20: q=q64(d)
            elif fl&0x08:
                e=[]
                for j in range(3):
                    off=u(M,'h',d+2*j)[0]
                    e.append((animval(d+off,fr)*B['rs'][j] if off else 0)+ (0 if fl&0x10 else B['rot'][j]))
                q=e2q(*e)
            if fl&0x01:
                pp=d+(6 if fl&0x02 else 0)+(8 if fl&0x20 else 0); pos=tuple(half(h) for h in u(M,'3H',pp))
            elif fl&0x04:
                pv=d+(6 if fl&0x08 else 0); pos=[]
                for j in range(3):
                    off=u(M,'h',pv+2*j)[0]
                    pos.append((animval(pv+off,fr)*B['ps'][j] if off else 0)+(0 if fl&0x10 else B['pos'][j]))
            pose[bone]=[tuple(pos),tuple(q)]
            if nxt==0: break
            p+=nxt
        frames.append(pose)
    return fps,frames
anims={}
for nm in ['idle1','light_miss1','light_miss2','draw']:
    a=seq_anim(nm); fps,fr=decode(a); anims[nm]={'fps':round(fps,2),'f':[[round(v,4) for b in pose for v in (*b[0],*b[1])] for pose in fr]}
    print('anim',nm,'idx',a,'frames',len(fr),'fps',fps,file=sys.stderr)
r=lambda v,n: round(v,n)
out={'pos':[r(c,3) for v in verts for c in v[3]],'nrm':[r(c,3) for v in verts for c in v[4]],'uv':[r(c,4) for v in verts for c in v[5]],
 'si':[v[1][j] if j<v[2] else 0 for v in verts for j in range(3)],'sw':[r(v[0][j],3) if j<v[2] else 0 for v in verts for j in range(3)],
 'groups':{str(k):[i for t in tris[k] for i in t] for k in tris},
 'bones':[[b['par'],*[r(x,4) for x in b['pos']],*[r(x,5) for x in b['q']]] for b in bones],'anims':anims}
json.dump(out,open(sys.argv[2],'w'),separators=(',',':'))
