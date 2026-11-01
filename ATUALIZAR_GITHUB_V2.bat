@echo off
title STA FISHING v2.0 - ATUALIZAR GITHUB
color 0b
echo ========================================================
echo       STA FISHING v2.0 - ENVIAR PARA O GITHUB
echo ========================================================
echo.
cd /d "%~dp0"
echo Pasta Atual: %CD%
echo.

git status -s
echo.
echo Adicionando arquivos e enviando para branch v2.0...
echo.

git add -A
git commit -m "chore(v2.0): atualizacao automatica versao 2.0"
git push origin v2.0

echo.
if %ERRORLEVEL% EQU 0 (
    color 0a
    echo ========================================================
    echo   SUCESSO! AS ATUALIZACOES DA v2.0 FORAM ENVIADAS!
    echo ========================================================
) else (
    color 0c
    echo ========================================================
    echo   Houve algum problema no envio. Verifique a mensagem acima.
    echo ========================================================
)
echo.
pause
