"""Trilha + efeitos sonoros sincronizados aos cues exportados pelo studio.html."""
import json, sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
rng = np.random.default_rng(7)


def t_arr(d):
    return np.arange(int(d * SR)) / SR


def env_ad(n, a, d):
    """ataque linear + decaimento exponencial (em segundos)"""
    t = np.arange(n) / SR
    e = np.minimum(t / max(a, 1e-4), 1.0) * np.exp(-np.maximum(t - a, 0) / max(d, 1e-4))
    return e


def lp(x, fc, order=2):
    b, a = signal.butter(order, min(fc / (SR / 2), 0.99), "low")
    return signal.lfilter(b, a, x)


def hp(x, fc, order=2):
    b, a = signal.butter(order, fc / (SR / 2), "high")
    return signal.lfilter(b, a, x)


def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), min(hi / (SR / 2), 0.99)], "band")
    return signal.lfilter(b, a, x)


def note(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def saw(f, t, detune=0.0):
    ph = (f * (1 + detune)) * t
    return 2 * (ph - np.floor(ph + 0.5))


def sweep_noise(d, f0, f1, f2=None, q=1.2):
    """ruído com filtro passa-banda que varre f0 -> f1 (-> f2), em blocos"""
    n = int(d * SR)
    x = rng.standard_normal(n)
    out = np.zeros(n)
    blk = 512
    zi = None
    for i in range(0, n, blk):
        p = i / n
        if f2 is None:
            fc = f0 * (f1 / f0) ** p
        else:
            fc = f0 * (f1 / f0) ** (p * 2) if p < .5 else f1 * (f2 / f1) ** ((p - .5) * 2)
        lo, hi = fc / (1 + 1 / q), fc * (1 + 1 / q)
        b, a = signal.butter(2, [max(lo, 30) / (SR / 2), min(hi, SR / 2 * .95) / (SR / 2)], "band")
        if zi is None or len(zi) != max(len(a), len(b)) - 1:
            zi = signal.lfilter_zi(b, a) * 0
        seg, zi = signal.lfilter(b, a, x[i:i + blk], zi=zi)
        out[i:i + blk] = seg
    return out


# ---------------- efeitos ----------------
def fx_whoosh(d=.7, peak=.5, gain=1.0):
    n = int(d * SR); t = np.arange(n) / SR
    x = sweep_noise(d, 250, 2800, 350, q=1.5)
    e = np.where(t < d * peak, (t / (d * peak)) ** 2, np.exp(-(t - d * peak) / (d * .18)))
    return x * e * 1.6 * gain


def fx_impact(gain=1.0):
    d = 1.4; t = t_arr(d)
    f = 38 + 90 * np.exp(-t / .06)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .45)
    nz = lp(rng.standard_normal(len(t)), 1800) * np.exp(-t / .12) * .6
    return (sub * 1.1 + nz) * gain


def fx_rumble():
    d = 1.9; t = t_arr(d)
    x = lp(rng.standard_normal(len(t)), 220, 4) * 3
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
    return x * e * .9


def fx_riser():
    d = .75; t = t_arr(d)
    x = sweep_noise(d, 400, 6000, q=2) * (t / d) ** 2 * 1.4
    tone = np.sin(2 * np.pi * np.cumsum(300 + 900 * (t / d) ** 2) / SR) * (t / d) ** 3 * .15
    return x + tone


def bell(f, d=1.6, gain=.3):
    t = t_arr(d)
    x = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / (d * k)) for r, a, k in [(1, 1, .45), (2.76, .45, .25), (5.4, .2, .12), (8.93, .08, .07)])
    return x * np.minimum(t / .003, 1) * gain


def fx_tick():
    d = .05; t = t_arr(d)
    return np.sin(2 * np.pi * 2100 * t) * np.exp(-t / .01) * .18


def fx_click():
    d = .06; t = t_arr(d)
    return (hp(rng.standard_normal(len(t)), 2500) * np.exp(-t / .004) * .5 + np.sin(2 * np.pi * 3200 * t) * np.exp(-t / .008) * .2)


def fx_pop():
    d = .12; t = t_arr(d)
    f = 220 + 650 * np.exp(-t / .02)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .035) * .45


def fx_sparkle():
    out = np.zeros(int(.9 * SR))
    for i in range(7):
        st = int(rng.uniform(0, .45) * SR)
        b = bell(rng.choice([note(m) for m in (91, 93, 96, 98, 100, 103)]), .5, .07)
        out[st:st + len(b)] += b[:len(out) - st]
    return out


def fx_chime():
    out = np.zeros(int(2.4 * SR))
    for i, m in enumerate([84, 88, 91, 96]):
        b = bell(note(m), 1.8, .16)
        st = int(i * .07 * SR); out[st:st + len(b)] += b[:len(out) - st]
    return out


def fx_ding():
    out = np.zeros(int(1.2 * SR))
    for i, m in enumerate([88, 95]):
        b = bell(note(m), .9, .28); st = int(i * .11 * SR); out[st:st + len(b)] += b[:len(out) - st]
    return out


def fx_success():
    out = np.zeros(int(1.4 * SR))
    for i, m in enumerate([84, 88, 91, 96]):
        b = bell(note(m), .8, .2); st = int(i * .065 * SR); out[st:st + len(b)] += b[:len(out) - st]
    return out


def fx_beep():
    d = .14; t = t_arr(d)
    return np.sign(np.sin(2 * np.pi * 1760 * t)) * .07 * np.minimum(1, (d - t) / .01) * np.minimum(1, t / .005)


def fx_count():
    out = np.zeros(int(1.7 * SR)); k = 0; t0 = 0.0
    while t0 < 1.55:
        c = fx_tick() * (.6 + .4 * rng.random()); st = int(t0 * SR); out[st:st + len(c)] += c[:len(out) - st]
        t0 += .045 + .1 * (t0 / 1.6) ** 2
    return out


def fx_type():
    out = np.zeros(int(1.6 * SR)); t0 = 0.0
    while t0 < 1.4:
        c = fx_click() * (.35 + .3 * rng.random()); st = int(t0 * SR); out[st:st + len(c)] += c[:len(out) - st]
        t0 += rng.uniform(.06, .13)
    return out


def fx_rise():
    d = .9; t = t_arr(d)
    f = note(72) * 2 ** (t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) * .07


def fx_tv_on():
    d = .6; t = t_arr(d)
    th = np.sin(2 * np.pi * 70 * t) * np.exp(-t / .08) * .5
    wh = np.sin(2 * np.pi * 7800 * t) * np.exp(-t / .25) * .02
    return th + wh + fx_click()[: len(t)].sum() * 0


def fx_send():
    a = fx_whoosh(.35, .6, .5); b = fx_pop()
    out = np.zeros(len(a) + len(b)); out[:len(a)] += a; out[int(.3 * SR):int(.3 * SR) + len(b)] += b
    return out


def fx_final():
    imp = fx_impact(1.1); ch = fx_chime()
    d = 3.0; t = t_arr(d)
    crash = hp(rng.standard_normal(len(t)), 4000) * np.exp(-t / .9) * .22
    out = np.zeros(len(t)); out[:len(imp)] += imp; out[:len(ch)] += ch * 1.2; out += crash
    return out


FX = {
    "whoosh": lambda: fx_whoosh(.8, .55, 1.0), "whoosh-soft": lambda: fx_whoosh(.55, .5, .45), "trans": lambda: fx_whoosh(.6, .5, .8),
    "swipe": lambda: fx_whoosh(.3, .5, .4), "impact": fx_impact, "impact-soft": lambda: fx_impact(.45), "rumble": fx_rumble,
    "riser": fx_riser, "tick": fx_tick, "click": fx_click, "pop": fx_pop, "sparkle": fx_sparkle, "chime": fx_chime,
    "ding": fx_ding, "success": fx_success, "beep": fx_beep, "count": fx_count, "type": fx_type, "rise": fx_rise,
    "tv-on": fx_tv_on, "send": fx_send, "final": fx_final, "swell": None,
}


# ---------------- trilha ----------------
def music(dur, drums_on, drums_off, bpm=120):
    n = int((dur + 3) * SR); t = np.arange(n) / SR
    beat = 60 / bpm; bar = beat * 4
    L = np.zeros(n); R = np.zeros(n)
    # IV – V – iii – vi em Dó
    prog = [(53, [65, 69, 72, 76]), (55, [67, 71, 74, 79]), (52, [64, 67, 71, 74]), (57, [64, 69, 72, 76])]
    nbars = int(np.ceil(dur / bar)) + 1
    pad = np.zeros(n); bass = np.zeros(n); arp = np.zeros(n)
    for b in range(nbars):
        root, ch = prog[b % 4]
        s0, s1 = int(b * bar * SR), min(int((b + 1) * bar * SR + .3 * SR), n)
        if s0 >= n: break
        tt = np.arange(s1 - s0) / SR
        e = np.minimum(tt / .35, 1) * np.minimum(1, np.maximum(0, (s1 - s0) / SR - tt) / .3)
        seg = sum(saw(note(m - 12), tt, dt) for m in ch for dt in (-.004, .004)) / 8
        pad[s0:s1] += seg * e
        # baixo em colcheias
        for k in range(8):
            ss = s0 + int(k * beat / 2 * SR); dd = int(beat / 2 * SR * .9)
            if ss + dd > n: break
            tb = np.arange(dd) / SR
            f = note(root - 12)
            x = np.tanh(2.2 * np.sin(2 * np.pi * f * tb)) * env_ad(dd, .005, .16)
            bass[ss:ss + dd] += x * (1 if k % 2 == 0 else .7)
        # arpejo em semicolcheias
        pat = [0, 1, 2, 3, 2, 1, 3, 2, 0, 2, 1, 3, 2, 3, 1, 2]
        for k in range(16):
            ss = s0 + int(k * beat / 4 * SR); dd = int(.22 * SR)
            if ss + dd > n: break
            tb = np.arange(dd) / SR; f = note(ch[pat[k]] + 12)
            tri = 2 * np.abs(2 * (f * tb - np.floor(f * tb + .5))) - 1
            arp[ss:ss + dd] += tri * env_ad(dd, .002, .07) * (1 if k % 4 == 0 else .6)
    pad = lp(pad, 1400, 2) * .5
    bass = lp(bass, 600) * .32
    arp = lp(arp, 4200) * .07
    # bateria
    dr = np.zeros(n)
    kick_d = int(.35 * SR); tk = np.arange(kick_d) / SR
    kick = np.sin(2 * np.pi * np.cumsum(45 + 110 * np.exp(-tk / .035)) / SR) * np.exp(-tk / .16)
    hat_d = int(.05 * SR); hat = hp(rng.standard_normal(hat_d), 7000) * np.exp(-np.arange(hat_d) / SR / .012)
    clap_d = int(.2 * SR); clap = bp(rng.standard_normal(clap_d), 900, 3500) * np.exp(-np.arange(clap_d) / SR / .05)
    nbeats = int(dur / beat) + 1
    duck = np.ones(n)
    for k in range(nbeats):
        tb = k * beat
        if not (drums_on <= tb < drums_off): continue
        ss = int(tb * SR)
        if ss + kick_d < n:
            dr[ss:ss + kick_d] += kick * .9
            dl = int(.25 * SR); duck[ss:ss + dl] = np.minimum(duck[ss:ss + dl], .55 + .45 * np.linspace(0, 1, dl) ** .7)
        if k % 2 == 1 and ss + clap_d < n: dr[ss:ss + clap_d] += clap * .5
        sh = int((tb + beat / 2) * SR)
        if sh + hat_d < n: dr[sh:sh + hat_d] += hat * .35
        if sh + hat_d < n and k % 4 == 3:
            s2 = int((tb + beat * .75) * SR); dr[s2:s2 + hat_d] += hat * .2
    # energia: arpejo e baixo só com bateria; fora disso, só pad
    act = np.zeros(n); a0, a1 = int(drums_on * SR), int(min(drums_off, dur + 3) * SR)
    act[a0:a1] = 1
    act = lp(act, 3)  # suaviza entradas
    melo = (bass + arp) * act
    mono = pad * duck + melo * duck + dr
    # estéreo leve
    L = mono + arp * act * .4; R = mono - arp * act * .4 + pad * .15
    # fade final
    fe = np.ones(n); fs = int((dur - 2.5) * SR)
    if fs > 0: fe[fs:] = np.clip(1 - (np.arange(n - fs) / SR) / 2.5, 0, 1)
    return np.stack([L * fe, R * fe])[:, :int(dur * SR)]


def main(cues_path, out_path):
    data = json.load(open(cues_path))
    dur, cues = data["duration"], data["cues"]
    n = int(dur * SR)
    first_hit = next((c["t"] for c in cues if c["k"] in ("impact",)), 2.0)
    final = next((c["t"] for c in cues if c["k"] == "final"), None)
    if final is None:
        final = next((c["t"] for c in cues if c["k"] == "chime" and c["t"] > dur - 4), dur - 2.0)
    mus = music(dur, min(first_hit, 4.0), final, 120) * .5
    sfx = np.zeros((2, n + 4 * SR))
    for i, c in enumerate(cues):
        f = FX.get(c["k"])
        if f is None: continue
        x = f(); st = int(c["t"] * SR)
        if c["k"] == "trans": st = max(0, st - int(.0 * SR))
        pan = 0.0 if c["k"] not in ("sparkle", "tick", "click") else ((i * .37) % 1 - .5) * .6
        gl, gr = np.sqrt(.5 - pan / 2) * 1.41, np.sqrt(.5 + pan / 2) * 1.41
        e = min(len(x), sfx.shape[1] - st)
        sfx[0, st:st + e] += x[:e] * gl; sfx[1, st:st + e] += x[:e] * gr
    sfx = sfx[:, :n]
    # reverb simples (IR de ruído com decaimento)
    ird = int(1.3 * SR); ir = rng.standard_normal((2, ird)) * np.exp(-np.arange(ird) / SR / .35)
    ir = np.stack([lp(ir[0], 5000), lp(ir[1], 5000)])
    wet = np.stack([signal.fftconvolve(sfx[c] * .6 + mus[c] * .25, ir[c])[:n] for c in range(2)]) * .025
    mix = mus + sfx * .85 + wet
    mix = hp(mix, 25)
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    mix *= .89 / max(np.max(np.abs(mix)), 1e-6)
    fi = int(.03 * SR); mix[:, :fi] *= np.linspace(0, 1, fi)
    wavfile.write(out_path, SR, (mix.T * 32767).astype(np.int16))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
