"""Extract key screenshots from a video via scene-change detection.

Samples every SAMPLE_SEC seconds, detects large frame differences
(slide/code/screen changes), and saves a settled frame ~SETTLE_SEC
after each change. Output: frames/NNNN_tMMSS.png
"""
import cv2, os, sys

VID = 'strands_agentic_app/strands_video.mp4'
OUT = 'strands_agentic_app/frames'
SAMPLE_SEC = 2.0
SETTLE_SEC = 2.5
DIFF_THRESH = 12.0      # mean abs diff on downscaled gray (0-255)
MIN_GAP_SEC = 10.0      # min time between kept scenes

os.makedirs(OUT, exist_ok=True)
cap = cv2.VideoCapture(VID)
fps = cap.get(cv2.CAP_PROP_FPS) or 30
total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
dur = total / fps
print(f'fps={fps:.2f} frames={total} dur={dur/60:.1f}min')

def grab(t):
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
    ok, f = cap.read()
    if not ok: return None
    return cv2.resize(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY), (320, 180))

prev = None
boundaries = []
t = 0.0
while t < dur:
    g = grab(t)
    if g is None: break
    if prev is not None:
        d = cv2.absdiff(g, prev).mean()
        if d > DIFF_THRESH:
            boundaries.append(t)
    prev = g
    t += SAMPLE_SEC
print('raw boundaries:', len(boundaries))

# Merge boundaries closer than MIN_GAP (keep first of each cluster)
merged = []
for b in boundaries:
    if not merged or b - merged[-1] >= MIN_GAP_SEC:
        merged.append(b)

saved = []
for i, b in enumerate(merged):
    t = min(b + SETTLE_SEC, dur - 0.5)
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
    ok, f = cap.read()
    if not ok: continue
    mm, ss = int(t // 60), int(t % 60)
    name = f'{i+1:02d}_t{mm:02d}m{ss:02d}s.png'
    cv2.imwrite(os.path.join(OUT, name), f)
    saved.append(name)

cap.release()
print('saved', len(saved), 'frames to', OUT)
for s in saved: print(' ', s)
