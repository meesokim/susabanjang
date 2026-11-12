#!/usr/bin/env python3
"""
Builds ~1-minute MIDI tracks, synthesized MP3 music tracks, ambient sound loops
(rain, street traffic), SFX, and legacy/js/songs.js for 수사반장 1970.

Tracks generated (~60-64s each):
  - intro  : 1970s MBC '수사반장 (Chief Inspector)' homage theme (64s, 120 BPM)
  - car    : Nocturnal 1970s noir patrol-car stakeout theme (60s, 100 BPM)
  - street : Rain-soaked Sogong-dong street investigation theme (60s, 108 BPM)
  - bank   : Tense Hanil Bank lobby hostage/investigation theme (60s, 104 BPM)
  - tense  : High-tension confrontation & arrest theme (60s, 128 BPM)
  - end    : Warm, bittersweet humanist closing theme (60s, 96 BPM)

Ambient loops & SFX generated:
  - rain.mp3        : Continuous monsoon rain & wet pavement patter (24s seamless loop)
  - traffic.mp3     : 1970s wet asphalt passing cars, engine hum & distant horn (24s seamless loop)
  - rain_indoor.mp3 : Muffled rain heard from inside the bank lobby (20s seamless loop)
  - click.mp3, pickup.mp3, shutter.mp3, whistle.mp3, cuffs.mp3
"""

import base64
import math
import os
import struct
import subprocess
import wave
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
MIDI_DIR = ROOT / "game" / "audio" / "midi"
MUSIC_DIR = ROOT / "game" / "audio" / "music"
SFX_DIR = ROOT / "game" / "audio" / "sfx"
LEGACY_ASSETS = ROOT / "legacy" / "assets"
LEGACY_SONGS_JS = ROOT / "legacy" / "js" / "songs.js"

for d in (MIDI_DIR, MUSIC_DIR, SFX_DIR, LEGACY_ASSETS):
    d.mkdir(parents=True, exist_ok=True)

SR = 44100
TPB = 480  # MIDI ticks per beat


# ============================================================================
# 1. Standard MIDI File (Format 1) Writer
# ============================================================================

def _vlq(n: int) -> bytes:
    n = max(0, int(round(n)))
    out = [n & 0x7F]
    n >>= 7
    while n > 0:
        out.append((n & 0x7F) | 0x80)
        n >>= 7
    out.reverse()
    return bytes(out)


def build_midi_bytes(bpm: int, tracks_spec: list[dict]) -> bytes:
    """
    tracks_spec: list of dicts:
      {
        "name": str,
        "channel": int (0..15),
        "program": int (0..127),
        "notes": list of (start_beat, dur_beat, midi_note, velocity)
      }
    """
    raw_tracks: list[bytes] = []

    # Track 0: Tempo & Time Signature
    t0 = bytearray()
    us_per_beat = int(round(60_000_000 / bpm))
    t0 += _vlq(0) + b"\xFF\x58\x04\x04\x02\x18\x08"
    t0 += _vlq(0) + b"\xFF\x51\x03" + us_per_beat.to_bytes(3, "big")
    t0 += _vlq(0) + b"\xFF\x2F\x00"
    raw_tracks.append(bytes(t0))

    for spec in tracks_spec:
        ch = spec.get("channel", 0) & 0x0F
        prog = spec.get("program", 0) & 0x7F
        name = spec.get("name", "track").encode("utf-8")
        ev = []
        for sb, db, note, vel in spec["notes"]:
            if note <= 0 or db <= 0:
                continue
            st = max(0, int(round(sb * TPB)))
            et = max(st + 1, int(round((sb + db) * TPB)))
            n_clamped = max(0, min(127, int(note)))
            v_clamped = max(1, min(127, int(vel)))
            ev.append((st, 1, n_clamped, v_clamped))
            ev.append((et, 0, n_clamped, 0))
        ev.sort(key=lambda x: (x[0], x[1], x[2]))

        tr = bytearray()
        tr += _vlq(0) + b"\xFF\x03" + _vlq(len(name)) + name
        if ch != 9:
            tr += _vlq(0) + bytes([0xC0 | ch, prog])
        last_t = 0
        for t, kind, note, vel in ev:
            dt = max(0, t - last_t)
            last_t = t
            if kind == 1:
                tr += _vlq(dt) + bytes([0x90 | ch, note, vel])
            else:
                tr += _vlq(dt) + bytes([0x80 | ch, note, 0])
        tr += _vlq(TPB // 2) + b"\xFF\x2F\x00"
        raw_tracks.append(bytes(tr))

    header = b"MThd" + struct.pack(">IHHH", 6, 1, len(raw_tracks), TPB)
    body = b"".join(b"MTrk" + struct.pack(">I", len(t)) + t for t in raw_tracks)
    return header + body


# ============================================================================
# 2. Musical Composition Helpers (~60-64 seconds per track)
# ============================================================================

# MIDI Note numbers:
# C2=36, D2=38, E2=40, F2=41, F#2=42, G2=43, G#2=44, A2=45, Bb2=46, B2=47
# C3=48, C#3=49, D3=50, D#3=51, E3=52, F3=53, F#3=54, G3=55, G#3=56, A3=57, Bb3=58, B3=59
# C4=60, C#4=61, D4=62, D#4=63, E4=64, F4=65, F#4=66, G4=67, G#4=68, A4=69, Bb4=70, B4=71
# C5=72, C#5=73, D5=74, D#5=75, E5=76, F5=77, F#5=78, G5=79, A5=81, B5=83

def compose_intro() -> tuple[int, list[dict]]:
    """
    Homage to the 1970s MBC '수사반장 (Chief Inspector)' theme (~64 seconds, 32 bars @ 120 BPM).
    Features:
      - Urgent rising siren/brass call & punchy syncopated brass fanfare
      - Unmistakable detective brass melody ("빠바바밤~ 빠바바밤~ 빠라바라바라밤~")
      - Driving 1970s funk/walking bassline
      - Rhythmic bongos/congas, crisp hi-hat, snare backbeat & timpani hits
    """
    bpm = 120  # 32 bars * 4 beats = 128 beats = 64.0 seconds
    brass_lead = []
    brass_harm = []
    funk_bass = []
    organ_comp = []
    perc = []  # ch 9: 36=kick, 38=snare, 42=closed hh, 46=open hh, 60=hi bongo, 61=low bongo, 47=timpani

    def add_mel(notes_list, offset_beat, seq, vel=108):
        t = offset_beat
        for n, d in seq:
            if n > 0:
                notes_list.append((t, d * 0.92, n, vel))
            t += d

    # --- SECTION 1: Bars 0..3 (0..16 beats) - Iconic Siren Call & Brass Fanfare Intro ---
    # Urgent rising horn call + syncopated brass stabs
    intro_fanfare = [
        # Bar 0: Punchy brass call (E4-E4-E4 G4-A4-Bb4-A4-G4)
        (64, 0.5), (64, 0.5), (64, 0.75), (67, 0.25), (69, 0.5), (70, 0.5), (69, 0.5), (67, 0.5),
        # Bar 1: Second call rising higher (E4-E4-E4 G4-A4-B4-D5-E5!)
        (64, 0.5), (64, 0.5), (64, 0.75), (67, 0.25), (69, 0.5), (71, 0.5), (74, 0.5), (76, 0.5),
        # Bar 2: Dramatic horn fanfare stabs ("빠-바-바-밤!")
        (71, 0.75), (71, 0.75), (71, 0.5), (67, 0.5), (69, 0.75), (71, 0.75),
        # Bar 3: Answer stab & bongo/bass break
        (74, 0.75), (72, 0.75), (71, 0.5), (69, 0.5), (64, 1.5),
    ]
    add_mel(brass_lead, 0, intro_fanfare, 115)
    add_mel(brass_harm, 0, [(n - 5 if n > 0 else 0, d) for n, d in intro_fanfare], 96)

    # --- SECTION 2: Bars 4..11 (16..48 beats) - Main '수사반장' Homage Theme A ---
    theme_a1 = [
        # Bar 4-5: Signature Chief Inspector brass hook ("빠바바밤~ 빠바바밤~")
        (71, 0.5), (71, 0.5), (71, 0.5), (76, 1.5), (0, 0.5), (74, 0.5),
        (72, 0.5), (72, 0.5), (72, 0.5), (74, 1.5), (0, 0.5), (71, 0.5),
        # Bar 6-7: Rapid detective motif ("빠라바라바라밤~")
        (69, 0.5), (71, 0.5), (72, 0.5), (71, 0.5), (69, 0.5), (67, 0.5), (66, 0.5), (67, 0.5),
        (64, 1.5), (67, 0.5), (69, 0.5), (70, 0.5), (69, 0.5), (67, 0.5),
        # Bar 8-9: Second phrase soaring to high G5/F#5/E5
        (71, 0.5), (71, 0.5), (71, 0.5), (79, 1.5), (0, 0.5), (78, 0.5),
        (76, 0.5), (76, 0.5), (74, 0.5), (72, 1.5), (0, 0.5), (71, 0.5),
        # Bar 10-11: Heroic cadence in E minor
        (69, 0.5), (72, 0.5), (71, 0.5), (69, 0.5), (67, 0.5), (69, 0.5), (66, 0.5), (67, 0.5),
        (64, 2.0), (0, 0.5), (64, 0.5), (67, 0.5), (69, 0.5),
    ]
    add_mel(brass_lead, 16, theme_a1, 114)
    add_mel(brass_harm, 16, [(n - 4 if n in (71, 76, 79) else (n - 3 if n > 0 else 0), d) for n, d in theme_a1], 92)

    # --- SECTION 3: Bars 12..19 (48..80 beats) - Theme B (Suspense & Pursuit Bridge) ---
    theme_b = [
        # Bar 12-13: Tense minor 9th brass swells & syncopated pursuit rhythm
        (72, 1.5), (71, 0.5), (69, 1.0), (64, 0.5), (69, 0.5),
        (72, 0.5), (74, 0.5), (76, 1.0), (74, 1.0), (72, 0.5), (69, 0.5),
        # Bar 14-15: Descending chromatic noir brass stabs
        (71, 1.5), (69, 0.5), (67, 1.0), (64, 0.5), (67, 0.5),
        (70, 0.75), (69, 0.75), (67, 0.5), (64, 1.5), (0, 0.5),
        # Bar 16-17: Call and response between high trumpet and low horn
        (76, 0.75), (76, 0.75), (74, 0.5), (76, 1.0), (79, 1.0),
        (78, 0.75), (76, 0.75), (74, 0.5), (71, 1.5), (0, 0.5),
        # Bar 18-19: Dramatic build-up on B7alt back to Main Theme
        (69, 0.5), (71, 0.5), (72, 0.5), (74, 0.5), (75, 0.5), (76, 0.5), (78, 0.5), (79, 0.5),
        (83, 1.5), (78, 0.5), (76, 0.5), (75, 0.5), (71, 1.0),
    ]
    add_mel(brass_lead, 48, theme_b, 110)
    add_mel(brass_harm, 48, [(n - 5 if n > 0 else 0, d) for n, d in theme_b], 90)

    # --- SECTION 4: Bars 20..27 (80..112 beats) - Climax Theme A' (Full Brass Octave) ---
    add_mel(brass_lead, 80, [(n + 12 if 0 < n < 72 else n, d) for n, d in theme_a1], 118)
    add_mel(brass_harm, 80, theme_a1, 102)

    # --- SECTION 5: Bars 28..31 (112..128 beats) - Turnaround Groove & Finale Hook ---
    outro_seq = [
        # Bar 28-29: Funky brass riff over bongo/bass breakdown
        (64, 0.5), (67, 0.5), (69, 0.5), (70, 0.5), (71, 1.0), (69, 0.5), (67, 0.5),
        (64, 0.5), (67, 0.5), (69, 0.5), (71, 0.5), (74, 1.0), (71, 0.5), (69, 0.5),
        # Bar 30-31: Iconic closing stabs leading seamlessly back to Bar 0
        (71, 0.75), (71, 0.75), (69, 0.5), (67, 0.5), (66, 0.75), (67, 0.75),
        (64, 2.0), (59, 0.5), (62, 0.5), (63, 0.5), (64, 0.5),
    ]
    add_mel(brass_lead, 112, outro_seq, 112)
    add_mel(brass_harm, 112, [(n - 5 if n > 0 else 0, d) for n, d in outro_seq], 92)

    # --- Driving 1970s Funky Walking Bass & Hammond Organ Comping (All 32 Bars) ---
    bass_riff_em = [
        (40, 0.5), (40, 0.5), (52, 0.5), (40, 0.5), (43, 0.5), (45, 0.5), (46, 0.5), (47, 0.5),
        (40, 0.5), (40, 0.5), (52, 0.5), (47, 0.5), (45, 0.5), (43, 0.5), (42, 0.5), (43, 0.5),
    ]
    bass_riff_am = [
        (45, 0.5), (45, 0.5), (57, 0.5), (45, 0.5), (48, 0.5), (50, 0.5), (51, 0.5), (52, 0.5),
        (47, 0.5), (47, 0.5), (45, 0.5), (43, 0.5), (42, 0.5), (43, 0.5), (45, 0.5), (47, 0.5),
    ]
    for barPair in range(16):
        b0 = barPair * 8
        riff = bass_riff_am if barPair in (3, 6, 7, 11) else bass_riff_em
        t = b0
        for n, d in riff:
            funk_bass.append((t, d * 0.88, n, 106))
            t += d
        # Syncopated organ/clavinet chords on off-beats
        ch_notes = (57, 60, 64, 67) if barPair in (3, 6, 7, 11) else (52, 55, 59, 62)
        for beat in range(8):
            for sub in (0.5, 1.25):
                if beat + sub < 8:
                    for cn in ch_notes:
                        organ_comp.append((b0 + beat + sub, 0.22, cn, 76))

    # --- Percussion: Kick, Snare, 16th Hi-Hat & Signature Bongos (All 32 Bars) ---
    for bar in range(32):
        b0 = bar * 4
        for beat in range(4):
            t = b0 + beat
            # Kick on 1, 2.5, 3
            if beat in (0, 2):
                perc.append((t, 0.25, 36, 110))
            if beat == 1:
                perc.append((t + 0.5, 0.25, 36, 95))
            # Crisp Snare on 2 and 4
            if beat in (1, 3):
                perc.append((t, 0.25, 38, 108))
            # 16th-note Hi-hats
            for s in range(4):
                perc.append((t + s * 0.25, 0.12, 42 if s < 3 else 46, 78 if s % 2 == 0 else 62))
            # Iconic 수사반장 Bongo/Conga syncopation
            perc.append((t + 0.25, 0.18, 60, 92))
            perc.append((t + 0.50, 0.18, 61, 88))
            if beat % 2 == 1:
                perc.append((t + 0.75, 0.18, 60, 96))

    return bpm, [
        {"name": "Lead Brass", "channel": 0, "program": 61, "notes": brass_lead},
        {"name": "Harmony Horns", "channel": 1, "program": 60, "notes": brass_harm},
        {"name": "Hammond Organ", "channel": 2, "program": 18, "notes": organ_comp},
        {"name": "Funk Bass", "channel": 3, "program": 33, "notes": funk_bass},
        {"name": "Drums & Bongos", "channel": 9, "program": 0, "notes": perc},
    ]


def compose_car() -> tuple[int, list[dict]]:
    """
    Scene 1 ('car' - 형사 기동차 안): ~60 seconds (25 bars @ 100 BPM = 100 beats = 60.0s).
    Moody 1970s noir stakeout inside the patrol car in the rain:
    Muted jazz trumpet/clarinet, Rhodes electric piano chords, walking upright bass, brush snare.
    """
    bpm = 100  # 100 beats = 60.0 seconds
    lead = []
    epiano = []
    bass = []
    brushes = []

    # 5-bar progression x 5 variations = 25 bars (100 beats)
    # Progression in D minor noir: Dm9 | Gm7 | Em7b5 - A7b9 | Dm9 | Bbmaj7 - A7#5
    chords = [
        (0, 4, [50, 53, 57, 60, 64], 38),      # Dm9
        (4, 4, [55, 58, 62, 65, 69], 43),      # Gm9
        (8, 2, [52, 55, 58, 62], 40),          # Em7b5
        (10, 2, [49, 55, 57, 61, 64], 45),     # A7b9
        (12, 4, [50, 53, 57, 60, 64], 38),     # Dm9
        (16, 2, [46, 53, 57, 62], 46),         # Bbmaj7
        (18, 2, [49, 55, 57, 61], 45),         # A7
    ]

    melodies = [
        # Cycle 0 (0..20b): Smoky muted horn theme
        [(62, 1.5), (65, 0.5), (69, 1.5), (67, 0.5), (65, 1.0), (62, 1.0), (58, 1.5), (0, 0.5),
         (64, 1.0), (62, 1.0), (61, 1.5), (57, 0.5), (62, 2.5), (0, 1.5),
         (65, 1.0), (64, 1.0), (62, 1.0), (61, 1.0)],
        # Cycle 1 (20..40b): Developing higher register noir reflection
        [(69, 1.5), (72, 0.5), (74, 1.5), (72, 0.5), (70, 1.0), (67, 1.0), (65, 1.5), (0, 0.5),
         (67, 1.0), (65, 0.5), (64, 0.5), (61, 1.5), (64, 0.5), (62, 2.5), (0, 1.5),
         (65, 0.75), (67, 0.75), (69, 0.5), (67, 1.0), (64, 1.0)],
        # Cycle 2 (40..60b): Intimate detective blues solo
        [(62, 0.75), (65, 0.75), (68, 0.5), (69, 1.0), (65, 1.0), (67, 0.75), (65, 0.75), (62, 0.5), (58, 1.5), (0, 0.5),
         (64, 0.75), (67, 0.75), (65, 0.5), (61, 1.5), (57, 0.5), (62, 2.0), (60, 1.0), (57, 1.0),
         (58, 1.5), (62, 0.5), (61, 1.5), (0, 0.5)],
        # Cycle 3 (60..80b): Late-night rain tension
        [(74, 1.5), (72, 0.5), (69, 1.5), (65, 0.5), (67, 1.5), (65, 0.5), (62, 1.5), (0, 0.5),
         (64, 1.0), (67, 1.0), (69, 1.0), (67, 1.0), (65, 2.5), (0, 1.5),
         (62, 1.0), (65, 1.0), (64, 1.5), (0, 0.5)],
        # Cycle 4 (80..100b): Returning home to Dm9
        [(69, 1.5), (67, 0.5), (65, 1.0), (62, 1.0), (58, 1.5), (62, 0.5), (65, 1.5), (0, 0.5),
         (64, 1.0), (61, 1.0), (57, 1.0), (61, 1.0), (62, 3.0), (0, 1.0),
         (58, 1.5), (62, 0.5), (61, 1.5), (57, 0.5)],
    ]

    for cyc in range(5):
        base = cyc * 20
        t = base
        for n, d in melodies[cyc]:
            if n > 0:
                lead.append((t, d * 0.92, n, 92))
            t += d

        for c_start, c_dur, notes, root in chords:
            st = base + c_start
            # Warm Rhodes arpeggiated chord voicing
            for idx, cn in enumerate(notes):
                epiano.append((st + idx * 0.12, c_dur - idx * 0.12 - 0.1, cn, 68))
            # Walking upright bass (1 beat per step)
            steps = int(c_dur)
            walk = [root, root + 3, root + 7, root + 5]
            for b in range(steps):
                bass.append((st + b, 0.88, walk[b % len(walk)], 96))

    # Soft jazz brush drums (100 beats)
    for beat in range(100):
        brushes.append((beat, 0.2, 42, 52))
        brushes.append((beat + 0.66, 0.15, 42, 42))
        if beat % 4 == 0:
            brushes.append((beat, 0.25, 36, 68))
        if beat % 2 == 1:
            brushes.append((beat, 0.2, 38, 50))

    return bpm, [
        {"name": "Noir Muted Horn", "channel": 0, "program": 59, "notes": lead},
        {"name": "Rhodes Electric Piano", "channel": 1, "program": 4, "notes": epiano},
        {"name": "Upright Bass", "channel": 2, "program": 32, "notes": bass},
        {"name": "Jazz Brushes", "channel": 9, "program": 0, "notes": brushes},
    ]


def compose_street() -> tuple[int, list[dict]]:
    """
    Scene 2 ('street' - 소공동 한일은행 앞): ~60 seconds (27 bars @ 108 BPM = 108 beats = 60.0s).
    Rain-soaked crime scene investigation on the street outside Hanil Bank:
    Brooding minor guitar/clavinet ostinato, investigative flute/horn melody, pulsing bass.
    """
    bpm = 108  # 108 beats = 60.0 seconds
    lead = []
    ostinato = []
    pad = []
    bass = []
    drums = []

    # 9-bar cycle (36 beats) x 3 cycles = 108 beats = 60.0 seconds in A minor
    cycle_chords = [
        (0, 4, 45, [57, 60, 64, 69]),    # Am
        (4, 4, 41, [53, 57, 60, 64]),    # Fmaj7
        (8, 4, 38, [50, 53, 57, 62]),    # Dm7
        (12, 4, 40, [52, 56, 59, 64]),   # E7
        (16, 4, 45, [57, 60, 64, 71]),   # Am9
        (20, 4, 43, [55, 59, 62, 67]),   # G
        (24, 4, 41, [53, 57, 60, 65]),   # F
        (28, 4, 38, [50, 57, 62, 65]),   # Dm
        (32, 4, 40, [52, 56, 62, 64]),   # E7b9
    ]

    cycle_melodies = [
        # Cycle 0: Searching the wet pavement for clues
        [(69, 1.5), (72, 0.5), (71, 1.0), (69, 1.0), (65, 1.5), (69, 0.5), (64, 2.0),
         (62, 1.0), (65, 1.0), (69, 1.5), (67, 0.5), (64, 3.0), (0, 1.0),
         (69, 1.0), (72, 1.0), (76, 1.5), (74, 0.5), (71, 1.5), (67, 0.5), (69, 2.0),
         (65, 1.0), (64, 1.0), (62, 1.5), (60, 0.5), (59, 1.5), (62, 0.5), (64, 2.0),
         (62, 1.0), (65, 1.0), (64, 1.5), (59, 0.5), (57, 3.0), (0, 1.0)],
        # Cycle 1: Rising investigative tension (cigarette butt & shutter lock clue)
        [(76, 1.5), (74, 0.5), (72, 1.0), (69, 1.0), (72, 1.5), (69, 0.5), (65, 2.0),
         (69, 1.0), (71, 1.0), (74, 1.5), (72, 0.5), (71, 3.0), (0, 1.0),
         (76, 1.0), (79, 1.0), (81, 1.5), (79, 0.5), (76, 1.5), (74, 0.5), (71, 2.0),
         (72, 1.0), (69, 1.0), (65, 1.5), (64, 0.5), (62, 1.5), (65, 0.5), (69, 2.0),
         (68, 1.0), (71, 1.0), (69, 1.5), (64, 0.5), (69, 3.0), (0, 1.0)],
        # Cycle 2: Contemplative noir variation
        [(64, 1.0), (69, 1.0), (72, 1.5), (71, 0.5), (69, 1.0), (65, 1.0), (64, 2.0),
         (62, 1.5), (65, 0.5), (69, 1.0), (65, 1.0), (64, 2.5), (0, 1.5),
         (69, 1.0), (71, 1.0), (72, 1.5), (76, 0.5), (74, 1.5), (71, 0.5), (67, 2.0),
         (65, 1.5), (69, 0.5), (64, 1.0), (60, 1.0), (62, 1.5), (65, 0.5), (62, 2.0),
         (64, 1.5), (68, 0.5), (71, 1.0), (68, 1.0), (69, 3.0), (0, 1.0)],
    ]

    for cyc in range(3):
        base = cyc * 36
        t = base
        for n, d in cycle_melodies[cyc]:
            if n > 0:
                lead.append((t, d * 0.9, n, 98))
            t += d

        for c_start, c_dur, root, c_notes in cycle_chords:
            st = base + c_start
            # Sustained noir string pad
            for cn in c_notes:
                pad.append((st, c_dur * 0.95, cn, 60))
            # 8th-note mystery arpeggio ostinato
            arp = [c_notes[0], c_notes[1], c_notes[2], c_notes[3], c_notes[2], c_notes[1], c_notes[2], c_notes[0]]
            for i, an in enumerate(arp):
                ostinato.append((st + i * 0.5, 0.42, an, 78))
            # Pulsing detective bassline
            for b in range(int(c_dur)):
                bass.append((st + b, 0.45, root, 100))
                bass.append((st + b + 0.5, 0.42, root + (12 if b % 2 == 1 else 7), 86))

    for beat in range(108):
        drums.append((beat, 0.2, 42, 65))
        drums.append((beat + 0.5, 0.18, 42, 52))
        if beat % 4 in (0, 2):
            drums.append((beat, 0.25, 36, 86))
        if beat % 4 in (1, 3):
            drums.append((beat, 0.22, 38, 76))

    return bpm, [
        {"name": "Investigative Lead", "channel": 0, "program": 73, "notes": lead},
        {"name": "Noir Guitar Ostinato", "channel": 1, "program": 26, "notes": ostinato},
        {"name": "Dark Strings Pad", "channel": 2, "program": 48, "notes": pad},
        {"name": "Street Bass", "channel": 3, "program": 33, "notes": bass},
        {"name": "Rainy Beat", "channel": 9, "program": 0, "notes": drums},
    ]


def compose_bank() -> tuple[int, list[dict]]:
    """
    Scene 3 ('bank' - 한일은행 영업장): ~60 seconds (26 bars @ 104 BPM = 104 beats = 60.0s).
    Suspenseful hostage standoff & psychological investigation inside the bank lobby:
    Heartbeat low bass pulse, tense tremolo strings, searching minor piano & mournful horn.
    """
    bpm = 104  # 104 beats = 60.0 seconds
    horn = []
    piano = []
    strings = []
    bass = []
    perc = []

    # 26 bars (104 beats) in C minor / G7b9 suspense
    bar_roots = [
        36, 36, 44, 43,  # Cm, Cm, Ab, G7
        36, 41, 38, 43,  # Cm, Fm, Dm7b5, G7
        44, 46, 36, 36,  # Ab, Bb, Cm, Cm
        41, 43, 36, 43,  # Fm, G7, Cm, G7
        36, 44, 41, 43,  # Cm, Ab, Fm, G7
        44, 41, 43, 43,  # Ab, Fm, G7sus4, G7
        36, 43,          # Cm, G7 turnaround
    ]
    bar_chords = {
        36: [60, 63, 67, 72],
        38: [62, 65, 68, 72],
        41: [60, 65, 68, 72],
        43: [59, 62, 65, 68],
        44: [60, 63, 68, 72],
        46: [58, 62, 65, 70],
    }

    for bar, root in enumerate(bar_roots):
        st = bar * 4
        ch = bar_chords[root]
        # Heartbeat bass: lub-dub on beat 1 & 1.5, beat 3 & 3.5
        for b in (0, 2):
            bass.append((st + b, 0.38, root, 106))
            bass.append((st + b + 0.5, 0.65, root + 12, 92))
        # Tense piano ostinato
        for i in range(8):
            cn = ch[i % len(ch)] + (12 if i == 7 else 0)
            piano.append((st + i * 0.5, 0.4, cn, 76 if i % 2 == 0 else 64))
        # Sustained suspense strings
        for cn in ch[:3]:
            strings.append((st, 3.8, cn, 64))
        # Subtle timpani & rimshot pulse
        perc.append((st, 0.25, 36, 84))
        perc.append((st + 0.5, 0.25, 36, 70))
        perc.append((st + 2.0, 0.22, 37, 68))
        perc.append((st + 3.0, 0.18, 42, 55))

    # Mournful yet tense horn melody across the 104 beats
    horn_phrases = [
        (0, [(67, 2.0), (68, 1.0), (67, 1.0), (63, 2.5), (60, 1.5), (68, 2.0), (67, 1.0), (65, 1.0), (62, 3.0)]),
        (16, [(72, 2.0), (70, 1.0), (68, 1.0), (67, 2.0), (65, 2.0), (63, 1.5), (62, 0.5), (60, 2.0), (59, 3.0)]),
        (32, [(68, 1.5), (72, 0.5), (75, 2.0), (74, 1.5), (70, 0.5), (67, 2.0), (68, 1.5), (65, 0.5), (63, 2.0), (60, 3.0)]),
        (48, [(65, 1.5), (68, 0.5), (72, 2.0), (71, 1.5), (67, 0.5), (65, 2.0), (63, 2.0), (62, 1.0), (60, 1.0), (59, 3.0)]),
        (64, [(72, 1.5), (75, 0.5), (79, 2.0), (77, 1.5), (75, 0.5), (72, 2.0), (68, 1.5), (67, 0.5), (65, 2.0), (67, 3.0)]),
        (80, [(68, 2.0), (72, 1.0), (70, 1.0), (68, 2.0), (65, 2.0), (67, 1.5), (65, 0.5), (63, 1.0), (62, 1.0), (60, 3.0)]),
        (96, [(63, 1.5), (62, 0.5), (60, 2.0), (59, 2.0), (62, 1.0), (67, 1.0)]),
    ]
    for offset, seq in horn_phrases:
        t = offset
        for n, d in seq:
            horn.append((t, d * 0.92, n, 100))
            t += d

    return bpm, [
        {"name": "Suspense Horn", "channel": 0, "program": 60, "notes": horn},
        {"name": "Tense Piano", "channel": 1, "program": 0, "notes": piano},
        {"name": "Tremolo Strings", "channel": 2, "program": 44, "notes": strings},
        {"name": "Heartbeat Bass", "channel": 3, "program": 32, "notes": bass},
        {"name": "Standoff Pulse", "channel": 9, "program": 0, "notes": perc},
    ]


def compose_tense() -> tuple[int, list[dict]]:
    """
    High-tension raid/arrest theme ('tense'): ~60 seconds (32 bars @ 128 BPM = 128 beats = 60.0s).
    Driving 16th-note bass ostinato, urgent brass stabs, dramatic thriller strings & bongos.
    """
    bpm = 128  # 128 beats = 60.0 seconds
    brass = []
    strings = []
    bass = []
    perc = []

    for bar in range(32):
        st = bar * 4
        root = 40 if bar % 4 in (0, 1) else (41 if bar % 4 == 2 else 47)
        # Driving 8th-note thriller bass
        for i in range(8):
            n = root + (12 if i in (2, 5, 7) else (7 if i == 3 else 0))
            bass.append((st + i * 0.5, 0.42, n, 110))
        # Urgent staccato string ostinato
        str_base = root + 24
        for i in range(8):
            strings.append((st + i * 0.5, 0.3, str_base + (1 if i % 3 == 1 else (7 if i == 6 else 0)), 92))
        # Brass action stabs
        if bar % 2 == 0:
            brass.append((st, 0.75, str_base + 7, 115))
            brass.append((st + 0.75, 0.75, str_base + 8, 115))
            brass.append((st + 1.5, 1.5, str_base + 7, 112))
        else:
            brass.append((st + 1.0, 0.5, str_base + 12, 115))
            brass.append((st + 1.5, 0.5, str_base + 10, 112))
            brass.append((st + 2.0, 1.5, str_base + 7, 114))
        # Action drums & bongos
        for b in range(4):
            perc.append((st + b, 0.2, 36 if b % 2 == 0 else 38, 112))
            perc.append((st + b + 0.25, 0.15, 60, 92))
            perc.append((st + b + 0.5, 0.18, 42, 85))
            perc.append((st + b + 0.75, 0.15, 61, 90))

    return bpm, [
        {"name": "Action Brass", "channel": 0, "program": 61, "notes": brass},
        {"name": "Thriller Strings", "channel": 1, "program": 48, "notes": strings},
        {"name": "Pursuit Bass", "channel": 2, "program": 33, "notes": bass},
        {"name": "Action Drums", "channel": 9, "program": 0, "notes": perc},
    ]


def compose_end() -> tuple[int, list[dict]]:
    """
    Humanist closing theme ('end'): ~60 seconds (24 bars @ 96 BPM = 96 beats = 60.0s).
    Warm, bittersweet 1970s Korean drama finale: solo horn/trumpet, warm strings, gentle piano & bass.
    """
    bpm = 96  # 96 beats = 60.0 seconds
    solo_horn = []
    piano = []
    strings = []
    bass = []

    # 8-bar progression (32 beats) x 3 cycles = 96 beats (60.0s) in A minor / C major
    prog = [
        (0, 4, 45, [57, 60, 64, 69]),    # Am
        (4, 4, 38, [50, 57, 62, 65]),    # Dm7
        (8, 4, 43, [55, 59, 62, 67]),    # G7
        (12, 4, 48, [60, 64, 67, 71]),   # Cmaj7
        (16, 4, 41, [53, 57, 60, 64]),   # Fmaj7
        (20, 4, 38, [50, 53, 57, 62]),   # Dm7
        (24, 4, 40, [52, 56, 59, 64]),   # E7
        (28, 4, 45, [57, 60, 64, 69]),   # Am
    ]

    mel_cycles = [
        [(69, 2.0), (72, 1.0), (71, 1.0), (69, 2.5), (65, 1.5),
         (67, 2.0), (71, 1.0), (69, 1.0), (67, 2.5), (64, 1.5),
         (65, 2.0), (69, 1.0), (67, 1.0), (65, 2.0), (62, 2.0),
         (64, 3.0), (68, 1.0), (69, 3.0), (0, 1.0)],
        [(76, 2.0), (74, 1.0), (72, 1.0), (74, 2.5), (69, 1.5),
         (71, 2.0), (74, 1.0), (72, 1.0), (71, 2.5), (67, 1.5),
         (69, 2.0), (72, 1.0), (71, 1.0), (69, 2.0), (65, 2.0),
         (64, 2.5), (68, 1.5), (69, 3.0), (0, 1.0)],
        [(69, 1.5), (71, 0.5), (72, 1.0), (76, 1.0), (74, 2.5), (69, 1.5),
         (71, 1.5), (72, 0.5), (74, 1.0), (71, 1.0), (67, 2.5), (64, 1.5),
         (65, 1.5), (69, 0.5), (72, 1.0), (69, 1.0), (65, 2.0), (62, 2.0),
         (64, 2.0), (68, 2.0), (69, 3.5), (0, 0.5)],
    ]

    for cyc in range(3):
        base = cyc * 32
        t = base
        for n, d in mel_cycles[cyc]:
            if n > 0:
                solo_horn.append((t, d * 0.94, n, 102))
            t += d

        for c_start, c_dur, root, c_notes in prog:
            st = base + c_start
            for cn in c_notes:
                strings.append((st, c_dur * 0.96, cn, 66))
            for i in range(8):
                piano.append((st + i * 0.5, 0.45, c_notes[i % len(c_notes)], 72))
            bass.append((st, 1.9, root, 94))
            bass.append((st + 2.0, 1.9, root + 7, 86))

    return bpm, [
        {"name": "Solo Finale Horn", "channel": 0, "program": 60, "notes": solo_horn},
        {"name": "Warm Piano", "channel": 1, "program": 0, "notes": piano},
        {"name": "Elegiac Strings", "channel": 2, "program": 48, "notes": strings},
        {"name": "Warm Bass", "channel": 3, "program": 32, "notes": bass},
    ]


# ============================================================================
# 3. High-Quality Retro Multi-Timbral Synthesizer (MIDI Specs -> Stereo WAV/MP3)
# ============================================================================

def synth_track_to_stereo(bpm: int, tracks_spec: list[dict], duration_sec: float) -> np.ndarray:
    """
    Renders a multi-track MIDI specification into a rich 44.1kHz stereo float32 array
    with instrument-specific synthesis (brass, mute horn, flute, Rhodes EP, organ,
    guitar, strings, upright/funk bass, drums & bongos), stereo panning, and room reverb.
    """
    spb = 60.0 / bpm
    tail_sec = 1.5
    total_samples = int((duration_sec + tail_sec) * SR)
    left = np.zeros(total_samples, dtype=np.float64)
    right = np.zeros(total_samples, dtype=np.float64)

    for tr_idx, spec in enumerate(tracks_spec):
        ch = spec.get("channel", 0)
        prog = spec.get("program", 0)
        pan = 0.0 if ch in (0, 3, 9) else (-0.32 if tr_idx % 2 == 1 else 0.32)
        gain_l = math.cos((pan + 1.0) * math.pi / 4.0)
        gain_r = math.sin((pan + 1.0) * math.pi / 4.0)

        for sb, db, note, vel in spec["notes"]:
            t0 = sb * spb
            dur = db * spb
            if t0 >= duration_sec or note <= 0 or dur <= 0:
                continue
            i0 = int(t0 * SR)
            rel = 0.08 if ch != 9 else 0.04
            n_samp = min(int((dur + rel) * SR), total_samples - i0)
            if n_samp <= 64:
                continue
            t = np.arange(n_samp, dtype=np.float64) / SR
            amp = (vel / 127.0) * 0.22

            if ch == 9:
                # Percussion / Drum & Bongo Synthesis
                if note == 36:  # Kick
                    f_env = 125.0 * np.exp(-t * 28.0) + 46.0
                    phase = 2.0 * math.pi * np.cumsum(f_env) / SR
                    sig = np.sin(phase) * np.exp(-t * 14.0) * (amp * 1.9)
                elif note in (38, 37):  # Snare / Rim
                    rng = np.random.default_rng(note * 1000 + i0)
                    noise = rng.standard_normal(n_samp)
                    body = np.sin(2.0 * math.pi * 185.0 * t) * np.exp(-t * 25.0)
                    sig = (noise * np.exp(-t * 22.0) * 0.7 + body * 0.4) * (amp * 1.3)
                elif note in (42, 46):  # Closed / Open Hi-Hat
                    rng = np.random.default_rng(note * 1000 + i0)
                    noise = rng.standard_normal(n_samp)
                    # High-pass via simple diff
                    hp = np.diff(noise, prepend=0.0)
                    decay = 42.0 if note == 42 else 14.0
                    sig = hp * np.exp(-t * decay) * (amp * 0.65)
                elif note in (60, 61):  # High / Low Bongo (iconic 수사반장 percussion!)
                    f0 = 390.0 if note == 60 else 265.0
                    f_env = f0 * (1.0 + 0.18 * np.exp(-t * 45.0))
                    phase = 2.0 * math.pi * np.cumsum(f_env) / SR
                    tone = np.sin(phase) + 0.35 * np.sin(2.0 * phase) * np.exp(-t * 35.0)
                    sig = tone * np.exp(-t * 22.0) * (amp * 1.45)
                else:
                    sig = np.sin(2.0 * math.pi * 140.0 * t) * np.exp(-t * 15.0) * amp
                # Zero-pop tail ramp
                tail_n = min(64, n_samp)
                sig[-tail_n:] *= np.linspace(1.0, 0.0, tail_n)
                left[i0:i0 + n_samp] += sig * gain_l
                right[i0:i0 + n_samp] += sig * gain_r
                continue

            freq = 440.0 * (2.0 ** ((note - 69.0) / 12.0))

            # Smooth anti-pop ADSR envelope
            atk = 0.018 if prog in (60, 61, 59) else (0.045 if prog in (44, 48) else 0.008)
            env = np.ones(n_samp, dtype=np.float64)
            atk_s = max(8, min(int(atk * SR), n_samp // 3))
            rel_s = max(16, min(int(rel * SR), n_samp // 2))
            env[:atk_s] = 0.5 * (1.0 - np.cos(math.pi * np.arange(atk_s) / atk_s))
            if prog in (0, 4, 26, 32, 33):
                # Plucked / struck decay
                decay_rate = 3.2 if prog in (32, 33) else 2.2
                env *= np.exp(-t * decay_rate) * 0.75 + 0.25
            env[-rel_s:] *= 0.5 * (1.0 + np.cos(math.pi * np.arange(rel_s) / rel_s))

            if prog in (59, 60, 61):
                # Brass / French Horn / Muted Trumpet with warm vibrato & brass harmonics
                vib = 0.0035 * np.sin(2.0 * math.pi * 5.5 * t) * np.clip((t - 0.12) * 4.0, 0.0, 1.0)
                ph = 2.0 * math.pi * freq * (t + vib / (2.0 * math.pi * 5.5))
                # Brass brightens with envelope
                brightness = (vel / 127.0) * np.clip(env * 1.2, 0.2, 1.0)
                wave_sig = (
                    0.50 * np.sin(ph)
                    + 0.32 * brightness * np.sin(2.0 * ph)
                    + 0.20 * brightness * np.sin(3.0 * ph)
                    + 0.12 * (brightness ** 2) * np.sin(4.0 * ph)
                    + 0.06 * (brightness ** 2) * np.sin(5.0 * ph)
                )
            elif prog in (32, 33):
                # Upright / Funk Electric Bass (punchy fundamental + 2nd/3rd harmonic)
                ph = 2.0 * math.pi * freq * t
                filt = np.exp(-t * 10.0)
                wave_sig = (
                    0.68 * np.sin(ph)
                    + (0.28 + 0.25 * filt) * np.sin(2.0 * ph)
                    + 0.16 * filt * np.sin(3.0 * ph)
                ) * 1.35
            elif prog in (0, 4):
                # Rhodes Electric Piano / Noir Piano (FM bell + warm body + stereo tremolo)
                ph = 2.0 * math.pi * freq * t
                mod = 1.4 * np.exp(-t * 5.0) * np.sin(2.0 * ph)
                wave_sig = (0.75 * np.sin(ph + mod) + 0.25 * np.sin(2.0 * ph)) * 0.95
            elif prog == 18:
                # Hammond Organ (drawbars: 16', 8', 4', 2 2/3')
                ph = 2.0 * math.pi * freq * t
                wave_sig = (
                    0.40 * np.sin(0.5 * ph)
                    + 0.45 * np.sin(ph)
                    + 0.28 * np.sin(2.0 * ph)
                    + 0.20 * np.sin(3.0 * ph)
                ) * 0.85
            elif prog in (44, 48):
                # Warm Detuned Noir Strings
                ph1 = 2.0 * math.pi * (freq * 0.997) * t
                ph2 = 2.0 * math.pi * (freq * 1.003) * t
                wave_sig = (
                    0.45 * (np.sin(ph1) + np.sin(ph2))
                    + 0.22 * (np.sin(2.0 * ph1) + np.sin(2.0 * ph2))
                    + 0.10 * (np.sin(3.0 * ph1) + np.sin(3.0 * ph2))
                ) * 0.65
            else:
                # Flute / Jazz Guitar
                vib = 0.0025 * np.sin(2.0 * math.pi * 5.0 * t)
                ph = 2.0 * math.pi * freq * (t + vib / (2.0 * math.pi * 5.0))
                wave_sig = 0.65 * np.sin(ph) + 0.25 * np.sin(2.0 * ph) + 0.10 * np.sin(3.0 * ph)

            sig = wave_sig * env * amp
            left[i0:i0 + n_samp] += sig * gain_l
            right[i0:i0 + n_samp] += sig * gain_r

    # Seamless loop wrap: fold the 1.5s tail into the beginning of the loop so looping is 100% seamless!
    loop_samples = int(duration_sec * SR)
    tail_samples = total_samples - loop_samples
    if tail_samples > 0 and loop_samples > tail_samples:
        left[:tail_samples] += left[loop_samples:]
        right[:tail_samples] += right[loop_samples:]
    left = left[:loop_samples]
    right = right[:loop_samples]

    # Add warm 1970s studio stereo reverb (wrapped around loop_samples for seamless loop!)
    for delay_ms, fb in ((37, 0.22), (79, 0.15), (131, 0.09)):
        d_samp = int(delay_ms * SR / 1000.0)
        l_del = np.roll(left, d_samp)
        r_del = np.roll(right, d_samp)
        left = left + r_del * fb
        right = right + l_del * fb

    # Soft micro-fade (15ms) at start/end to guarantee zero click even if seek(0) is called
    edge = int(0.015 * SR)
    ramp = 0.5 * (1.0 - np.cos(math.pi * np.arange(edge) / edge))
    left[:edge] *= ramp
    right[:edge] *= ramp
    left[-edge:] *= ramp[::-1]
    right[-edge:] *= ramp[::-1]

    # Normalize peak to -1.5 dBFS
    peak = max(1e-6, float(max(np.max(np.abs(left)), np.max(np.abs(right)))))
    scale = 0.84 / peak
    stereo = np.column_stack((left * scale, right * scale))
    return stereo


def save_stereo_mp3(stereo: np.ndarray, out_mp3: Path, bitrate: str = "128k"):
    tmp_wav = out_mp3.with_suffix(".tmp.wav")
    pcm = np.clip(stereo * 32767.0, -32767, 32767).astype(np.int16)
    with wave.open(str(tmp_wav), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(pcm.tobytes())
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(tmp_wav), "-c:a", "libmp3lame", "-b:a", bitrate, str(out_mp3)],
        check=True,
    )
    tmp_wav.unlink(missing_ok=True)


# ============================================================================
# 4. Ambient Sound Generators (Rain & Wet Street Traffic) & SFX
# ============================================================================

def build_rain_ambient(duration_sec: float = 24.0, indoor: bool = False) -> np.ndarray:
    """
    Synthesizes realistic, warm 1970s monsoon rain (pink/brown-filtered rainfall +
    pavement droplet patter + occasional roof/gutter plinks), seamlessly crossfaded.
    """
    ov_sec = 2.0
    n_total = int((duration_sec + ov_sec) * SR)
    rng = np.random.default_rng(197001 if not indoor else 197002)

    # Stereo white noise -> shaped frequency-domain pink/rain filter
    out_l = np.zeros(n_total, dtype=np.float64)
    out_r = np.zeros(n_total, dtype=np.float64)
    for ch_idx, arr in enumerate((out_l, out_r)):
        w = rng.standard_normal(n_total)
        spec = np.fft.rfft(w)
        freqs = np.fft.rfftfreq(n_total, d=1.0 / SR)
        freqs[0] = 1.0
        if indoor:
            # Muffled indoor rain heard through broken bank glass door (warm low-mid focus)
            filt = (freqs ** -0.55) * np.exp(-((freqs - 520.0) / 680.0) ** 2) + 0.12 * np.exp(-freqs / 350.0)
        else:
            # Outdoor pouring rain on wet asphalt and car roof
            filt = (
                0.65 * (freqs ** -0.42) * (1.0 / (1.0 + (freqs / 3200.0) ** 2))
                + 0.45 * np.exp(-((freqs - 1350.0) / 950.0) ** 2)
                + 0.20 * np.exp(-((freqs - 2800.0) / 1200.0) ** 2)
            )
        filt[freqs < 85.0] *= (freqs[freqs < 85.0] / 85.0) ** 2
        filtered = np.fft.irfft(spec * filt, n=n_total)
        arr[:] = filtered

    # Gentle natural gust modulation (periodic over duration_sec)
    t = np.arange(n_total, dtype=np.float64) / SR
    gust = 0.88 + 0.12 * np.sin(2.0 * math.pi * t / (duration_sec / 3.0))
    out_l *= gust
    out_r *= gust

    # Individual raindrops hitting car roof / puddle plinks
    num_drops = 140 if not indoor else 35
    for _ in range(num_drops):
        pos = int(rng.uniform(0.0, duration_sec) * SR)
        d_len = int(0.018 * SR)
        if pos + d_len >= n_total:
            continue
        dt = np.arange(d_len, dtype=np.float64) / SR
        f0 = float(rng.uniform(900.0, 2400.0 if not indoor else 1200.0))
        plink = np.sin(2.0 * math.pi * f0 * (1.0 + 0.25 * dt * 30.0) * dt) * np.exp(-dt * 190.0)
        amp = float(rng.uniform(0.04, 0.12 if not indoor else 0.04))
        pan = float(rng.uniform(0.2, 0.8))
        out_l[pos:pos + d_len] += plink * amp * pan
        out_r[pos:pos + d_len] += plink * amp * (1.0 - pan)

    # Seamless crossfade of overlap region
    n_main = int(duration_sec * SR)
    n_ov = n_total - n_main
    fade_in = 0.5 * (1.0 - np.cos(math.pi * np.arange(n_ov) / n_ov))
    fade_out = 1.0 - fade_in
    out_l[:n_ov] = out_l[:n_ov] * fade_in + out_l[n_main:] * fade_out
    out_r[:n_ov] = out_r[:n_ov] * fade_in + out_r[n_main:] * fade_out
    out_l = out_l[:n_main]
    out_r = out_r[:n_main]

    peak = max(1e-6, float(max(np.max(np.abs(out_l)), np.max(np.abs(out_r)))))
    target = 0.36 if indoor else 0.55
    return np.column_stack((out_l * (target / peak), out_r * (target / peak)))


def build_traffic_ambient(duration_sec: float = 24.0) -> np.ndarray:
    """
    Synthesizes 1970s wet street car & road ambiance (distant city engine rumble,
    periodic cars passing on wet asphalt with stereo panning & Doppler shift,
    and a subtle distant vintage car horn), seamlessly crossfaded.
    """
    ov_sec = 2.0
    n_total = int((duration_sec + ov_sec) * SR)
    rng = np.random.default_rng(197003)
    t = np.arange(n_total, dtype=np.float64) / SR

    out_l = np.zeros(n_total, dtype=np.float64)
    out_r = np.zeros(n_total, dtype=np.float64)

    # 1. Continuous distant wet road & patrol car idle engine hum (low-passed 65Hz/130Hz warm thrum)
    idle = (
        0.08 * np.sin(2.0 * math.pi * 58.0 * t + 0.3 * np.sin(2.0 * math.pi * 3.5 * t))
        + 0.05 * np.sin(2.0 * math.pi * 116.0 * t)
    )
    out_l += idle
    out_r += idle

    # 2. Passing cars on wet asphalt (at t = 3.5s, 9.5s, 15.5s, 21.0s)
    passes = [
        (3.5, 3.6, 1, 78.0, 0.55),     # Left -> Right pass
        (9.5, 4.2, -1, 68.0, 0.48),    # Right -> Left pass
        (15.5, 3.4, 1, 86.0, 0.62),    # Faster sedan passing Left -> Right
        (21.0, 3.8, -1, 62.0, 0.45),   # Truck/bus passing in distance Right -> Left
    ]
    w_noise = rng.standard_normal(n_total)
    # Band-limited wet tire spray noise
    spec = np.fft.rfft(w_noise)
    freqs = np.fft.rfftfreq(n_total, d=1.0 / SR)
    tire_filt = np.exp(-((freqs - 680.0) / 520.0) ** 2) + 0.45 * np.exp(-((freqs - 1500.0) / 800.0) ** 2)
    tire_noise = np.fft.irfft(spec * tire_filt, n=n_total)
    tire_noise /= max(1e-6, float(np.max(np.abs(tire_noise))))

    for center_t, width_t, direction, eng_f, amp in passes:
        rel_t = (t - center_t) / (width_t * 0.5)
        env = np.exp(-(rel_t ** 2) * 1.8)
        # Doppler pitch shift as car approaches and recedes
        doppler = 1.0 - 0.11 * np.tanh(rel_t * 1.4)
        eng_phase = 2.0 * math.pi * np.cumsum(eng_f * doppler) / SR
        eng_sig = (0.65 * np.sin(eng_phase) + 0.35 * np.sin(2.0 * eng_phase)) * 0.28
        whoosh = (tire_noise * 0.72 + eng_sig) * env * amp

        pan = np.clip(0.5 + 0.42 * direction * np.tanh(rel_t), 0.05, 0.95)
        out_l += whoosh * (1.0 - pan)
        out_r += whoosh * pan

    # 3. Occasional distant muted 1970s dual-tone horn in the rain (around t = 12.2s)
    h_start = int(12.2 * SR)
    h_len = int(0.42 * SR)
    if h_start + h_len < n_total:
        ht = np.arange(h_len, dtype=np.float64) / SR
        henv = np.sin(math.pi * ht / 0.42) ** 1.5
        horn_sig = (
            0.5 * np.sin(2.0 * math.pi * 385.0 * ht)
            + 0.4 * np.sin(2.0 * math.pi * 482.0 * ht)
            + 0.15 * np.sin(2.0 * math.pi * 770.0 * ht)
        ) * henv * 0.11
        out_l[h_start:h_start + h_len] += horn_sig * 0.65
        out_r[h_start:h_start + h_len] += horn_sig * 0.35

    # Seamless crossfade
    n_main = int(duration_sec * SR)
    n_ov = n_total - n_main
    fade_in = 0.5 * (1.0 - np.cos(math.pi * np.arange(n_ov) / n_ov))
    fade_out = 1.0 - fade_in
    out_l[:n_ov] = out_l[:n_ov] * fade_in + out_l[n_main:] * fade_out
    out_r[:n_ov] = out_r[:n_ov] * fade_in + out_r[n_main:] * fade_out
    out_l = out_l[:n_main]
    out_r = out_r[:n_main]

    peak = max(1e-6, float(max(np.max(np.abs(out_l)), np.max(np.abs(out_r)))))
    return np.column_stack((out_l * (0.52 / peak), out_r * (0.52 / peak)))


def build_sfx_files():
    """Generates clean retro detective SFX files in game/audio/sfx/."""
    # 1. click.mp3 (soft typewriter/switch click)
    n = int(0.06 * SR)
    t = np.arange(n) / SR
    sig = np.sin(2 * math.pi * 920 * t) * np.exp(-t * 95) * 0.45
    save_stereo_mp3(np.column_stack((sig, sig)), SFX_DIR / "click.mp3")

    # 2. pickup.mp3 (clue found two-note chime)
    n = int(0.32 * SR)
    t = np.arange(n) / SR
    f = np.where(t < 0.12, 587.33, 880.0)
    ph = 2 * math.pi * np.cumsum(f) / SR
    sig = np.sin(ph) * np.exp(-t * 9.0) * 0.5
    save_stereo_mp3(np.column_stack((sig, sig)), SFX_DIR / "pickup.mp3")

    # 3. shutter.mp3 (metallic rolling bank shutter sound)
    n = int(0.55 * SR)
    t = np.arange(n) / SR
    rng = np.random.default_rng(70)
    rattle = np.sin(2 * math.pi * (140 + 40 * np.sin(2 * math.pi * 18 * t)) * t)
    noise = rng.standard_normal(n) * 0.25
    sig = (rattle * 0.6 + noise) * np.exp(-t * 4.5) * 0.55
    save_stereo_mp3(np.column_stack((sig, sig)), SFX_DIR / "shutter.mp3")


# ============================================================================
# 5. Main Execution
# ============================================================================

def main():
    songs_composers = {
        "intro": (compose_intro, 64.0),
        "car": (compose_car, 60.0),
        "street": (compose_street, 60.0),
        "bank": (compose_bank, 60.0),
        "tense": (compose_tense, 60.0),
        "end": (compose_end, 60.0),
    }

    b64_map = {}
    for name, (composer, dur_sec) in songs_composers.items():
        bpm, tracks = composer()
        midi_bytes = build_midi_bytes(bpm, tracks)
        # Save .mid to game/audio/midi/ and legacy/assets/
        (MIDI_DIR / f"{name}.mid").write_bytes(midi_bytes)
        (LEGACY_ASSETS / f"{name}.mid").write_bytes(midi_bytes)
        b64_map[name] = base64.b64encode(midi_bytes).decode("ascii")

        # Synthesize ~60s stereo MP3 for @quest-n-click/engine
        stereo = synth_track_to_stereo(bpm, tracks, dur_sec)
        out_mp3 = MUSIC_DIR / f"{name}.mp3"
        save_stereo_mp3(stereo, out_mp3, bitrate="128k")
        print(f"  [music] {name}.mid ({len(midi_bytes)} B) & {name}.mp3 ({dur_sec:.0f}s, {out_mp3.stat().st_size // 1024} KB)")

    # Also keep 'rain' alias in legacy/js/songs.js pointing to 'car' so any legacy caller of 'rain' works
    b64_map["rain"] = b64_map["car"]
    (LEGACY_ASSETS / "rain.mid").write_bytes((MIDI_DIR / "car.mid").read_bytes())

    # Write legacy/js/songs.js
    js_lines = ["// Auto-generated ~60s SMF MIDI files (base64)", "window.SUSA_SONGS = {"]
    for k, v in b64_map.items():
        js_lines.append(f'  "{k}": "{v}",')
    js_lines.append("};")
    LEGACY_SONGS_JS.write_text("\n".join(js_lines) + "\n", encoding="utf-8")
    print(f"  [legacy] Updated {LEGACY_SONGS_JS}")

    # Build ambient loops & SFX
    rain_stereo = build_rain_ambient(24.0, indoor=False)
    save_stereo_mp3(rain_stereo, SFX_DIR / "rain.mp3", bitrate="128k")
    rain_in_stereo = build_rain_ambient(20.0, indoor=True)
    save_stereo_mp3(rain_in_stereo, SFX_DIR / "rain_indoor.mp3", bitrate="96k")
    traffic_stereo = build_traffic_ambient(24.0)
    save_stereo_mp3(traffic_stereo, SFX_DIR / "traffic.mp3", bitrate="128k")
    build_sfx_files()
    print("  [ambient & sfx] rain.mp3, rain_indoor.mp3, traffic.mp3, click.mp3, pickup.mp3, shutter.mp3 ready.")


if __name__ == "__main__":
    main()
