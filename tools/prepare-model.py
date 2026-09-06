"""Convert the CC0 MakeHuman base.obj into the compact, helper-free guide mesh.
Usage: python tools/prepare-model.py /path/to/base.obj
Source: https://github.com/makehumancommunity/makehuman/blob/master/makehuman/data/3dobjs/base.obj
"""
import sys, json
from pathlib import Path
vertices=[]; groups={}; group=''
for line in Path(sys.argv[1]).read_text().splitlines():
    if line.startswith('v '): vertices.append([float(x) for x in line.split()[1:4]])
    elif line.startswith('g '): group=line.split()[1]
    elif line.startswith('f '):
        groups.setdefault(group,[]).append([int(x.split('/')[0])-1 for x in line.split()[1:]])
body_indices={i for f in groups['body'] for i in f}
y0=min(vertices[i][1] for i in body_indices)
meshes=[]
for name in ['body','helper-l-eye','helper-r-eye']:
    faces=groups[name]; used=sorted({i for f in faces for i in f}); remap={v:i for i,v in enumerate(used)}
    pos=[];indices=[]
    for i in used:
        x,y,z=vertices[i]; pos.extend([round(x*.1,5),round((y-y0)*.1,5),round(z*.1,5)])
    for f in faces:
        for j in range(1,len(f)-1):indices.extend([remap[f[0]],remap[f[j]],remap[f[j+1]]])
    meshes.append(dict(name=name,positions=pos,indices=indices))
result={'source':'MakeHuman Community base mesh (CC0)','height':round((max(vertices[i][1] for i in body_indices)-y0)*.1,5),'meshes':meshes}
out=Path(__file__).resolve().parents[1]/'assets'/'human.json';out.write_text(json.dumps(result,separators=(',',':')))
print(out.name, out.stat().st_size, [(m['name'],len(m['positions'])//3) for m in meshes])
