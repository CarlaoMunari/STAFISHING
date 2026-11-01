@echo off
title STA FISHING v2.0 - PUXAR ATUALIZACOES DO GITHUB
color 0b
echo ========================================================
echo     STA FISHING v2.0 - SINCRONIZANDO (PULL DO GITHUB)
echo ========================================================
echo.
cd /d "%~dp0"
echo Pasta Atual: %CD%
echo.

echo Buscando novidades da outra maquina no GitHub...
git fetch origin
git checkout v2.0
git pull origin v2.0

echo.
if %ERRORLEVEL% EQU 0 (
    color 0a
    echo ========================================================
    echo   SUCESSO! PROJETO SINCRONIZADO E ATUALIZADO COM O GITHUB!
    echo ========================================================
) else (
    color 0c
    echo ========================================================
    echo   Aviso: Ocorreu algum conflito ou erro na sincronizacao.
    echo ========================================================
)
echo.
pause
