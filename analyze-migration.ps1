# Frontend Migration Helper Script
# This script helps identify files that need to be updated for the domain-driven architecture

Write-Host "🔍 Frontend API Migration Analysis" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Get the frontend src directory
$srcDir = "c:\Users\bella\Documents\gestion\frontend\src"

if (-not (Test-Path $srcDir)) {
    Write-Host "❌ Frontend src directory not found: $srcDir" -ForegroundColor Red
    exit 1
}

Write-Host "📂 Analyzing directory: $srcDir" -ForegroundColor Green
Write-Host ""

# Function to count occurrences
function Count-Matches {
    param($path, $pattern)
    $matches = Select-String -Path $path -Pattern $pattern -AllMatches
    return ($matches | Measure-Object).Count
}

# 1. Find files importing from old api.ts
Write-Host "1️⃣  Files importing from OLD api.ts:" -ForegroundColor Yellow
Write-Host "   (Need to update to domain-specific APIs)" -ForegroundColor Gray
$oldApiImports = Get-ChildItem -Path "$srcDir\components" -Recurse -Filter "*.tsx","*.ts" | 
    Select-String -Pattern "from\s+['\`"].*\/services\/api['\`"]" | 
    Select-Object -ExpandProperty Path -Unique

if ($oldApiImports) {
    $oldApiImports | ForEach-Object { Write-Host "   📄 $_" -ForegroundColor White }
    Write-Host "   Total: $($oldApiImports.Count) files" -ForegroundColor Cyan
} else {
    Write-Host "   ✅ No files found (or already migrated)" -ForegroundColor Green
}
Write-Host ""

# 2. Find files importing from old interface files
Write-Host "2️⃣  Files importing from OLD interface files:" -ForegroundColor Yellow
Write-Host "   (business.ts, products.ts, users.ts)" -ForegroundColor Gray
$oldInterfaceImports = Get-ChildItem -Path "$srcDir\components" -Recurse -Filter "*.tsx","*.ts" | 
    Select-String -Pattern "from\s+['\`"].*\/interfaces\/(business|products|users)['\`"]" | 
    Select-Object -ExpandProperty Path -Unique

if ($oldInterfaceImports) {
    $oldInterfaceImports | ForEach-Object { Write-Host "   📄 $_" -ForegroundColor White }
    Write-Host "   Total: $($oldInterfaceImports.Count) files" -ForegroundColor Cyan
} else {
    Write-Host "   ✅ No files found (or already migrated)" -ForegroundColor Green
}
Write-Host ""

# 3. Find direct API endpoint calls
Write-Host "3️⃣  Files with potential direct endpoint calls:" -ForegroundColor Yellow
Write-Host "   (fetchData, createData, updateData patterns)" -ForegroundColor Gray
$directApiCalls = Get-ChildItem -Path "$srcDir\components" -Recurse -Filter "*.tsx","*.ts" | 
    Select-String -Pattern "(fetchData|createData|updateData|deleteData)\(" | 
    Select-Object -ExpandProperty Path -Unique

if ($directApiCalls) {
    $directApiCalls | ForEach-Object { Write-Host "   📄 $_" -ForegroundColor White }
    Write-Host "   Total: $($directApiCalls.Count) files" -ForegroundColor Cyan
} else {
    Write-Host "   ✅ No files found" -ForegroundColor Green
}
Write-Host ""

# 4. Summary statistics
Write-Host "📊 Migration Summary:" -ForegroundColor Magenta
Write-Host "   Files needing API updates: $($oldApiImports.Count)" -ForegroundColor White
Write-Host "   Files needing interface updates: $($oldInterfaceImports.Count)" -ForegroundColor White
Write-Host "   Files with direct API calls: $($directApiCalls.Count)" -ForegroundColor White

$totalFiles = ($oldApiImports + $oldInterfaceImports + $directApiCalls) | Select-Object -Unique | Measure-Object
Write-Host "   Total unique files to review: $($totalFiles.Count)" -ForegroundColor Cyan
Write-Host ""

# 5. Provide migration recommendations
Write-Host "💡 Next Steps:" -ForegroundColor Green
Write-Host "   1. Review the files listed above" -ForegroundColor White
Write-Host "   2. Update imports to use domain-specific APIs:" -ForegroundColor White
Write-Host "      import { PartnersAPI } from '@/services/api';" -ForegroundColor Gray
Write-Host "   3. Update function calls:" -ForegroundColor White
Write-Host "      PartnersAPI.fetchClients() instead of fetchClients()" -ForegroundColor Gray
Write-Host "   4. Update type imports to use domain interfaces:" -ForegroundColor White
Write-Host "      import type { Client } from '@/interfaces/partners';" -ForegroundColor Gray
Write-Host "   5. Test each component after migration" -ForegroundColor White
Write-Host ""

Write-Host "📚 Documentation:" -ForegroundColor Blue
Write-Host "   See FRONTEND_API_MIGRATION.md for detailed examples" -ForegroundColor White
Write-Host "   See FRONTEND_MIGRATION_SUMMARY.md for quick reference" -ForegroundColor White
Write-Host ""

Write-Host "✅ Analysis complete!" -ForegroundColor Green
