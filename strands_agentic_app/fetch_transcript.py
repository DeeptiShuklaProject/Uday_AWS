import sys, json
from youtube_transcript_api import YouTubeTranscriptApi

VID = "atWXM5lziY8"
api = YouTubeTranscriptApi()
tl = api.list(VID)
for t in tl:
    print("AVAILABLE:", t.language_code, t.language, "generated=" + str(t.is_generated))

# prefer manual English, fall back to generated
try:
    tr = tl.find_manually_created_transcript(["en"])
except Exception:
    tr = tl.find_transcript(["en", "en-US", "en-GB"])
print("USING:", tr.language_code, "generated=" + str(tr.is_generated))
data = tr.fetch()
out = []
for s in data:
    m, sec = divmod(s.start, 60)
    h, m = divmod(int(m), 60)
    ts = f"{h:02d}:{m:02d}:{sec:05.2f}" if h else f"{m:02d}:{sec:05.2f}"
    out.append(f"[{ts}] {s.text}")
open(r"C:\Users\nishu\workspace\AWS_REACT_DEVIN\strands_agentic_app\agentcore_gateway_transcript.txt", "w", encoding="utf-8").write("\n".join(out))
print("SEGMENTS:", len(out))
