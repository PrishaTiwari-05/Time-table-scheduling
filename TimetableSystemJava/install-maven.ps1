# Maven Installation Script for Windows
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Apache Maven Installation Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$mavenZip = "C:\Users\Dinisha\Downloads\apache-maven-3.9.11-bin.zip"
$installDir = "C:\Program Files\Apache\Maven"
$tempExtractDir = "$env:TEMP\maven-extract"

if (-Not (Test-Path $mavenZip)) {
    Write-Host "ERROR: Maven zip file not found" -ForegroundColor Red
    exit 1
}

Write-Host "[1/5] Found Maven zip file" -ForegroundColor Green

Write-Host "[2/5] Creating installation directory..." -ForegroundColor Yellow
if (Test-Path $installDir) {
    Remove-Item -Path $installDir -Recurse -Force
}

Write-Host "[3/5] Extracting Maven archive..." -ForegroundColor Yellow
if (Test-Path $tempExtractDir) {
    Remove-Item -Path $tempExtractDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempExtractDir -Force | Out-Null
Expand-Archive -Path $mavenZip -DestinationPath $tempExtractDir -Force

$extractedFolder = Get-ChildItem -Path $tempExtractDir -Directory | Select-Object -First 1
New-Item -ItemType Directory -Path "C:\Program Files\Apache" -Force | Out-Null
Move-Item -Path $extractedFolder.FullName -Destination $installDir -Force

Remove-Item -Path $tempExtractDir -Recurse -Force

Write-Host "      Maven extracted successfully" -ForegroundColor Green

Write-Host "[4/5] Setting environment variables..." -ForegroundColor Yellow
[System.Environment]::SetEnvironmentVariable("MAVEN_HOME", $installDir, [System.EnvironmentVariableTarget]::Machine)

$currentPath = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::Machine)
$mavenBinPath = "$installDir\bin"

if ($currentPath -notlike "*$mavenBinPath*") {
    $newPath = $currentPath + ";" + $mavenBinPath
    [System.Environment]::SetEnvironmentVariable("Path", $newPath, [System.EnvironmentVariableTarget]::Machine)
    Write-Host "      Added Maven to PATH" -ForegroundColor Green
}

$env:MAVEN_HOME = $installDir
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::Machine)

Write-Host "[5/5] Verifying installation..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Maven installed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please restart your PowerShell/IDE" -ForegroundColor Yellow

