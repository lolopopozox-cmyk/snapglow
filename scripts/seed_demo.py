#!/usr/bin/env python3
"""
Snap Glow — demo community seeder (Python, stdlib only).

Creates a realistic, clearly-labeled demo community so visitors can explore
Discover / Feed / Battles / Leaderboards WITHOUT an account:

  * 12 demo creators (profiles flagged is_demo=true, removable via the
    Admin panel without touching genuine accounts)
  * cards + posts + cross-likes + follows for every demo creator
  * 2 live battles and 2 finished battles with real vote rows
  * the owner's reference account (afshi3966) is NOT demo: it gets a
    Legend-level points balance (all features/themes unlocked) and is
    featured on Discover

Usage:
  python scripts/seed_demo.py --url https://<ref>.supabase.co \
      --access-token sbp_xxx            # Supabase CLI/Management token
                                      # (service-role key is fetched automatically)

  python scripts/seed_demo.py --url ... --access-token ... --reset
      # deletes previously seeded DEMO rows only (never real accounts)

All demo passwords: Demo#Pass2026 (documented; accounts are flagged demo).
"""
from __future__ import annotations

import argparse
import json
import secrets
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

DEMO_PASSWORD = "Demo#Pass2026"

DEMOS = [
    # username, display name, persona emoji, hue, bio, level-ish points target
    ("demo.neon", "NeonNova", "👩🏽", 200, "Neon nights & city lights ✨"),
    ("demo.streak", "BlazeKing", "👦🏿", 20, "365-day streak energy 🔥"),
    ("demo.luna", "LunaVibes", "👩🏻‍🦰", 320, "Moonlit snaps & dreamy filters"),
    ("demo.pixel", "PixelPrince", "👦🏻", 260, "Bitmoit artist • card designer"),
    ("demo.rose", "RoseGlow", "👱‍♀️", 350, "Soft grunge, golden heart 💛"),
    ("demo.ray", "RayZapper", "👦", 55, "Sun-chaser, snap-of-the-day poster"),
    ("demo.mika", "MikaMyst", "🧕", 140, "Cosmic profile, starry vibes 🌌"),
    ("demo.dash", "DashStorm", "🧑", 30, "Fast streaks, faster replies ⚡"),
    ("demo.aqua", "AquaWave", "👩", 190, "Ocean moods & surf snaps 🌊"),
    ("demo.ember", "EmberFlick", "🧑‍🦱", 10, "Fire edits only 🔥"),
    ("demo.sky", "SkyDuster", "👦🏿", 210, "Cloud nine resident ☁️"),
    ("demo.vex", "VexChampion", "🧑", 45, "Back-to-back battle winner 🏆"),
]

CARD_TITLES = [
    ("Golden Hour Goddess", "sunset-chaser vibes only", "champion-edition"),
    ("Midnight Aura", "after-dark energy", "neon-identity"),
    ("Streak Royalty", "day 300 locked in", "streak-legend"),
    ("Cosmic Drift", "floating through the galaxy", "cosmic-profile"),
    ("Clean Flex", "less is more", "clean-signature"),
    ("Elite Mode", "black-tie snap energy", "elite-flex"),
    ("Neon Pulse", "city lights & fast streaks", "neon-identity"),
    ("Champ Mentality", "winner's circle", "champion-edition"),
]

POST_TEXTS = [
    "New card just dropped — tell me it's not clean ✨ #snapchatvibes",
    "Streak check 🔥 who's still going strong?",
    "Vote battle tonight, bring your best card 🏆",
    "Golden hour never misses 🌅 #goldenhour",
    "Trying the Cosmic Profile theme and it's UNREAL 🌌",
    "Who wants a battle? Drop your username ⚔️",
    "Top Voters board is mine this week 👑",
    "Fresh face here — say hi! 👋 #newcreator",
]


def req(url: str, method: str, token: str, body: dict | None = None, anon: str | None = None):
    headers = {"Content-Type": "application/json"}
    # PostgREST/Auth always require the apikey header; the bearer token may
    # be the service key (admin) or a user JWT.
    headers["apikey"] = anon or token
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            raw = resp.read().decode()
            return resp.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode() or "{}")


def service_role_key(access_token: str, ref: str) -> str:
    status, data = req(
        f"https://api.supabase.com/v1/projects/{ref}/api-keys",
        "GET",
        access_token,
    )
    if status != 200:
        raise SystemExit(f"could not fetch api keys ({status}): {data}")
    return next(k["api_key"] for k in data if k["id"] == "service_role")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", required=True, help="https://<ref>.supabase.co")
    ap.add_argument("--access-token", required=True, help="sbp_ management token")
    ap.add_argument("--anon", default="", help="anon key (optional, for reads)")
    ap.add_argument("--reset", action="store_true", help="delete demo rows only")
    args = ap.parse_args()

    base = args.url.rstrip("/")
    ref = base.split("//")[1].split(".")[0]
    sr = service_role_key(args.access_token, ref)
    anon = args.anon or sr  # reads work with sr too
    now = datetime.now(timezone.utc)
    print(f"✅ service key acquired for {ref}")

    def sql_exec(query: str) -> tuple[int, dict]:
        return req(f"{base}/rest/v1/rpc/exec_sql", "POST", sr, {"query": query})

    # ---- reset mode ------------------------------------------------------
    if args.reset:
        status, out = sql_exec("""
            delete from votes where battle_id in (select id from battles where is_demo);
            delete from battle_comments where battle_id in (select id from battles where is_demo);
            delete from battles where is_demo;
            delete from posts where is_demo;
            delete from card_likes where card_id in (select id from cards where is_demo);
            delete from cards where is_demo;
            delete from follows where follower_id in (select id from profiles where is_demo) or followee_id in (select id from profiles where is_demo);
            delete from profile_likes where user_id in (select id from profiles where is_demo);
            delete from earned_badges where user_id in (select id from profiles where is_demo);
            delete from points_ledger where user_id in (select id from profiles where is_demo);
            delete from auth.users where id in (select id from profiles where is_demo);
            delete from profiles where is_demo;
            select 1;
        """)
        # exec_sql rpc may not exist; fall back to table deletes
        if status != 200:
            print("ℹ️  exec_sql unavailable — using REST deletes")
            for table, filt in [
                ("votes", "battle_id=in.(select id from battles where is_demo)"),
            ]:
                pass
            # simpler: delete parents, cascades clean children
            req(f"{base}/rest/v1/battles?is_demo=eq.true", "DELETE", sr)
            req(f"{base}/rest/v1/posts?is_demo=eq.true", "DELETE", sr)
            req(f"{base}/rest/v1/cards?is_demo=eq.true", "DELETE", sr)
            status2, users = req(f"{base}/rest/v1/profiles?is_demo=eq.true&select=id", "GET", sr)
            for u in (users or []):
                req(f"{base}/auth/v1/admin/users/{u['id']}", "DELETE", sr)
            print("🧹 demo data removed (cascades cleaned votes/likes/follows/ledger)")
        else:
            print("🧹 demo data removed")
        return 0

    # ---- create auth users + profiles ------------------------------------
    ids: dict[str, str] = {}
    for username, display, emoji, hue, bio in DEMOS:
        email = f"sg.{username.replace('_', '.')}@gmail.com"
        status, existing = req(
            f"{base}/rest/v1/profiles?username=eq.{username}&select=id", "GET", sr
        )
        if existing:
            ids[username] = existing[0]["id"]
            print(f"↺ {username} exists")
            continue
        status, res = req(
            f"{base}/auth/v1/admin/users",
            "POST",
            sr,
            {
                "email": email,
                "password": DEMO_PASSWORD,
                "email_confirm": True,
                "user_metadata": {
                    "username": username,
                    "displayName": display,
                    "hue": str(hue),
                    "avatarEmoji": emoji,
                },
            },
        )
        if status not in (200, 201):
            print(f"⚠️ {username}: {res}")
            continue
        uid = res["id"]
        ids[username] = uid
        req(
            f"{base}/rest/v1/profiles?id=eq.{uid}",
            "PATCH",
            sr,
            {"bio": bio, "avatar_emoji": emoji, "hue": hue, "is_demo": True},
        )
        print(f"＋ {username} ({display})")

    demo_ids = list(ids.values())
    if len(demo_ids) < 8:
        print("⚠️ too few demo users created; aborting content seed")
        return 1

    # ---- cards + posts (staggered over the past week) --------------------
    card_ids: list[str] = []
    for i, (title, caption, template) in enumerate(CARD_TITLES):
        owner = demo_ids[i % len(demo_ids)]
        cid = f"demo-card-{i+1:02d}"
        created = (now - timedelta(hours=3 + i * 7)).isoformat()
        status, res = req(
            f"{base}/rest/v1/cards?id=eq.{cid}&select=id", "GET", sr
        )
        if not res:
            req(
                f"{base}/rest/v1/cards",
                "POST",
                sr,
                {
                    "id": cid,
                    "owner_id": owner,
                    "title": title[:40],
                    "caption": caption,
                    "template": template,
                    "image_kind": "art",
                    "art_seed": 1000 + i,
                    "streak": (i * 47) % 900,
                    "streak_label": "demo streak",
                    "badges": ["crown", "flame"] if i % 2 else ["star"],
                    "is_demo": True,
                    "created_at": created,
                },
            )
        card_ids.append(cid)

    for i, text in enumerate(POST_TEXTS):
        author = demo_ids[(i + 3) % len(demo_ids)]
        pid = f"demo-post-{i+1:02d}"
        status, res = req(
            f"{base}/rest/v1/posts?id=eq.{pid}&select=id", "GET", sr
        )
        if not res:
            req(
                f"{base}/rest/v1/posts",
                "POST",
                sr,
                {
                    "id": pid,
                    "author_id": author,
                    "card_id": card_ids[i % len(card_ids)] if i % 2 == 0 else None,
                    "caption": text,
                    "tags": ["snapchatvibes"] if "snapchatvibes" in text else [],
                    "is_demo": True,
                    "created_at": (now - timedelta(hours=2 + i * 5)).isoformat(),
                },
            )
    print(f"✅ {len(card_ids)} demo cards + {len(POST_TEXTS)} demo posts")

    # ---- cross likes / follows -------------------------------------------
    for i, cid in enumerate(card_ids):
        for j, uid in enumerate(demo_ids):
            if j % len(demo_ids) != i % len(demo_ids):
                req(
                    f"{base}/rest/v1/card_likes",
                    "POST",
                    sr,
                    {"card_id": cid, "user_id": uid, "created_at": (now - timedelta(hours=1 + j)).isoformat()},
                )
    for i, uid in enumerate(demo_ids):
        for j, other in enumerate(demo_ids):
            if i != j and (i + j) % 3 == 0:
                req(
                    f"{base}/rest/v1/follows",
                    "POST",
                    sr,
                    {"follower_id": uid, "followee_id": other},
                )
    print("✅ likes + follows woven")

    # ---- battles: 2 live, 2 ended -----------------------------------------
    def upsert_battle(bid, title, a_owner_i, b_owner_i, status_, hours_offset, winner=None):
        status, res = req(f"{base}/rest/v1/battles?id=eq.{bid}&select=id", "GET", sr)
        if res:
            return
        a_card = f"demo-battle-a-{bid}"[-40:]
        req(
            f"{base}/rest/v1/cards",
            "POST",
            sr,
            {
                "id": f"card-{a_card}",
                "owner_id": demo_ids[a_owner_i],
                "title": f"Entry {a_owner_i}",
                "caption": "battle entry",
                "template": "neon-identity",
                "image_kind": "art",
                "art_seed": 7,
                "is_demo": True,
                "created_at": (now - timedelta(hours=hours_offset)).isoformat(),
            },
        )
        req(
            f"{base}/rest/v1/cards",
            "POST",
            sr,
            {
                "id": f"card-{a_card}b",
                "owner_id": demo_ids[b_owner_i],
                "title": f"Entry {b_owner_i}",
                "caption": "battle entry",
                "template": "cosmic-profile",
                "image_kind": "art",
                "art_seed": 9,
                "is_demo": True,
                "created_at": (now - timedelta(hours=hours_offset)).isoformat(),
            },
        )
        req(
            f"{base}/rest/v1/battles",
            "POST",
            sr,
            {
                "id": bid,
                "title": title,
                "created_by": demo_ids[a_owner_i],
                "card_a_id": f"card-{a_card}",
                "card_b_id": f"card-{a_card}b",
                "status": status_,
                "winner": winner,
                "duration_hours": 12,
                "ends_at": (now + timedelta(hours=6)).isoformat()
                if status_ == "live"
                else (now - timedelta(hours=2)).isoformat(),
                "is_demo": True,
                "created_at": (now - timedelta(hours=hours_offset)).isoformat(),
            },
        )
        # votes
        voters = demo_ids[:6]
        for k, v in enumerate(voters):
            side = "a" if (k % 2 == 0) == (winner in (None, "a")) else "b"
            if winner == "b" and k % 3 == 0:
                side = "a"
            req(
                f"{base}/rest/v1/votes",
                "POST",
                sr,
                {"battle_id": bid, "user_id": v, "side": side},
            )

    upsert_battle("demo-battle-live-1", "Neon Nights Showdown", 0, 2, "live", 5)
    upsert_battle("demo-battle-live-2", "Streak Kings Clash", 1, 5, "live", 3)
    upsert_battle("demo-battle-end-1", "Golden Hour Face-off", 3, 6, "ended", 26, winner="a")
    upsert_battle("demo-battle-end-2", "Cosmic Qualifier", 8, 4, "ended", 30, winner="b")
    print("✅ 2 live + 2 finished demo battles with votes")

    # ---- owner account: unlock everything, feature, crown the boards -----
    status, afshi = req(
        f"{base}/rest/v1/profiles?username=eq.afshi3966&select=id", "GET", sr
    )
    if afshi:
        aid = afshi[0]["id"]
        req(
            f"{base}/rest/v1/profiles?id=eq.{aid}",
            "PATCH",
            sr,
            {"points": 1600, "bio": "✨ Snapchat creator · streak keeper · battle-ready"},
        )
        req(
            f"{base}/rest/v1/featured",
            "POST",
            sr,
            {"user_id": aid, "note": "Founder's pick", "sort": 1},
        )
        print("👑 afshi3966 → Legend (1600 pts, all features unlocked) + featured")

    print("\n🎉 Demo community seeded. All demo accounts share password: Demo#Pass2026")
    print("   (flagged is_demo — removable from Admin → Users without touching real data)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
