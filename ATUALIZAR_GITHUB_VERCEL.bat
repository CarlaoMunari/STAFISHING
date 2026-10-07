@echo off
title STA FISHING - ATUALIZAR GITHUB E VERCEL
color 0b
echo ========================================================
echo   STA FISHING - ENVIANDO ATUALIZACOES PARA GITHUB E VERCEL
echo ========================================================
echo.
cd /d "%~dp0"
echo Pasta Atual: %CD%
echo.
echo Executando git push origin main...
echo.
git push origin main
echo.
if %ERRORLEVEL% EQU 0 (
    color 0a
    echo ========================================================
    echo   SUCESSO! O PROJETO FOI ATUALIZADO NO GITHUB E NO VERCEL!
    echo ========================================================
) else (
    color 0c
    echo ========================================================
    echo   Houve algum problema no envio. Verifique a mensagem acima.
    echo ========================================================
)
echo.
pause
