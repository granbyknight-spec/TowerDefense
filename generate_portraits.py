#!/usr/bin/env python3
"""
generate_portraits.py — Generate anime dog portraits using AI Horde
Run with: python3 generate_portraits.py

Saves images to assets/characters/<ID>_portrait.png
Uses the anonymous AI Horde key (no account required, slower queue).
"""

import urllib.request
import urllib.error
import json
import time
import base64
import os
import sys

BASE_URL = "https://stablehorde.net/api/v2"
API_KEY  = "0000000000"   # anonymous key
OUT_DIR  = os.path.join(os.path.dirname(__file__), "assets", "characters")

# Each entry: (char_id, positive_prompt)
# Negative prompt appended globally for all generations
NEG = "human face, human body, realistic, 3d, ugly, bad anatomy, extra limbs, blurry, text, watermark"

CHARACTERS = [
    (
        "PUPPY_KNIGHT",
        "cute anime golden retriever dog knight paladin, wearing shiny plate armor, sword and shield, "
        "fantasy chibi RPG character portrait, bright warm colors, adorable dog face, determined expression",
    ),
    (
        "CORGI_HEALER",
        "cute anime corgi dog healer priest, wearing white and gold robes, glowing healing staff, "
        "fantasy chibi RPG character portrait, warm soft light, adorable dog face, gentle smile",
    ),
    (
        "LABRADOR_SCOUT",
        "cute anime labrador retriever dog warrior scout, wearing brown leather armor, short sword, "
        "fantasy chibi RPG character portrait, green forest background, adorable dog face, brave expression",
    ),
    (
        "BEAGLE_ARCHER",
        "cute anime beagle dog archer ranger, wearing green hood and cloak, holding a recurve bow, "
        "quiver of arrows on back, fantasy chibi RPG character portrait, adorable dog face, focused expression",
    ),
    (
        "POODLE_MAGE",
        "cute anime poodle dog mage wizard, wearing a tall purple wizard hat, colorful robes, "
        "holding a magic staff with a glowing crystal orb, fantasy chibi RPG character portrait, sparkles, adorable dog face",
    ),
    (
        "BULLDOG_TANK",
        "cute anime bulldog dog tank warrior berserker, wearing heavy plate armor, large tower shield, "
        "fantasy chibi RPG character portrait, sturdy tough stance, adorable bulldog face, fierce expression",
    ),
    (
        "HUSKY_RIDER",
        "cute anime siberian husky dog cavalry knight, wearing blue and silver armor, riding a horse, "
        "fantasy chibi RPG character portrait, blue eyes, adorable husky dog face, noble expression",
    ),
    (
        "TERRIER_THIEF",
        "cute anime terrier dog rogue thief ninja, wearing dark leather armor, dual daggers, "
        "hood and cape, fantasy chibi RPG character portrait, sneaky grin, adorable dog face, shadow background",
    ),
]

HEADERS = {
    "Content-Type": "application/json",
    "apikey": API_KEY,
    "Client-Agent": "puppy-force-generate/1.0",
}


def http_post(url, payload):
    data = json.dumps(payload).encode("utf-8")
    req  = urllib.request.Request(url, data=data, headers=HEADERS, method="POST")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def http_get(url):
    req = urllib.request.Request(url, headers=HEADERS, method="GET")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def http_get_binary(url):
    with urllib.request.urlopen(url, timeout=60) as resp:
        return resp.read()


def submit_job(char_id, prompt):
    payload = {
        "prompt": prompt + " ### " + NEG,
        "params": {
            "sampler_name": "k_euler_a",
            "cfg_scale": 7.5,
            "steps": 30,
            "width": 512,
            "height": 512,
            "n": 1,
            "karras": True,
        },
        "models": ["Anything Diffusion", "Anything V5", "Dreamshaper"],
        "nsfw": False,
        "censor_nsfw": True,
        "r2": True,
        "shared": False,
    }
    try:
        result  = http_post(f"{BASE_URL}/generate/async", payload)
        job_id  = result["id"]
        print(f"  [{char_id}] submitted → job {job_id}")
        return job_id
    except Exception as e:
        print(f"  [{char_id}] submit ERROR: {e}")
        return None


def poll_until_done(job_id, char_id, timeout=600):
    start = time.time()
    while time.time() - start < timeout:
        try:
            data     = http_get(f"{BASE_URL}/generate/check/{job_id}")
            done     = data.get("done", False)
            faulted  = data.get("faulted", False)
            queue    = data.get("queue_position", "?")
            eta      = data.get("wait_time", "?")

            if faulted:
                print(f"\n  [{char_id}] FAULTED (generation failed on worker)")
                return False

            sys.stdout.write(f"\r  [{char_id}] queue={queue}, eta={eta}s …   ")
            sys.stdout.flush()

            if done:
                print(f"\r  [{char_id}] DONE                          ")
                return True

        except Exception as e:
            print(f"\n  [{char_id}] poll error: {e}")

        time.sleep(8)

    print(f"\n  [{char_id}] TIMEOUT after {timeout}s")
    return False


def fetch_and_save(job_id, char_id):
    try:
        data        = http_get(f"{BASE_URL}/generate/status/{job_id}")
        generations = data.get("generations", [])
        if not generations:
            print(f"  [{char_id}] no generations returned")
            return False

        gen = generations[0]
        img = gen.get("img", "")
        if not img:
            print(f"  [{char_id}] empty img field")
            return False

        if img.startswith("http"):
            # R2 pre-signed URL
            img_data = http_get_binary(img)
        else:
            # Base64
            img_data = base64.b64decode(img)

        out_path = os.path.join(OUT_DIR, f"{char_id}_portrait.png")
        with open(out_path, "wb") as f:
            f.write(img_data)
        print(f"  [{char_id}] saved → {out_path}")
        return True

    except Exception as e:
        print(f"  [{char_id}] fetch ERROR: {e}")
        return False


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    # Filter out already-generated portraits
    to_generate = []
    for char_id, prompt in CHARACTERS:
        out_path = os.path.join(OUT_DIR, f"{char_id}_portrait.png")
        if os.path.exists(out_path):
            print(f"  SKIP {char_id} (portrait already exists)")
        else:
            to_generate.append((char_id, prompt))

    if not to_generate:
        print("All portraits already exist — nothing to do.")
        return

    print(f"\nSubmitting {len(to_generate)} generation jobs to AI Horde...")
    jobs = []
    for char_id, prompt in to_generate:
        job_id = submit_job(char_id, prompt)
        if job_id:
            jobs.append((job_id, char_id))
        time.sleep(1.5)   # small delay between submissions to avoid rate-limits

    print(f"\nWaiting for {len(jobs)} jobs to complete (anonymous queue can be slow)...\n")
    failed = []
    for job_id, char_id in jobs:
        if poll_until_done(job_id, char_id):
            if not fetch_and_save(job_id, char_id):
                failed.append(char_id)
        else:
            failed.append(char_id)

    print("\n" + "="*50)
    succeeded = len(jobs) - len(failed)
    print(f"Done: {succeeded}/{len(jobs)} portraits generated successfully.")
    if failed:
        print(f"Failed: {', '.join(failed)}")
        print("Re-run the script to retry failed characters.")
    else:
        print("All portraits saved to assets/characters/")


if __name__ == "__main__":
    main()
