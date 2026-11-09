param([string]$KeilC51Root = 'D:/keil-C51/C51')
$ErrorActionPreference='Stop'
Push-Location $PSScriptRoot
try {
    foreach($sourceFile in @('main.c','stopwatch.c')) {
        & "$KeilC51Root/BIN/C51.exe" $sourceFile "INCDIR($KeilC51Root/INC)" OBJECTEXTEND
        if($LASTEXITCODE -ne 0){throw "Compilation failed: $sourceFile"}
    }
    & "$KeilC51Root/BIN/BL51.exe" main.obj,stopwatch.obj TO experiment2
    if($LASTEXITCODE -ne 0){throw 'Link failed'}
    & "$KeilC51Root/BIN/OH51.exe" experiment2
    if($LASTEXITCODE -ne 0){throw 'HEX conversion failed'}
} finally {Pop-Location}
