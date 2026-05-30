    import datetime
    from sqlalchemy.orm import Session
    from backend.database import SessionLocal, Base, engine
    from backend.models import User, RoadSegment, Permit, Clash, Complaint
    from backend.auth import get_password_hash
    from backend.clash_engine import check_clash_for_permit

    def seed_data():
        # Ensure tables are created
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        
        # 1. Clean existing records
        print("Cleaning database...")
        db.query(Clash).delete()
        db.query(Complaint).delete()
        db.query(Permit).delete()
        db.query(RoadSegment).delete()
        db.query(User).delete()
        db.commit()

        # 2. Seed Users
        print("Seeding users...")
        users = [
            User(
                username="admin",
                email="admin@ghmc.gov.in",
                hashed_password=get_password_hash("admin123"),
                role="ADMIN",
                agency_name="GHMC"
            ),
            User(
                username="tsspdcl",
                email="permits@tsspdcl.in",
                hashed_password=get_password_hash("tsspdcl123"),
                role="UTILITY",
                agency_name="TSSPDCL"
            ),
            User(
                username="hmwssb",
                email="excavations@hmwssb.gov.in",
                hashed_password=get_password_hash("hmwssb123"),
                role="UTILITY",
                agency_name="HMWSSB"
            ),
            User(
                username="airtel",
                email="fiber.ops@airtel.com",
                hashed_password=get_password_hash("airtel123"),
                role="UTILITY",
                agency_name="Airtel"
            ),
            User(
                username="bsnl",
                email="projects@bsnl.co.in",
                hashed_password=get_password_hash("bsnl123"),
                role="UTILITY",
                agency_name="BSNL"
            ),
            User(
                username="citizen",
                email="lokesh.citizen@gmail.com",
                hashed_password=get_password_hash("citizen123"),
                role="CITIZEN",
                agency_name="Citizen"
            )
        ]
        
        for u in users:
            db.add(u)
        db.commit()
        
        # Reload users to get IDs
        user_map = {u.username: u for u in db.query(User).all()}

        # 3. Seed Protected Road Segments (Recently Resurfaced Roads)
        print("Seeding protected road segments...")
        roads = [
            RoadSegment(
                name="Gachibowli Outer Ring Road Link",
                wkt_geometry="LINESTRING(78.3468 17.4435, 78.3582 17.4478)",
                last_resurfaced_date=datetime.date(2025, 11, 15)  # Lock-in till Nov 2027
            ),
            RoadSegment(
                name="Jubilee Hills Road No. 36",
                wkt_geometry="LINESTRING(78.4068 17.4320, 78.4182 17.4320)",
                last_resurfaced_date=datetime.date(2026, 2, 20)  # Lock-in till Feb 2028
            ),
            RoadSegment(
                name="Madhapur Hitec City Main Road",
                wkt_geometry="LINESTRING(78.3800 17.4485, 78.3860 17.4485)",
                last_resurfaced_date=datetime.date(2024, 4, 1)  # Lock-in ended April 2026
            )
        ]
        for r in roads:
            db.add(r)
        db.commit()

        # 4. Seed Road Excavation Permits
        print("Seeding permits...")
        
        # 4.1 TSSPDCL Approved Grid (Baseline)
        p_tsspdcl = Permit(
            title="Gachibowli Grid Underground Power Cable Laying",
            description="Laying 11KV underground feeder cables to improve power stability across Gachibowli IT corridor.",
            utility_id=user_map["tsspdcl"].id,
            agency_name="TSSPDCL",
            status="APPROVED",
            wkt_geometry="LINESTRING(78.3480 17.4440, 78.3530 17.4455)",
            depth_meters=0.8,
            work_type="POWER",
            start_date=datetime.date(2026, 6, 1),
            end_date=datetime.date(2026, 6, 15)
        )
        db.add(p_tsspdcl)
        db.commit()
        db.refresh(p_tsspdcl)

        # 4.2 HMWSSB Pipe laying (This will clash with TSSPDCL)
        p_hmwssb = Permit(
            title="Gachibowli Water Trunk Line Refurbishing",
            description="Laying modern HMWSSB water trunk supply grids to accommodate high-rise demand.",
            utility_id=user_map["hmwssb"].id,
            agency_name="HMWSSB",
            status="SUBMITTED", # We submit it so clash engine detects it
            wkt_geometry="LINESTRING(78.3490 17.4442, 78.3525 17.4452)", # Very close to TSSPDCL line!
            depth_meters=0.9, # Depth conflict!
            work_type="WATER",
            start_date=datetime.date(2026, 6, 5), # Date overlap!
            end_date=datetime.date(2026, 6, 25)
        )
        db.add(p_hmwssb)
        db.commit()
        db.refresh(p_hmwssb)

        # 4.3 Airtel Fiber Madhapur (Ongoing - Citizen will complain)
        p_airtel = Permit(
            title="Madhapur 5G FTTH Fiber Deployment",
            description="Micro-trenching along Hitec City road for rapid high-speed fiber expansions.",
            utility_id=user_map["airtel"].id,
            agency_name="Airtel",
            status="IN_PROGRESS",
            wkt_geometry="LINESTRING(78.3802 17.4486, 78.3848 17.4486)",
            depth_meters=0.5,
            work_type="TELECOM",
            start_date=datetime.date(2026, 5, 10),
            end_date=datetime.date(2026, 6, 10)
        )
        db.add(p_airtel)
        db.commit()
        db.refresh(p_airtel)

        # 4.4 BSNL Completed Road Work
        p_bsnl = Permit(
            title="Begumpet Central Exchange Link Upgrades",
            description="Upgraded legacy copper core to fiber-ring lines for defense and central exchange operations.",
            utility_id=user_map["bsnl"].id,
            agency_name="BSNL",
            status="COMPLETED",
            wkt_geometry="LINESTRING(78.4720 17.4380, 78.4750 17.4400)",
            depth_meters=0.6,
            work_type="TELECOM",
            start_date=datetime.date(2026, 4, 1),
            end_date=datetime.date(2026, 4, 20)
        )
        db.add(p_bsnl)
        db.commit()
        db.refresh(p_bsnl)

        # 4.5 Emergency work (This ignores resurfacing lock, but shows as pending review)
        p_emergency = Permit(
            title="Emergency HMWSSB Sewerage Pipeline Burst Repair",
            description="URGENT: Main sewer line leakage reported near Gachibowli junction. Requires immediate road cutting.",
            utility_id=user_map["hmwssb"].id,
            agency_name="HMWSSB",
            status="EMERGENCY",
            wkt_geometry="LINESTRING(78.3550 17.4460, 78.3570 17.4468)",
            depth_meters=2.2,
            work_type="EMERGENCY",
            start_date=datetime.date(2026, 5, 29),
            end_date=datetime.date(2026, 6, 4)
        )
        db.add(p_emergency)
        db.commit()
        db.refresh(p_emergency)

        # 4.6 Lock-in Violator permit (Submitted permit that digs a locked road - Jubilee Hills Road No. 36)
        p_violator = Permit(
            title="HMWSSB Secondary Water pipe line - Road 36 Jubilee Hills",
            description="Laying utility pipes for commercial complexes on road 36.",
            utility_id=user_map["hmwssb"].id,
            agency_name="HMWSSB",
            status="SUBMITTED",
            wkt_geometry="LINESTRING(78.4090 17.4320, 78.4140 17.4320)", # Digs on Road 36 Jubilee Hills!
            depth_meters=0.7,
            work_type="WATER",
            start_date=datetime.date(2026, 7, 1),
            end_date=datetime.date(2026, 7, 15)
        )
        db.add(p_violator)
        db.commit()
        db.refresh(p_violator)

        # 5. Run Clash engine to populate Clash tables automatically!
        print("Running clash engine on submitted permits...")
        for p in [p_hmwssb, p_violator]:
            clash_exists, clashes = check_clash_for_permit(p, db)
            if clash_exists:
                p.status = "CLASH_DETECTED"
                for c in clashes:
                    db.add(c)
                db.commit()
                print(f"-> Clash detected for {p.agency_name} permit '{p.title}': {len(clashes)} conflicts saved.")
                
        # 6. Seed Citizen Complaints
        print("Seeding complaints...")
        complaints = [
            # Complaint linked with Airtel's active excavation (Madhapur)
            Complaint(
                citizen_name="Siddharth Rao",
                complaint_type="OPEN_TRENCH",
                description="Airtel has dug up the footpath next to the Hitec City metro pillar 42. It has been open for 4 days with absolutely no caution tapes or barricades. Highly hazardous at night!",
                latitude=17.4486,
                longitude=78.3820,
                photo_url="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80",
                status="ASSIGNED",
                permit_id=p_airtel.id,
                agency_assigned="Airtel"
            ),
            # Unassigned / open complaint
            Complaint(
                citizen_name="Harsha Vardhan",
                complaint_type="UNSAFE_BARRICADING",
                description="Excavation barricades collapsed into the main carriage way at Gachibowli ORR junction, narrowing traffic into a single lane. Very high accident risk.",
                latitude=17.4442,
                longitude=78.3495,
                photo_url="https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=600&q=80",
                status="ASSIGNED",
                permit_id=p_hmwssb.id,
                agency_assigned="HMWSSB"
            ),
            # Completed / Resolved complaint
            Complaint(
                citizen_name="Deepa Reddy",
                complaint_type="ROAD_NOT_RESTORED",
                description="Broadband work finished three weeks ago near Begumpet public school, but the gravel layer is not tarred. The dust is terrible and scooters are slipping.",
                latitude=17.4390,
                longitude=78.4735,
                photo_url="https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80",
                status="RESOLVED",
                permit_id=p_bsnl.id,
                agency_assigned="BSNL"
            ),
            # Water Leakage (Assigned to HMWSSB near Jubilee Hills)
            Complaint(
                citizen_name="Kiran Kumar",
                complaint_type="WATER_LEAKAGE",
                description="Huge water leakage bubbling up from the middle of the road. Thousands of liters of drinking water being wasted daily.",
                latitude=17.4320,
                longitude=78.4110,
                photo_url="https://images.unsplash.com/photo-1542013936693-8848e5740a7a?auto=format&fit=crop&w=600&q=80",
                status="OPEN",
                agency_assigned="HMWSSB"
            )
        ]
        
        for c in complaints:
            db.add(c)
        db.commit()
        
        print("Database seeding completed successfully!")
        db.close()

    if __name__ == "__main__":
        seed_data()
