@echo off
cd /d "d:\link call"
git add admin.html admin.js api/companies.js fix-name.js
git commit -m "feat: company profile edit + fix updateCompany + balance system"
git push
echo DONE
