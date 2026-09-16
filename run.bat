@echo off
chcp 65001 > nul
title LIG DNA TaskFlow Server Runner
cls
echo =======================================================
echo         [LIG DNA TaskFlow] 웹 애플리케이션 시작기
echo =======================================================
echo.

:: Python 설치 확인
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [오류] Python이 설치되어 있지 않거나 PATH에 등록되지 않았습니다.
    echo Python 3.10 이상을 설치하신 후 다시 시도해주세요.
    pause
    exit /b 1
)

:: 의존성 설치 확인
echo [1/2] 필수 패키지 확인 중...
python -m pip install -r requirements.txt --quiet

:: 브라우저 자동 오픈
echo [2/2] 웹 애플리케이션 서버를 시작합니다...
echo.
echo =======================================================
echo  접속 주소: http://127.0.0.1:5000
echo  종료하려면 Ctrl+C 를 누르세요.
echo =======================================================
echo.

start http://127.0.0.1:5000
python app.py

pause
