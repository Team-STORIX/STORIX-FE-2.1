param(
  [string]$ProjectId = "storix-f5729",
  [string]$FirebaseAppId = "1:1043875012778:android:3d1960d87b9da4ae9f30d3",
  [string]$Groups = "team-storix",
  [string]$ReleaseNotes = "Release build."
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$AndroidDir = Join-Path $Root "android"
$ApkPath = Join-Path $AndroidDir "app\build\outputs\apk\release\app-release.apk"

Write-Host "Building Android release APK..."
Push-Location $AndroidDir
try {
  .\gradlew.bat assembleRelease
}
finally {
  Pop-Location
}

if (!(Test-Path $ApkPath)) {
  throw "Release APK was not created: $ApkPath"
}

Write-Host "Distributing release APK to Firebase App Distribution..."
npx firebase-tools appdistribution:distribute $ApkPath `
  --app $FirebaseAppId `
  --groups $Groups `
  --release-notes $ReleaseNotes `
  --project $ProjectId

Write-Host "Done."
