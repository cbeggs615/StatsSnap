import json
import pandas as pd
from nba_api.stats.endpoints import leaguestandingsv3

def fetch_nba_team_standings(season="2025-26"):
    print(f"📡 Fetching NBA standings for {season}...")

    # --- 1️⃣ Fetch official standings ---
    standings = leaguestandingsv3.LeagueStandingsV3(season=season).get_data_frames()[0]
    print(f"📋 Columns available: {list(standings.columns)}\n")

    # --- 2️⃣ Normalize team ID column ---
    if "TeamID" in standings.columns:
        standings = standings.rename(columns={"TeamID": "TEAM_ID"})
    elif "TEAM_ID" not in standings.columns:
        raise ValueError("❌ TEAM_ID or TeamID not found in standings columns")

    # --- 3️⃣ Select key columns ---
    cols = [
        "TEAM_ID", "TeamCity", "TeamName", "Conference", "Division",
        "WINS", "LOSSES", "WinPCT", "PointsPG", "OppPointsPG", "DiffPointsPG"
    ]
    available_cols = [c for c in cols if c in standings.columns]
    df = standings[available_cols].copy()

    # --- 5️⃣ Rename for clarity ---
    df = df.rename(columns={
        "TeamCity": "team_city",
        "TeamName": "team_name",
        "Conference": "conference",
        "Division": "division",
        "WINS": "wins",
        "LOSSES": "losses",
        "WinPCT": "win_pct",
        "PointsPG": "points_per_game",
        "OppPointsPG": "opp_points_per_game",
        "DiffPointsPG": "diff_points_pg",
    })

    # --- 6️⃣ Sort + clean ---
    df = df[df["points_per_game"].between(80, 140)]  # filter outliers just in case

    # --- 7️⃣ Display summary ---
    print(f"✅ Retrieved {len(df)} NBA teams for {season}.")
    print(df.head(5).to_string(index=False))

    df["full_name"] = df["team_city"] + " " + df["team_name"]
    df["team_id"] = df["TEAM_ID"]

    # after df is created
    df.to_json("nba_team_stats.json", orient="records", indent=2)
    print("💾 Saved JSON output to nba_team_stats.json")
    return df


if __name__ == "__main__":
    fetch_nba_team_standings()
