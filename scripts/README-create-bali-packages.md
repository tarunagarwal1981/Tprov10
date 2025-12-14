# Create Bali Packages Scripts

This directory contains scripts to create dummy multi-city and multi-city hotel packages for operator@gmail.com.

## Packages Created

1. **Multi-City Packages:**
   - Bali Beach & Culture: Kuta (2 nights) & Ubud (2 nights)
   - Bali Extended Adventure: Kuta (2 nights), Ubud (2 nights) & Legian (2 nights)
   - Bali Cultural Journey: Ubud (3 nights) & Seminyak (2 nights)

2. **Multi-City Hotel Packages:**
   - Bali Beach Hotels: Kuta (2 nights) & Ubud (2 nights)
   - Bali Extended Stay: Kuta (2 nights), Ubud (2 nights) & Legian (2 nights)

All packages include:
- Transport connections between cities (CAR transfers)
- Pricing for multiple people (1-4 adults, with/without children)
- Hotels for hotel packages
- Highlights and activities

## Option 1: Run SQL Script (Direct Database Access)

If you have direct access to your RDS database:

```bash
# Execute the SQL script directly
psql -h <your-rds-endpoint> -U <username> -d <database> -f scripts/create-bali-packages.sql
```

Or if using AWS RDS Data API or similar:
- Copy the contents of `scripts/create-bali-packages.sql`
- Execute it in your database client

**Prerequisites:**
- operator@gmail.com must exist in the `users` table
- User must have `TOUR_OPERATOR` role

## Option 2: Run JavaScript Script (Via AWS Lambda)

If you want to use the Node.js script that uses AWS Lambda:

1. **Set up AWS credentials:**
   ```bash
   export AWS_ACCESS_KEY_ID=your_access_key
   export AWS_SECRET_ACCESS_KEY=your_secret_key
   export AWS_REGION=us-east-1  # or your region
   ```

2. **Or use AWS CLI configure:**
   ```bash
   aws configure
   ```

3. **Run the script:**
   ```bash
   cd /Users/tarun/cursor/Tprov10
   npx ts-node scripts/create-bali-packages-aws.js
   ```

**Prerequisites:**
- AWS credentials configured
- operator@gmail.com must exist in the `users` table
- Node.js and ts-node installed

## Verify Packages Created

After running either script, verify the packages were created:

```sql
-- Check multi-city packages
SELECT id, title, total_nights, total_cities, status 
FROM multi_city_packages 
WHERE operator_id = (SELECT id FROM users WHERE email = 'operator@gmail.com');

-- Check multi-city hotel packages
SELECT id, title, total_nights, total_cities, status 
FROM multi_city_hotel_packages 
WHERE operator_id = (SELECT id FROM users WHERE email = 'operator@gmail.com');

-- Check cities
SELECT p.title, c.name, c.nights, c.city_order
FROM multi_city_packages p
JOIN multi_city_package_cities c ON p.id = c.package_id
WHERE p.operator_id = (SELECT id FROM users WHERE email = 'operator@gmail.com')
ORDER BY p.title, c.city_order;

-- Check transport connections
SELECT p.title, c1.name as from_city, c2.name as to_city, conn.transport_type, conn.provider
FROM multi_city_packages p
JOIN multi_city_package_connections conn ON p.id = conn.package_id
JOIN multi_city_package_cities c1 ON conn.from_city_id = c1.id
JOIN multi_city_package_cities c2 ON conn.to_city_id = c2.id
WHERE p.operator_id = (SELECT id FROM users WHERE email = 'operator@gmail.com');
```
