# Calibración (1/2): ajuste afín lon/lat -> viewBox por ICP contra los ríos ya trazados en el SVG.
# Uso (desde la raíz): python3 scripts/tools/rivers-calib.py && python3 scripts/tools/rivers-calib2.py
import re, json, math, sys
import os
SC=os.environ.get('TMPDIR','/tmp').rstrip('/')+'/'  # intermedios
s=open('data-sources/spain-rios.source.svg').read()
def parse(d):
    toks=re.findall(r'[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?',d); pts=[]; i=0; x=y=0; cmd=None
    while i<len(toks):
        t=toks[i]
        if t.isalpha(): cmd=t; i+=1; continue
        n={'M':2,'m':2,'L':2,'l':2,'C':6,'c':6,'S':4,'s':4,'H':1,'h':1,'V':1,'v':1,'Z':0,'z':0}[cmd]
        a=[float(v) for v in toks[i:i+n]]; i+=n
        if cmd in 'ML': x,y=a[0],a[1]
        elif cmd in 'ml': x+=a[0];y+=a[1]
        elif cmd=='C': x,y=a[4],a[5]
        elif cmd=='c': x+=a[4];y+=a[5]
        elif cmd=='S': x,y=a[2],a[3]
        elif cmd=='s': x+=a[2];y+=a[3]
        elif cmd=='H': x=a[0]
        elif cmd=='h': x+=a[0]
        elif cmd=='V': y=a[0]
        elif cmd=='v': y+=a[0]
        pts.append((x,y))
        if cmd=='m': cmd='l'
        if cmd=='M': cmd='L'
    return pts
svg={}
for m in re.finditer(r'<path id="(rio-[a-z0-9-]+)"[^>]*?data-river="([^"]+)"[^>]*? d="([^"]*)"',s):
    svg.setdefault(m.group(2),[]).extend(parse(m.group(3)))
names={'rio-mino':'Miño','rio-sil':'Sil','rio-duero':'Duero','rio-esla':'Esla','rio-pisuerga':'Pisuerga','rio-tormes':'Tormes','rio-tajo':'Tajo','rio-guadiana':'Guadiana','rio-guadalquivir':'Guadalquivir','rio-genil':'Genil','rio-segura':'Segura','rio-jucar':'Júcar','rio-turia':'Turia','rio-ebro':'Ebro','rio-jalon':'Jalón','rio-segre':'Segre'}
osm=json.load(open('data-sources/osm/rios-lagos-nominatim.json'))
def lines(g):
    t=g['type'];c=g['coordinates']; return [c] if t=='LineString' else c
def dens(ls,step=0.01):
    out=[]
    for l in ls:
        for (a,b),(c,d) in zip(l,l[1:]):
            n=max(1,int(math.hypot(c-a,d-b)/step))
            for k in range(n): out.append((a+(c-a)*k/n,b+(d-b)*k/n))
        out.append(tuple(l[-1]))
    return out
geo={k:dens(lines(osm[v][0]['geojson'])) for k,v in names.items()}
def merc(lat): return math.degrees(math.log(math.tan(math.pi/4+math.radians(lat)/2)))
def solve(A,b):  # least squares via normal equations, 3 unknowns
    M=[[sum(r[i]*r[j] for r in A) for j in range(3)] for i in range(3)]; v=[sum(r[i]*bb for r,bb in zip(A,b)) for i in range(3)]
    # gaussian
    for i in range(3):
        p=max(range(i,3),key=lambda r:abs(M[r][i])); M[i],M[p]=M[p],M[i]; v[i],v[p]=v[p],v[i]
        for r in range(3):
            if r!=i:
                f=M[r][i]/M[i][i]; M[r]=[a-f*c for a,c in zip(M[r],M[i])]; v[r]-=f*v[i]
    return [v[i]/M[i][i] for i in range(3)]
def run(proj,label):
    G={k:[(lo,proj(la)) for lo,la in v] for k,v in geo.items()}
    allg=[p for v in G.values() for p in v]; alls=[p for v in svg.values() for p in v if True]
    alls=[p for k,v in svg.items() if k in G for p in v]
    gx=[p[0] for p in allg]; gy=[p[1] for p in allg]; sx=[p[0] for p in alls]; sy=[p[1] for p in alls]
    a=(max(sx)-min(sx))/(max(gx)-min(gx)); e=-(max(sy)-min(sy))/(max(gy)-min(gy))
    T=[a,0,min(sx)-a*min(gx), 0,e,min(sy)-e*max(gy)]
    for it in range(30):
        A=[];bx=[];by=[];res=[]
        for k,pts in svg.items():
            if k not in G: continue
            P=[(T[0]*x+T[1]*y+T[2],T[3]*x+T[4]*y+T[5],x,y) for x,y in G[k]]
            for (px,py) in pts:
                best=min(P,key=lambda q:(q[0]-px)**2+(q[1]-py)**2)
                d=math.hypot(best[0]-px,best[1]-py); res.append((d,k))
                A.append((best[2],best[3],1)); bx.append(px); by.append(py)
        T=solve(A,bx)+solve(A,by)
    ds=sorted(r[0] for r in res); rms=math.sqrt(sum(d*d for d in ds)/len(ds))
    print(label,'rms',round(rms,2),'p50',round(ds[len(ds)//2],2),'p95',round(ds[int(len(ds)*.95)],2),'T',[round(t,4) for t in T])
    per={}
    for d,k in res: per.setdefault(k,[]).append(d)
    print('  ',{k:round(sum(v)/len(v),1) for k,v in per.items()})
    return T,rms
r1=run(lambda la:la,'equirect')
r2=run(merc,'mercator')
json.dump({'equirect':r1,'mercator':r2},open(SC+'calib.json','w'))
