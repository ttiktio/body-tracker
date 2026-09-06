# Human reference model

`human.json` is derived from the MakeHuman Community base mesh, explicitly released under CC0 in September 2020. The original OBJ header names Data Collection AB, Joel Palmius, and Jonas Hauquier as copyright holders at release.

- Source: https://github.com/makehumancommunity/makehuman/blob/master/makehuman/data/3dobjs/base.obj
- Asset license: https://static.makehumancommunity.org/about/license.html
- CC0: https://creativecommons.org/publicdomain/zero/1.0/

Only the body and eye surface groups are retained. Helper cages, teeth, joint markers, and other helper geometry are removed. Quads are triangulated, positions are converted to meters, and the model is grounded. Runtime materials add modest fitted shorts. This is a reference mannequin for locating measurement landmarks, not a scan or a prediction of the user's physique.

To reproduce, download `base.obj` from the source above and run `python tools/prepare-model.py /path/to/base.obj`.

# Three.js

`vendor/three.module.js` and `vendor/OrbitControls.js` are Three.js 0.170.0, distributed under MIT; see `vendor/three-LICENSE.txt`. OrbitControls' module import points to the local vendored module. All required assets are served from this repository and cached by the service worker; no runtime CDN or third-party analytics requests are added.
