"""Trilha + efeitos sonoros dos motions da Plano Tecidos.
Uso: python3 audio.py <cues.json> <saida.wav>
cues.json = {"duration": s, "cues": [{"t": s, "s": nome, "d": dur?}], "mood": "warm"}
Tudo é sintetizado (numpy/scipy): sem samples de terceiros."""
import json, sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
rng = np.random.default_rng(11)


def T(d):
    return np.arange(int(d * SR)) / SR


def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(t / max(a, 1e-4), 1) * np.exp(-np.maximum(t - a, 0) / max(d, 1e-4))


def filt(x, kind, f, order=2):
    f = np.atleast_1d(f) / (SR / 2)
    f = np.clip(f, 1e-4, .99)
    b, a = signal.butter(order, f if len(f) > 1 else f[0], kind)
    return signal.lfilter(b, a, x)


def hz(m):
    return 440 * 2 ** ((m - 69) / 12)


def pluck(f, d=1.2, bright=1.0):
    t = T(d)
    x = sum((1 / k) * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (3 + k * 2.2 / bright)) for k in range(1, 6))
    return x * env(len(t), .004, d / 2.5)


def pad(fs, d):
    t = T(d)
    x = sum(np.sin(2 * np.pi * f * t + .3 * np.sin(2 * np.pi * .2 * t)) + .5 * np.sin(2 * np.pi * f * 2.003 * t) for f in fs)
    a = np.minimum(t / .8, 1) * np.minimum((d - t) / .8, 1)
    return filt(x * a, 'low', 1800) / len(fs)


def noise(d):
    return rng.standard_normal(int(d * SR))


# ---------------- efeitos ----------------
def sfx(name, d=None):
    if name in ('whoosh', 'swoosh'):
        dd = .55 if name == 'whoosh' else .4
        n = noise(dd); t = T(dd)
        out = np.zeros_like(n)
        for i, f0 in enumerate(np.linspace(400, 3200, 8)):
            seg = slice(int(i * len(n) / 8), int((i + 1) * len(n) / 8))
            out[seg] = filt(n, 'band', [f0 * .6, f0 * 1.4])[seg]
        return out * np.sin(np.pi * t / dd) ** 2 * .5
    if name == 'pop':
        t = T(.18); f = 900 * np.exp(-t * 18) + 300
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), .002, .05) * .6
    if name in ('tap', 'tick'):
        t = T(.06)
        return (np.sin(2 * np.pi * (2400 if name == 'tap' else 1800) * t) + .5 * noise(.06)) * env(len(t), .001, .012) * (.45 if name == 'tap' else .3)
    if name == 'type':
        t = T(.04)
        return filt(noise(.04), 'band', [1500, 5000]) * env(len(t), .001, .008) * (.25 + .1 * rng.random())
    if name == 'nope':
        t = T(.35)
        return (np.sin(2 * np.pi * 180 * t) + .4 * np.sin(2 * np.pi * 360 * t)) * env(len(t), .005, .12) * .45
    if name == 'sigh':
        n = filt(noise(1.0), 'band', [300, 1200]); t = T(1.0)
        return n * np.sin(np.pi * t) ** 2 * .12
    if name == 'idea' or name == 'ding':
        notes = [84, 88, 91] if name == 'idea' else [88]
        out = np.zeros(int(1.4 * SR))
        for i, m in enumerate(notes):
            p = pluck(hz(m), 1.2, 2) * .35
            s = int(i * .09 * SR); out[s:s + len(p)] += p[:len(out) - s]
        return out
    if name == 'success':
        out = np.zeros(int(1.6 * SR))
        for i, m in enumerate([72, 76, 79, 84]):
            p = pluck(hz(m), 1.2, 1.6) * .32
            s = int(i * .08 * SR); out[s:s + len(p)] += p[:len(out) - s]
        return out
    if name == 'draw':
        n = filt(noise(1.4), 'band', [2500, 7000]); t = T(1.4)
        return n * (.5 + .5 * np.sin(2 * np.pi * 9 * t)) * np.sin(np.pi * t / 1.4) * .12
    if name == 'slide':
        n = filt(noise(1.2), 'band', [200, 900]); t = T(1.2)
        return n * np.sin(np.pi * t / 1.2) * .25
    if name == 'truck':
        t = T(1.8); f = 70 + 10 * np.sin(2 * np.pi * 3 * t)
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) + .4 * filt(noise(1.8), 'low', 400)
        return x * np.sin(np.pi * t / 1.8) ** 2 * .3
    if name in ('thud', 'boom'):
        t = T(.5); f = 120 * np.exp(-t * 8) + 45
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), .003, .16) * (.8 if name == 'boom' else .6)
    if name == 'unwrap':
        n = filt(noise(.8), 'high', 1500); t = T(.8)
        crack = (rng.random(len(n)) > .985).astype(float)
        return (n * .1 + crack * .5 * filt(noise(.8), 'band', [2000, 6000])) * np.sin(np.pi * t / .8)
    if name == 'sew':
        dd = d or 5; t = T(dd)
        rate = 14
        clicks = np.zeros(len(t))
        for k in np.arange(0, dd, 1 / rate):
            s = int(k * SR); c = sfx('tick'); clicks[s:s + len(c)] += c[:len(clicks) - s] * .8
        hum = (np.sin(2 * np.pi * 110 * t) + .3 * np.sin(2 * np.pi * 220 * t)) * .06
        a = np.minimum(t / .2, 1) * np.minimum((dd - t) / .2, 1)
        return (clicks + hum) * a
    if name == 'sparkle':
        out = np.zeros(int(1.6 * SR))
        for i in range(9):
            m = rng.choice([84, 86, 88, 91, 93, 96])
            p = pluck(hz(m), .6, 3) * .16
            s = int(i * .13 * SR); out[s:s + len(p)] += p[:len(out) - s]
        return out
    if name == 'twirl':
        n = filt(noise(1.2), 'band', [600, 2600]); t = T(1.2)
        return n * np.sin(np.pi * t / 1.2) ** 2 * .3
    if name == 'check':
        return pluck(hz(79), .6, 1.5) * .35
    if name == 'star':
        return None  # tratado com a nota correspondente
    if name in ('rise', 'unroll'):
        dd = d or (.9 if name == 'rise' else 1.2); t = T(dd)
        n = filt(noise(dd), 'band', [300, 2400])
        return n * np.minimum(t / dd, 1) * np.sin(np.pi * t / dd) * .3
    if name == 'logo':
        out = np.zeros(int(3 * SR))
        for i, m in enumerate([60, 67, 72, 76, 79]):
            p = pluck(hz(m), 2.5, 1.2) * .28
            s = int(i * .05 * SR); out[s:s + len(p)] += p[:len(out) - s]
        return out + np.pad(pad([hz(60), hz(64), hz(67)], 2.6) * .25, (0, int(.4 * SR)))[:len(out)]
    return None


def star_sfx(i):
    x = pluck(hz([76, 79, 83, 86, 88][i % 5]), .8, 2) * .4
    p = sfx('pop')
    x[:len(p)] += p * .6
    return x


# ---------------- trilha ----------------
def music(dur, bpm=100):
    beat = 60 / bpm
    bar = beat * 4
    prog = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]  # C G Am F
    out = np.zeros(int((dur + 3) * SR))
    nb = int(np.ceil(dur / bar))
    for b in range(nb):
        ch = prog[b % 4]
        s = int(b * bar * SR)
        pd = pad([hz(m) for m in ch], bar + .8) * .16
        out[s:s + len(pd)] += pd[:len(out) - s]
        bass = pluck(hz(ch[0] - 24), bar, .6) * .35
        out[s:s + len(bass)] += bass[:len(out) - s]
        arp = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 12]
        for k in range(8):
            m = arp[k % 4] + (12 if k == 6 else 0)
            p = pluck(hz(m), .7, 1.4) * .11
            ss = s + int(k * beat / 2 * SR); out[ss:ss + len(p)] += p[:len(out) - ss]
        for k in range(4):  # percussão suave: kick nos tempos 1 e 3, shaker nos contratempos
            ss = s + int(k * beat * SR)
            if k % 2 == 0:
                t = T(.25); f = 90 * np.exp(-t * 20) + 45
                kk = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), .002, .08) * .3
                out[ss:ss + len(kk)] += kk[:len(out) - ss]
            sh = filt(noise(.08), 'high', 6000) * env(int(.08 * SR), .005, .02) * .05
            s2 = ss + int(beat / 2 * SR); out[s2:s2 + len(sh)] += sh[:len(out) - s2]
    out = out[:int(dur * SR)]
    t = T(dur)
    fade = np.minimum(t / 1.0, 1) * np.minimum((dur - t) / 1.5, 1)
    return out * fade


def main():
    cfg = json.load(open(sys.argv[1]))
    dur = cfg['duration']
    mix = music(dur, cfg.get('bpm', 100)) * .55
    fx = np.zeros_like(mix)
    for c in cfg['cues']:
        x = star_sfx(c.get('i', 0)) if c['s'] == 'star' else sfx(c['s'], c.get('d'))
        if x is None:
            continue
        s = int(c['t'] * SR)
        if s >= len(fx):
            continue
        fx[s:s + len(x)] += x[:len(fx) - s]
    y = mix + fx
    y = np.tanh(y * 1.2) / np.tanh(1.2)
    y /= max(1e-6, np.abs(y).max()) / .9
    st = np.stack([y, filt(y, 'low', 9000)], 1)  # leve diferença L/R
    wavfile.write(sys.argv[2], SR, (st * 32767).astype(np.int16))


if __name__ == '__main__':
    main()
