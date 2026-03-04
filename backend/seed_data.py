"""
UCHAGUZI SAFI — Seed Data Script
==================================
Populates the database with realistic Kenya-specific demo data
for hackathon demonstration purposes.

Run from backend directory:
    python seed_data.py

Legal basis: All data reflects ECF Act Cap. 7A (2013) structures.
"""

import asyncio
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.core.config import get_settings

def d(s):
    """Convert 'YYYY-MM-DD' string to Python date object."""
    y, m, day = s.split("-")
    return date(int(y), int(m), int(day))

settings = get_settings()

engine = create_async_engine(settings.database_url, echo=False)
SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


async def seed():
    async with SessionLocal() as db:
        # Check if data already exists
        result = await db.execute(text("SELECT COUNT(*) FROM political_parties"))
        count = result.scalar()
        if count > 0:
            print("Database already has data. Skipping seed.")
            return

        print("Seeding Uchaguzi Safi database...")

        # ── Political Parties ────────────────────────────────────
        parties = [
            {"id": str(uuid.uuid4()), "name": "United Democratic Alliance", "abbreviation": "UDA",
             "registration_number": "PP/2021/001", "is_active": True, "founded_date": d("2021-01-15"),
             "headquarters": "Nairobi, Hustler Centre", "contact_email": "info@uda.co.ke",
             "description": "Kenya Kwanza coalition lead party"},
            {"id": str(uuid.uuid4()), "name": "Orange Democratic Movement", "abbreviation": "ODM",
             "registration_number": "PP/2007/002", "is_active": True, "founded_date": d("2007-08-25"),
             "headquarters": "Nairobi, Orange House", "contact_email": "info@odm.co.ke",
             "description": "Azimio la Umoja coalition lead party"},
            {"id": str(uuid.uuid4()), "name": "Amani National Congress", "abbreviation": "ANC",
             "registration_number": "PP/2015/003", "is_active": True, "founded_date": d("2015-06-10"),
             "headquarters": "Nairobi", "contact_email": "info@anc.co.ke",
             "description": "Founded by Musalia Mudavadi"},
            {"id": str(uuid.uuid4()), "name": "Wiper Democratic Movement", "abbreviation": "WDM",
             "registration_number": "PP/2008/004", "is_active": True, "founded_date": d("2008-11-30"),
             "headquarters": "Nairobi", "contact_email": "info@wiper.co.ke",
             "description": "Founded by Kalonzo Musyoka"},
            {"id": str(uuid.uuid4()), "name": "Jubilee Party", "abbreviation": "JP",
             "registration_number": "PP/2016/005", "is_active": True, "founded_date": d("2016-09-08"),
             "headquarters": "Nairobi, Pangani", "contact_email": "info@jubilee.co.ke",
             "description": "Former ruling party"},
            {"id": str(uuid.uuid4()), "name": "Ford Kenya", "abbreviation": "FK",
             "registration_number": "PP/1992/006", "is_active": True, "founded_date": d("1992-01-01"),
             "headquarters": "Nairobi", "contact_email": "info@fordkenya.co.ke",
             "description": "One of Kenya's oldest opposition parties"},
        ]

        for p in parties:
            await db.execute(text("""
                INSERT INTO political_parties (id, name, abbreviation, registration_number, 
                    is_active, founded_date, headquarters, contact_email, description)
                VALUES (:id, :name, :abbreviation, :registration_number, 
                    :is_active, :founded_date, :headquarters, :contact_email, :description)
            """), p)

        print(f"  Created {len(parties)} political parties")

        # ── Candidates ───────────────────────────────────────────
        candidates = [
            {"id": str(uuid.uuid4()), "full_name": "Amina Ochieng", "party_id": parties[0]["id"],
             "is_independent": False, "election_type": "GOVERNOR", "county": "Nairobi",
             "constituency": None, "spending_limit": 449000000, "total_contributions": 285000000,
             "total_expenditure": 198000000, "status": "ACTIVE",
             "bio": "Former Senator with 12 years of public service experience."},
            {"id": str(uuid.uuid4()), "full_name": "James Mwangi Kariuki", "party_id": parties[1]["id"],
             "is_independent": False, "election_type": "GOVERNOR", "county": "Kiambu",
             "constituency": None, "spending_limit": 401000000, "total_contributions": 350000000,
             "total_expenditure": 380000000, "status": "ACTIVE",
             "bio": "Businessperson and former MCA for Ruiru ward."},
            {"id": str(uuid.uuid4()), "full_name": "Fatuma Hassan Ali", "party_id": parties[0]["id"],
             "is_independent": False, "election_type": "SENATOR", "county": "Mombasa",
             "constituency": None, "spending_limit": 200000000, "total_contributions": 145000000,
             "total_expenditure": 132000000, "status": "ACTIVE",
             "bio": "Human rights lawyer and gender equality advocate."},
            {"id": str(uuid.uuid4()), "full_name": "Peter Omondi Otieno", "party_id": parties[1]["id"],
             "is_independent": False, "election_type": "MP", "county": "Kisumu",
             "constituency": "Kisumu Central", "spending_limit": 50000000, "total_contributions": 38000000,
             "total_expenditure": 35000000, "status": "ACTIVE",
             "bio": "Community organiser and former teacher."},
            {"id": str(uuid.uuid4()), "full_name": "Grace Wanjiku Ndung'u", "party_id": parties[2]["id"],
             "is_independent": False, "election_type": "WOMEN_REP", "county": "Nakuru",
             "constituency": None, "spending_limit": 150000000, "total_contributions": 98000000,
             "total_expenditure": 87000000, "status": "ACTIVE",
             "bio": "Agricultural economist and cooperative leader."},
            {"id": str(uuid.uuid4()), "full_name": "Hassan Mohamed Yusuf", "party_id": None,
             "is_independent": True, "election_type": "GOVERNOR", "county": "Garissa",
             "constituency": None, "spending_limit": 250000000, "total_contributions": 120000000,
             "total_expenditure": 95000000, "status": "ACTIVE",
             "bio": "Independent candidate. Former county commissioner."},
            {"id": str(uuid.uuid4()), "full_name": "Mary Chebet Kosgei", "party_id": parties[0]["id"],
             "is_independent": False, "election_type": "GOVERNOR", "county": "Uasin Gishu",
             "constituency": None, "spending_limit": 350000000, "total_contributions": 220000000,
             "total_expenditure": 195000000, "status": "ACTIVE",
             "bio": "Former athletics champion turned politician."},
            {"id": str(uuid.uuid4()), "full_name": "David Kipchoge Mutai", "party_id": parties[3]["id"],
             "is_independent": False, "election_type": "SENATOR", "county": "Nairobi",
             "constituency": None, "spending_limit": 200000000, "total_contributions": 165000000,
             "total_expenditure": 152000000, "status": "ACTIVE",
             "bio": "Corporate lawyer and former Law Society of Kenya council member."},
            {"id": str(uuid.uuid4()), "full_name": "Sarah Akinyi Owuor", "party_id": parties[4]["id"],
             "is_independent": False, "election_type": "MP", "county": "Siaya",
             "constituency": "Bondo", "spending_limit": 45000000, "total_contributions": 28000000,
             "total_expenditure": 24000000, "status": "ACTIVE",
             "bio": "Medical doctor and community health advocate."},
            {"id": str(uuid.uuid4()), "full_name": "Joseph Kimani Njoroge", "party_id": parties[0]["id"],
             "is_independent": False, "election_type": "GOVERNOR", "county": "Nyeri",
             "constituency": None, "spending_limit": 300000000, "total_contributions": 180000000,
             "total_expenditure": 310000000, "status": "ACTIVE",
             "bio": "Tea farmer and former county assembly speaker. SPENDING LIMIT EXCEEDED."},
        ]

        for c in candidates:
            await db.execute(text("""
                INSERT INTO candidates (id, full_name, party_id, is_independent, election_type,
                    county, constituency, spending_limit, total_contributions, total_expenditure,
                    status, bio)
                VALUES (:id, :full_name, :party_id, :is_independent, :election_type,
                    :county, :constituency, :spending_limit, :total_contributions, :total_expenditure,
                    :status, :bio)
            """), c)

        print(f"  Created {len(candidates)} candidates")

        # ── Contributions (sample for first 3 candidates) ────────
        contrib_data = [
            # Amina Ochieng — Nairobi Governor
            (candidates[0]["id"], 15000000, "INDIVIDUAL", "John Kamau", d("2027-06-01"), False),
            (candidates[0]["id"], 50000000, "CORPORATE", "Safaricom Foundation", d("2027-06-05"), False),
            (candidates[0]["id"], 80000000, "POLITICAL_PARTY", "UDA Party", d("2027-06-10"), False),
            (candidates[0]["id"], 25000000, "HARAMBEE", None, d("2027-06-15"), False),
            (candidates[0]["id"], 5000000, "INDIVIDUAL", None, d("2027-06-20"), True),  # Anonymous!
            (candidates[0]["id"], 110000000, "SELF_FUNDING", "Amina Ochieng", d("2027-05-28"), False),
            # James Mwangi — Kiambu Governor (over spending limit!)
            (candidates[1]["id"], 100000000, "SELF_FUNDING", "James Mwangi Kariuki", d("2027-05-25"), False),
            (candidates[1]["id"], 75000000, "CORPORATE", "Equity Group Holdings", d("2027-06-01"), False),
            (candidates[1]["id"], 80000000, "CORPORATE", "Thika Industries Ltd", d("2027-06-08"), False),
            (candidates[1]["id"], 45000000, "INDIVIDUAL", "Mary Wambui", d("2027-06-12"), False),
            (candidates[1]["id"], 50000000, "HARAMBEE", None, d("2027-06-18"), False),
            # Fatuma Hassan — Mombasa Senator
            (candidates[2]["id"], 60000000, "POLITICAL_PARTY", "UDA Party", d("2027-06-02"), False),
            (candidates[2]["id"], 35000000, "INDIVIDUAL", "Ali Hassan", d("2027-06-07"), False),
            (candidates[2]["id"], 30000000, "SELF_FUNDING", "Fatuma Hassan Ali", d("2027-06-10"), False),
            (candidates[2]["id"], 20000000, "CORPORATE", "Mombasa Port Authority Staff Sacco", d("2027-06-15"), False),
        ]

        for cid, amount, source, name, dt, anon in contrib_data:
            await db.execute(text("""
                INSERT INTO contributions (id, candidate_id, amount, source_type, contributor_name,
                    date_received, is_anonymous)
                VALUES (:id, :cid, :amount, :source, :name, :dt, :anon)
            """), {"id": str(uuid.uuid4()), "cid": cid, "amount": amount, "source": source,
                   "name": name, "dt": dt, "anon": anon})

        print(f"  Created {len(contrib_data)} contributions")

        # ── Expenditures (sample for first 3 candidates) ─────────
        expend_data = [
            # Amina Ochieng
            (candidates[0]["id"], 45000000, "ADVERTISING", "TV and radio ads — NTV, Citizen", d("2027-06-10")),
            (candidates[0]["id"], 30000000, "TRANSPORT", "Campaign buses and fuel", d("2027-06-12")),
            (candidates[0]["id"], 55000000, "VENUE", "Rally venues across Nairobi", d("2027-06-15")),
            (candidates[0]["id"], 38000000, "PERSONNEL", "Campaign staff salaries", d("2027-06-18")),
            (candidates[0]["id"], 20000000, "PUBLICITY", "Posters, flyers, branded merchandise", d("2027-06-20")),
            (candidates[0]["id"], 10000000, "OTHER", "Catering for campaign events", d("2027-06-22")),
            # James Mwangi — over limit!
            (candidates[1]["id"], 120000000, "ADVERTISING", "Billboards and digital media", d("2027-06-05")),
            (candidates[1]["id"], 85000000, "VENUE", "Mega rallies across Kiambu", d("2027-06-10")),
            (candidates[1]["id"], 95000000, "PERSONNEL", "Campaign team of 200+", d("2027-06-14")),
            (candidates[1]["id"], 80000000, "TRANSPORT", "Helicopters and branded vehicles", d("2027-06-18")),
            # Fatuma Hassan
            (candidates[2]["id"], 50000000, "ADVERTISING", "Swahili radio stations — Mombasa", d("2027-06-08")),
            (candidates[2]["id"], 42000000, "VENUE", "Coastal town hall meetings", d("2027-06-12")),
            (candidates[2]["id"], 40000000, "PUBLICITY", "Branded khanga and campaign materials", d("2027-06-16")),
        ]

        for cid, amount, cat, desc, dt in expend_data:
            await db.execute(text("""
                INSERT INTO expenditures (id, candidate_id, amount, category, description, date_incurred)
                VALUES (:id, :cid, :amount, :cat, :desc, :dt)
            """), {"id": str(uuid.uuid4()), "cid": cid, "amount": amount, "cat": cat,
                   "desc": desc, "dt": dt})

        print(f"  Created {len(expend_data)} expenditures")

        # ── Incidents ────────────────────────────────────────────
        incidents = [
            {"id": str(uuid.uuid4()), "tracking_number": "UCH-2027-0001",
             "incident_type": "VEHICLE_EQUIPMENT", "title": "County government vehicles used for campaign rally",
             "description": "Three Nairobi County branded vehicles spotted at a UDA campaign rally in Kibra on June 15, 2027. Vehicles had county logos partially covered with campaign stickers.",
             "date_occurred": d("2027-06-15"), "county": "Nairobi", "constituency": "Kibra",
             "location_lat": -1.3133, "location_lng": 36.7876,
             "candidate_id": candidates[0]["id"], "party_id": parties[0]["id"],
             "status": "VERIFIED", "is_anonymous": False,
             "reporter_name": "Wanyama Simiyu", "reporter_phone": "+254712345678"},
            {"id": str(uuid.uuid4()), "tracking_number": "UCH-2027-0002",
             "incident_type": "STATE_FUNDS", "title": "CDF funds allegedly used for campaign activities",
             "description": "Reports of Constituency Development Fund money being used to purchase campaign materials in Kiambu Town constituency. Receipts allegedly show payments to a printing company for campaign posters.",
             "date_occurred": d("2027-06-18"), "county": "Kiambu", "constituency": "Kiambu Town",
             "location_lat": -1.1714, "location_lng": 36.8356,
             "candidate_id": candidates[1]["id"], "party_id": parties[1]["id"],
             "status": "UNDER_REVIEW", "is_anonymous": True,
             "reporter_name": None, "reporter_phone": None},
            {"id": str(uuid.uuid4()), "tracking_number": "UCH-2027-0003",
             "incident_type": "PREMISES", "title": "Chief's camp used as campaign headquarters",
             "description": "The assistant chief's office in Likoni is being used as a campaign coordination centre. Campaign posters are displayed inside the government building.",
             "date_occurred": d("2027-06-20"), "county": "Mombasa", "constituency": "Likoni",
             "location_lat": -4.0833, "location_lng": 39.6500,
             "candidate_id": candidates[2]["id"], "party_id": parties[0]["id"],
             "status": "SUBMITTED", "is_anonymous": False,
             "reporter_name": "Halima Bakari", "reporter_phone": "+254798765432"},
            {"id": str(uuid.uuid4()), "tracking_number": "UCH-2027-0004",
             "incident_type": "PERSONNEL", "title": "County staff deployed for voter mobilisation",
             "description": "Multiple county government employees in Uasin Gishu observed going door-to-door during working hours distributing campaign flyers for a gubernatorial candidate.",
             "date_occurred": d("2027-06-22"), "county": "Uasin Gishu", "constituency": "Ainabkoi",
             "location_lat": 0.5143, "location_lng": 35.2698,
             "candidate_id": candidates[6]["id"], "party_id": parties[0]["id"],
             "status": "ESCALATED", "is_anonymous": False,
             "reporter_name": "Kipkorir Sang", "reporter_phone": "+254723456789"},
        ]

        for inc in incidents:
            await db.execute(text("""
                INSERT INTO incidents (id, tracking_number, incident_type, title, description,
                    date_occurred, county, constituency, location_lat, location_lng,
                    candidate_id, party_id, status, is_anonymous, reporter_name, reporter_phone)
                VALUES (:id, :tracking_number, :incident_type, :title, :description,
                    :date_occurred, :county, :constituency, :location_lat, :location_lng,
                    :candidate_id, :party_id, :status, :is_anonymous, :reporter_name, :reporter_phone)
            """), inc)

        print(f"  Created {len(incidents)} incidents")

        # ── Spending Limits ──────────────────────────────────────
        limits = [
            ("PRESIDENTIAL", None, None, 15000000000, d("2027-01-15"), "KGN Vol. CXXIX No. 3"),
            ("GOVERNOR", "Nairobi", None, 449000000, d("2027-01-15"), "KGN Vol. CXXIX No. 3"),
            ("GOVERNOR", "Kiambu", None, 401000000, d("2027-01-15"), "KGN Vol. CXXIX No. 3"),
            ("GOVERNOR", "Mombasa", None, 350000000, d("2027-01-15"), "KGN Vol. CXXIX No. 3"),
            ("GOVERNOR", "Uasin Gishu", None, 350000000, d("2027-01-15"), "KGN Vol. CXXIX No. 3"),
            ("GOVERNOR", "Nyeri", None, 300000000, d("2027-01-15"), "KGN Vol. CXXIX No. 3"),
            ("GOVERNOR", "Garissa", None, 250000000, d("2027-01-15"), "KGN Vol. CXXIX No. 3"),
            ("SENATOR", "Nairobi", None, 200000000, d("2027-01-15"), "KGN Vol. CXXIX No. 3"),
            ("SENATOR", "Mombasa", None, 200000000, d("2027-01-15"), "KGN Vol. CXXIX No. 3"),
            ("WOMEN_REP", "Nakuru", None, 150000000, d("2027-01-15"), "KGN Vol. CXXIX No. 3"),
            ("MP", "Kisumu", "Kisumu Central", 50000000, d("2027-01-15"), "KGN Vol. CXXIX No. 3"),
            ("MP", "Siaya", "Bondo", 45000000, d("2027-01-15"), "KGN Vol. CXXIX No. 3"),
        ]

        for et, county, const, amount, gdate, gref in limits:
            await db.execute(text("""
                INSERT INTO spending_limits (id, election_type, county, constituency, amount,
                    gazetted_date, gazette_reference, is_current)
                VALUES (:id, :et, :county, :const, :amount, :gdate, :gref, true)
            """), {"id": str(uuid.uuid4()), "et": et, "county": county, "const": const,
                   "amount": amount, "gdate": gdate, "gref": gref})

        print(f"  Created {len(limits)} spending limits")

        await db.commit()
        print("\nSeed complete! Uchaguzi Safi database populated.")
        print("  Candidates over spending limit: James Mwangi (Kiambu), Joseph Kimani (Nyeri)")
        print("  Anonymous contribution flagged: Amina Ochieng (Nairobi)")
        print("  Incidents across 4 counties: Nairobi, Kiambu, Mombasa, Uasin Gishu")


if __name__ == "__main__":
    asyncio.run(seed())
