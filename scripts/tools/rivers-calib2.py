# Calibración (2/2): ajuste robusto cuadrático; escribe data-sources/osm/calibracion-proyeccion.json
exec(open(__file__.replace('rivers-calib2.py','rivers-calib.py')).read().split('r1=run')[0])
def solveN(A,b):
    n=len(A[0]); M=[[sum(r[i]*r[j] for r in A) for j in range(n)] for i in range(n)]; v=[sum(r[i]*bb for r,bb in zip(A,b)) for i in range(n)]
    for i in range(n):
        p=max(range(i,n),key=lambda r:abs(M[r][i])); M[i],M[p]=M[p],M[i]; v[i],v[p]=v[p],v[i]
        for r in range(n):
            if r!=i:
                f=M[r][i]/M[i][i]; M[r]=[a-f*c for a,c in zip(M[r],M[i])]; v[r]-=f*v[i]
    return [v[i]/M[i][i] for i in range(n)]
LO,LA=-3.7,40.0
def feat(x,y):
    u,w=x-LO,y-LA; return (1,u,w,u*u,u*w,w*w)
def apply(C,x,y):
    f=feat(x,y); return sum(a*b for a,b in zip(C[0],f)), sum(a*b for a,b in zip(C[1],f))
T=json.load(open(SC+'calib.json'))['equirect'][0]
C=[[T[0]*LO+T[1]*LA+T[2],T[0],T[1],0,0,0],[T[3]*LO+T[4]*LA+T[5],T[3],T[4],0,0,0]]
fitset={'rio-pisuerga','rio-tajo','rio-esla','rio-ebro','rio-segre','rio-jalon','rio-sil','rio-tormes','rio-duero','rio-mino','rio-jucar','rio-segura','rio-guadalquivir'}
for it in range(12):
    A=[];bx=[];by=[];res=[]
    for k,pts in svg.items():
        if k not in geo: continue
        P=[(*apply(C,x,y),x,y) for x,y in geo[k]]
        for (px,py) in pts:
            b=min(P,key=lambda q:(q[0]-px)**2+(q[1]-py)**2); d=math.hypot(b[0]-px,b[1]-py); res.append((d,k))
            if k in fitset and d<4: A.append(feat(b[2],b[3])); bx.append(px); by.append(py)
    C=[solveN(A,bx),solveN(A,by)]
per={}
for d,k in res: per.setdefault(k,[]).append(d)
for k,v in sorted(per.items(),key=lambda kv:sum(kv[1])/len(kv[1])):
    v=sorted(v); print(f"{k:18} media {sum(v)/len(v):5.1f}  p50 {v[len(v)//2]:5.1f}  max {v[-1]:6.1f}  {'(ajuste)' if k in fitset else '(validación)'}")
json.dump({'origin':[LO,LA],'C':C},open('data-sources/osm/calibracion-proyeccion.json','w'))
