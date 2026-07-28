@echo off
setlocal enabledelayedexpansion

echo [wnpm] Binding wnpm and wnpx CLI commands for Windows...

:: Get absolute path to project root folder
for %%I in ("%~dp0..") do set "PROJECT_DIR=%%~fI"

set "TARGET_DIR=%USERPROFILE%\.local\bin"

:: Create target directory if it doesn't exist
if not exist "%TARGET_DIR%" (
    mkdir "%TARGET_DIR%"
    echo [wnpm] Created directory: %TARGET_DIR%
)

:: Create CMD wrapper scripts for Windows execution
echo @node "%PROJECT_DIR%\dist\index.js" %%* > "%TARGET_DIR%\wnpm.cmd"
echo @node "%PROJECT_DIR%\dist\wnpx.js" %%* > "%TARGET_DIR%\wnpx.cmd"

echo.
echo [SUCCESS] wnpm and wnpx linked to %TARGET_DIR%!
echo.
echo [NOTE] Make sure %TARGET_DIR% is added to your Windows PATH environment variable.
pause