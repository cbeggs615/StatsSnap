from nba_api.stats.static import teams
import json

# src/integrations/nba/import_nba_teams.py
from nba_api.stats.static import teams
import json

def import_nba_teams():
    print("🚀 Fetching NBA teams...")
    all_teams = teams.get_teams()  # list of dicts with full_name, id, etc.

    simplified = [
        {
            "id": t["id"],
            "abbreviation": t["abbreviation"],
            "city": t["city"],
            "name": t["full_name"]
        }
        for t in all_teams
    ]

    print(f"✅ Loaded {len(simplified)} NBA teams.")
    with open("nba_teams.json", "w") as f:
        json.dump(simplified, f, indent=2)

if __name__ == "__main__":
    import_nba_teams()
