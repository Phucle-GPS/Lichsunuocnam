"""
Dựng cảnh 3D chân thực TRẬN BẠCH ĐẰNG 1288 bằng Blender (Cycles).
Chạy trên máy có Blender 4.2+ (khuyến nghị có card đồ họa):

  blender -b -P tools/blender/bach_dang_1288.py -- --shot 2 --out bachdang_shot2.png
  blender -b -P tools/blender/bach_dang_1288.py -- --shot 2 --anim --frames 120 --out //clip_   (xuất chuỗi ảnh 5 giây)

Tùy chọn:
  --shot 1|2|3   1 = toàn cảnh cửa sông lúc bình minh, 2 = thuyền giặc mắc cọc bốc cháy (góc thấp),
                 3 = phục binh trên bờ nhìn xuống bãi cọc
  --res 1920x1080   độ phân giải      --samples 64   số mẫu Cycles      --gpu   dùng GPU
  --anim  --frames N  xuất hoạt cảnh (sóng, lửa, máy quay chuyển động)
Mở file này trong Blender (tab Scripting → Run Script) cũng được: cảnh sẽ được dựng sẵn để chỉnh tay.
"""
import bpy, bmesh, math, random, sys, argparse
from mathutils import Vector, Euler

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument('--shot', type=int, default=2)
ap.add_argument('--res', default='1920x1080')
ap.add_argument('--samples', type=int, default=64)
ap.add_argument('--out', default='')
ap.add_argument('--gpu', action='store_true')
ap.add_argument('--anim', action='store_true')
ap.add_argument('--frames', type=int, default=120)
A = ap.parse_args(argv)
R = random.Random(1288)

# ---------------------------------------------------------------- dọn cảnh
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
W, H = map(int, A.res.split('x'))
sc.render.engine = 'CYCLES'
sc.cycles.samples = A.samples
sc.cycles.use_denoising = True
sc.cycles.max_bounces = 6
sc.render.resolution_x, sc.render.resolution_y = W, H
sc.render.fps = 24
sc.frame_start, sc.frame_end = 1, A.frames
sc.view_settings.view_transform = 'AgX' if 'AgX' in [i.identifier for i in sc.view_settings.bl_rna.properties['view_transform'].enum_items] else 'Filmic'
try: sc.view_settings.look = 'AgX - Medium High Contrast'
except Exception: pass
if A.gpu:
    try:
        prefs = bpy.context.preferences.addons['cycles'].preferences
        for t in ('OPTIX', 'CUDA', 'HIP', 'METAL', 'ONEAPI'):
            try: prefs.compute_device_type = t; break
            except Exception: pass
        prefs.get_devices(); [setattr(d, 'use', True) for d in prefs.devices]
        sc.cycles.device = 'GPU'
    except Exception as e: print('GPU không dùng được:', e)

def mat(name, color, rough=.8, metal=0, emit=None, strength=0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit:
        k = 'Emission Color' if 'Emission Color' in b.inputs else 'Emission'
        b.inputs[k].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = strength
    return m

def link(o):
    bpy.context.collection.objects.link(o); return o

# ---------------------------------------------------------------- bầu trời & sương
world = bpy.data.worlds.new('Troi'); sc.world = world; world.use_nodes = True
nt = world.node_tree; nt.nodes.clear()
sky = nt.nodes.new('ShaderNodeTexSky')
for t in ('MULTIPLE_SCATTERING', 'NISHITA', 'SINGLE_SCATTERING', 'HOSEK_WILKIE'):
    try: sky.sky_type = t; break
    except Exception: pass
for k, v in (('sun_elevation', math.radians(6 if A.shot != 2 else 4)), ('sun_rotation', math.radians(95)), ('altitude', 30), ('air_density', 1.4), ('dust_density', 4.0)):
    try: setattr(sky, k, v)
    except Exception: pass
bg = nt.nodes.new('ShaderNodeBackground'); bg.inputs['Strength'].default_value = .55
out = nt.nodes.new('ShaderNodeOutputWorld')
nt.links.new(sky.outputs[0], bg.inputs[0]); nt.links.new(bg.outputs[0], out.inputs['Surface'])
# sương trên sông: khối thể tích mỏng
bpy.ops.mesh.primitive_cube_add(size=1); fog = bpy.context.object; fog.name = 'Suong'
fog.scale = (900, 900, 60); fog.location = (0, 0, 25)
fm = bpy.data.materials.new('SuongMat'); fm.use_nodes = True; fnt = fm.node_tree; fnt.nodes.clear()
pv = fnt.nodes.new('ShaderNodeVolumePrincipled'); pv.inputs['Density'].default_value = .0011; pv.inputs['Color'].default_value = (1, .86, .72, 1); pv.inputs['Anisotropy'].default_value = .5
fo = fnt.nodes.new('ShaderNodeOutputMaterial'); fnt.links.new(pv.outputs[0], fo.inputs['Volume']); fog.data.materials.append(fm)
fog.visible_shadow = False

# mặt trời
sd = bpy.data.lights.new('MatTroi', 'SUN'); sd.energy = 3.2; sd.color = (1, .78, .55); sd.angle = math.radians(1.5)
sun = link(bpy.data.objects.new('MatTroi', sd)); sun.rotation_euler = Euler((math.radians(84), 0, math.radians(95 + 180)))

# ---------------------------------------------------------------- địa hình
def river_y(x): return 26 * math.sin(x / 120) + 6 * math.sin(x / 47)
def river_w(x): return 46 + max(0, x - 40) * .32
bpy.ops.mesh.primitive_grid_add(x_subdivisions=360, y_subdivisions=300, size=1)
land = bpy.context.object; land.name = 'DiaHinh'; land.scale = (900, 760, 1)
bpy.ops.object.transform_apply(scale=True)
peaks = [(R.uniform(-420, 420), 0, R.uniform(40, 110), R.uniform(16, 34)) for _ in range(80)]
peaks = [(x, river_y(x) + R.choice((-1, 1)) * (river_w(x) + R.uniform(55, 300)), h, r) for x, _, h, r in peaks]
for v in land.data.vertices:
    x, y = v.co.x, v.co.y
    d, w = abs(y - river_y(x)), river_w(x)
    z = -7 + (d / w) ** 2 * 5.5 if d < w else -1.5 + min(1, (d - w) / 40) * 6 + math.sin(x * .021 + math.sin(y * .017) * 2) * 2
    if x > 230: z = min(z, -7)
    for px, py, ph, pr in peaks:
        dd = math.hypot(x - px, y - py)
        if dd < pr * 2.4: z += ph * math.exp(-(dd / pr) ** 2.2)
    v.co.z = z
bpy.ops.object.shade_smooth()
# vật liệu địa hình: cỏ ↔ đá theo độ dốc, bùn gần nước
lm = bpy.data.materials.new('DatDa'); lm.use_nodes = True; n = lm.node_tree.nodes; L = lm.node_tree.links
bsdf = n['Principled BSDF']; bsdf.inputs['Roughness'].default_value = .9
geo = n.new('ShaderNodeNewGeometry'); sep = n.new('ShaderNodeSeparateXYZ'); L.new(geo.outputs['Normal'], sep.inputs[0])
ramp = n.new('ShaderNodeValToRGB'); ramp.color_ramp.elements[0].position = .55; ramp.color_ramp.elements[0].color = (.32, .31, .28, 1); ramp.color_ramp.elements[1].position = .8; ramp.color_ramp.elements[1].color = (.16, .24, .08, 1)
noise = n.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value = 40
mix = n.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.inputs['Factor'].default_value = .25
L.new(sep.outputs['Z'], ramp.inputs[0]); L.new(ramp.outputs[0], mix.inputs[6]); L.new(noise.outputs['Color'], mix.inputs[7]); L.new(mix.outputs[2], bsdf.inputs['Base Color'])
bump = n.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = .4; L.new(noise.outputs['Fac'], bump.inputs['Height']); L.new(bump.outputs[0], bsdf.inputs['Normal'])
land.data.materials.append(lm)

# ---------------------------------------------------------------- mặt nước (Ocean)
LEVEL = -3.2 if A.shot != 1 else .4
bpy.ops.mesh.primitive_plane_add(size=1); water = bpy.context.object; water.name = 'MatNuoc'
water.location = (0, 0, LEVEL)
oc = water.modifiers.new('Song', 'OCEAN'); oc.size = 3; oc.spatial_size = 120; oc.resolution = 10; oc.wave_scale = .3; oc.choppiness = 1.1; oc.wind_velocity = 6; oc.repeat_x = oc.repeat_y = 8
if A.anim:
    oc.time = 1; oc.keyframe_insert('time', frame=1); oc.time = 1 + A.frames / 24; oc.keyframe_insert('time', frame=A.frames)
wm = mat('Nuoc', (.03, .09, .1), rough=.22); b = wm.node_tree.nodes['Principled BSDF']; b.inputs['IOR'].default_value = 1.33
try: b.inputs['Transmission Weight'].default_value = .35
except Exception: pass
water.data.materials.append(wm)

# ---------------------------------------------------------------- bãi cọc
wood = mat('Go', (.09, .055, .03), .9); iron = mat('Sat', (.08, .08, .09), .45, metal=.8)
STAKES = []
for i in range(220):
    x = R.uniform(62, 92); yc = river_y(x); w = river_w(x) * .85; y = R.uniform(yc - w, yc + w)
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=R.uniform(.22, .32), depth=7.5); s = bpy.context.object
    s.rotation_euler = (R.uniform(-.15, .15), R.uniform(.3, .55), 0); s.location = (x, y, -6.5 + 3.4)
    s.data.materials.append(wood)
    bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=.34, depth=1.4); t = bpy.context.object
    d = Vector((0, 0, 4.4)); d.rotate(s.rotation_euler); t.location = s.location + d; t.rotation_euler = s.rotation_euler; t.data.materials.append(iron)
    STAKES.append((x, y))

# ---------------------------------------------------------------- thuyền chiến
hullM = {'dich': mat('VoThuyenNguyen', (.09, .06, .04), .7), 'ta': mat('VoThuyenTran', (.22, .1, .05), .7)}
sailM = {'dich': mat('BuomNguyen', (.55, .48, .38), .95), 'ta': mat('BuomTran', (.62, .45, .26), .95)}
flagM = {'dich': mat('CoNguyen', (.08, .22, .5), .8), 'ta': mat('CoTran', (.6, .04, .02), .8, emit=(.5, .03, .01), strength=.4)}
battenM = mat('Nan', (.05, .04, .03), .8)
def junk(side, loc, rot, scale=1.0, tilt=0):
    E = side == 'dich'; Lh, Hh, Wd = (16, 2.6, 5) if E else (9, 1.4, 2.6)
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        v.co.x *= Lh; v.co.y *= Wd; v.co.z *= Hh
        u = abs(v.co.x) / (Lh / 2); v.co.y *= 1 - u * u * .65
        if v.co.z < 0: v.co.y *= .55
        else: v.co.z += u ** 2.5 * Hh * .9
    me = bpy.data.meshes.new('vo'); bm.to_mesh(me); bm.free()
    hull = link(bpy.data.objects.new('Thuyen', me)); hull.data.materials.append(hullM[side])
    sub = hull.modifiers.new('min', 'SUBSURF'); sub.levels = 2; sub.render_levels = 2
    parts = [hull]
    for mx, mh in ((1.5, 13), (-2.5, 10)) if E else ((0, 7),):
        bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=.18, depth=mh); m = bpy.context.object; m.location = (mx, 0, 1.6 + mh / 2); m.data.materials.append(wood); parts.append(m)
        bpy.ops.mesh.primitive_plane_add(size=1); s = bpy.context.object; s.scale = (mh * .62, mh * .78, 1); s.rotation_euler = (math.radians(90), 0, math.radians(8)); s.location = (mx, .3, 2.4 + mh * .39)
        s.data.materials.append(sailM[side]); parts.append(s)
        for k in range(1, 6):
            bpy.ops.mesh.primitive_cube_add(size=1); bt = bpy.context.object; bt.scale = (mh * .63, .12, .12); bt.location = (mx, .36, 2.4 + mh * .78 * k / 6); bt.data.materials.append(battenM); parts.append(bt)
        bpy.ops.mesh.primitive_plane_add(size=1); f = bpy.context.object; f.scale = (2.4, 1.4, 1); f.rotation_euler = (math.radians(90), 0, 0); f.location = (mx + 1.3, 0, 1.6 + mh + .6); f.data.materials.append(flagM[side]); parts.append(f)
        if not E: break
    root = link(bpy.data.objects.new('ThuyenGoc', None))
    for p in parts: p.parent = root
    root.location = loc; root.rotation_euler = (tilt, tilt * .5, rot); root.scale = (scale,) * 3
    return root

FIRE = []
fireM = bpy.data.materials.new('Lua'); fireM.use_nodes = True; fn = fireM.node_tree.nodes; fn.clear()
em = fn.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (1, .38, .08, 1); em.inputs['Strength'].default_value = 9
fo2 = fn.new('ShaderNodeOutputMaterial'); fireM.node_tree.links.new(em.outputs[0], fo2.inputs['Surface'])
smokeM = bpy.data.materials.new('Khoi'); smokeM.use_nodes = True; sn = smokeM.node_tree.nodes; sn.clear()
sv = sn.new('ShaderNodeVolumePrincipled'); sv.inputs['Density'].default_value = .08; sv.inputs['Color'].default_value = (.08, .07, .07, 1)
try: sv.inputs['Blackbody Intensity'].default_value = 0
except Exception: pass
stx = sn.new('ShaderNodeTexNoise'); stx.inputs['Scale'].default_value = .35; stx.inputs['Detail'].default_value = 6
smul = sn.new('ShaderNodeMath'); smul.operation = 'MULTIPLY'; smul.inputs[1].default_value = .35
so = sn.new('ShaderNodeOutputMaterial'); smokeM.node_tree.links.new(stx.outputs['Fac'], smul.inputs[0]); smokeM.node_tree.links.new(smul.outputs[0], sv.inputs['Density']); smokeM.node_tree.links.new(sv.outputs[0], so.inputs['Volume'])
def burn(loc, size=1.0):
    for k in range(9):
        bpy.ops.mesh.primitive_cone_add(vertices=10, radius1=R.uniform(.5, 1.1) * size, depth=R.uniform(2.5, 5.5) * size); f = bpy.context.object
        f.location = (loc[0] + R.uniform(-5, 5), loc[1] + R.uniform(-1.6, 1.6), loc[2] + 2.6 + R.uniform(0, 1.5)); f.rotation_euler = (R.uniform(-.2, .2), R.uniform(-.2, .2), 0)
        f.data.materials.append(fireM); f.visible_shadow = False; FIRE.append(f)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=4 * size); s = bpy.context.object; s.scale = (1, 1, 3.6); s.location = (loc[0] + 6, loc[1], loc[2] + 26); s.data.materials.append(smokeM)
    s.visible_shadow = False
    pl = bpy.data.lights.new('LuaSang', 'POINT'); pl.energy = 9000 * size; pl.color = (1, .45, .15); pl.shadow_soft_size = 2
    o = link(bpy.data.objects.new('LuaSang', pl)); o.location = (loc[0], loc[1], loc[2] + 6)

# hạm đội Nguyên mắc cọc (shot 2,3) hoặc đang xuôi dòng (shot 1)
for i in range(22):
    if A.shot == 1: x = -40 - (i % 6) * 32 - (i // 6) * 10 + R.uniform(-6, 6)
    else: x = 58 + R.uniform(0, 26)
    y = river_y(x) + ((i // 6) - 1.5) * 16 + R.uniform(-4, 4)
    tilt = 0 if A.shot == 1 else R.uniform(-.22, .22)
    junk('dich', (x, y, LEVEL - (0 if A.shot == 1 else R.uniform(.3, 1.4))), math.atan2(river_y(x + 1) - river_y(x), 1) + R.uniform(-.25, .25), 1.35 if i == 0 else 1, tilt)
    if A.shot != 1 and i % 2 == 0: burn((x, y, LEVEL), R.uniform(.8, 1.2))
for i in range(14):
    x = (-160 if A.shot == 1 else 20) - (i % 5) * 14 + R.uniform(-4, 4); y = river_y(x) + ((i // 5) - 1) * 11 + R.uniform(-3, 3)
    junk('ta', (x, y, LEVEL), math.atan2(river_y(x + 1) - river_y(x), 1), 1)

# phục binh trên bờ (người lính giản lược: thân, đầu, nón lá, giáo)
soldierM = mat('AoLinh', (.42, .07, .04), .9); skinM = mat('Da', (.55, .36, .22), .7); hatM = mat('Non', (.7, .58, .33), .9)
for i in range(120 if A.shot == 3 else 40):
    side = 1 if i % 2 else -1; x = R.uniform(40, 120); y = river_y(x) + side * (river_w(x) + R.uniform(6, 30))
    # tìm độ cao mặt đất gần đúng
    z = -1.5 + min(1, (abs(y - river_y(x)) - river_w(x)) / 40) * 6
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=.45, depth=1.7); b1 = bpy.context.object; b1.location = (x, y, z + .85); b1.data.materials.append(soldierM)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=.3, segments=10, ring_count=8); b2 = bpy.context.object; b2.location = (x, y, z + 2); b2.data.materials.append(skinM)
    bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=.8, depth=.45); b3 = bpy.context.object; b3.location = (x, y, z + 2.3); b3.data.materials.append(hatM)
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=.05, depth=3.4); b4 = bpy.context.object; b4.location = (x + .5, y, z + 1.6); b4.rotation_euler = (0, .25, 0); b4.data.materials.append(wood)

# ---------------------------------------------------------------- máy quay
cd = bpy.data.cameras.new('MayQuay'); cd.lens = 32; cd.dof.use_dof = True; cd.dof.aperture_fstop = 5.6
cam = link(bpy.data.objects.new('MayQuay', cd)); sc.camera = cam
def look(c, target): c.rotation_euler = (Vector(target) - c.location).to_track_quat('-Z', 'Y').to_euler()
SHOTS = {1: ((-260, -40, 60), (120, 20, 8), 18), 2: ((112, river_y(112) + 26, 3.2), (66, river_y(66), 4), 24), 3: ((78, river_y(78) + river_w(78) + 30, 12), (68, river_y(68), 0), 28)}
p0, tgt, lens = SHOTS[A.shot]; cd.lens = lens; cam.location = p0; look(cam, tgt)
focus = link(bpy.data.objects.new('TieuDiem', None)); focus.location = tgt; cd.dof.focus_object = focus
if A.anim:
    cam.keyframe_insert('location', frame=1); cam.keyframe_insert('rotation_euler', frame=1)
    cam.location = Vector(p0) + (Vector(tgt) - Vector(p0)).normalized() * 14 + Vector((0, 0, 2)); look(cam, tgt)
    cam.keyframe_insert('location', frame=A.frames); cam.keyframe_insert('rotation_euler', frame=A.frames)

# ---------------------------------------------------------------- xuất
if A.out:
    sc.render.filepath = A.out
    if A.anim: sc.render.image_settings.file_format = 'PNG'; bpy.ops.render.render(animation=True)
    else: bpy.ops.render.render(write_still=True)
    print('Đã xuất:', A.out)
