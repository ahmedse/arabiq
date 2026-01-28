#!/bin/bash
echo "======================================"
echo "  ARABIQ CONTENT AUDIT"
echo "======================================"
echo ""
echo "Checking all content tables..."
echo ""

cd /home/ahmed/arabiq-1/apps/cms

for table in homepages stats features solutions industries case_studies demos nav_items trusted_companies process_steps about_pages contact_pages site_settings; do
  count=$(PGPASSWORD=arabiq psql -U arabiq -h 127.0.0.1 -d arabiq -t -c "SELECT COUNT(*) FROM $table" 2>/dev/null | tr -d ' ')
  printf "%-20s %s\n" "$table:" "$count"
done

echo ""
echo "======================================"
echo "Content Audit Complete!"
echo "======================================"
