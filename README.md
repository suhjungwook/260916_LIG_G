# 🧬 LIG DNA TaskFlow (TODO Web App)

> **LIG DNA 전용 스마트 업무 및 할 일 관리 웹 애플리케이션**  
> Python Flask 백엔드와 세련된 글래스모피즘(Glassmorphism) UI를 결합한 모던 TODO 시스템입니다.

---

## ✨ 주요 기능

1. **할 일 & 업무 종합 관리 (CRUD)**
   - 신규 업무 등록 (제목, 카테고리, 우선순위, 마감일)
   - 업무 완료/진행중 실시간 토글 (원클릭 체크)
   - 모달을 통한 업무 내용 및 속성 수정
   - 개별 삭제 및 "완료된 항목 일괄 정리" 지원

2. **카테고리 및 우선순위 체계**
   - **카테고리**: 업무(💼), 기획(📊), 개발(💻), 연구(🔬), 기타(📌)
   - **우선순위**: 긴급/높음(🔴), 보통(🟡), 낮음(🟢)

3. **스마트 마감일(D-Day) 연산**
   - 설정된 마감일에 따라 **오늘 마감**, **D-Day (D-3, D-1)**, **지연 (D+2)** 자동 뱃지 부여

4. **실시간 대시보드 & 통계**
   - 전체 업무, 진행 중, 완료 항목 개수 실시간 집계
   - 목표 달성률(%) 프로그레스 바 및 부드러운 게이지 애니메이션

5. **검색 및 스마트 필터링**
   - 키워드 실시간 타이핑 검색 (디바운스 적용)
   - 탭 필터: 전체 / 진행중 / 완료 / 🔥 긴급
   - 카테고리 드롭다운 필터

6. **모던 UI/UX**
   - 딥 네이비 & 일렉트릭 블루/시안 그라디언트 테크 감성 디자인
   - 🌙 다크 모드 / ☀️ 라이트 모드 전환 토글 (설정 브라우저 영구 저장)
   - 인터랙티브 토스트 알림 메시지

---

## 📁 폴더 구조

```text
LIG_DNA_TODO_APP/
├── app.py                 # Flask 웹 서버 및 REST API 라우트
├── database.py            # SQLite3 데이터베이스 초기화 및 데이터 처리 로직
├── requirements.txt       # 실행에 필요한 파이썬 패키지 (Flask)
├── run.bat                # 윈도우 원클릭 서버 실행기
├── README.md              # 프로젝트 안내 문서
├── static/
│   ├── css/
│   │   └── style.css      # 모던 글래스모피즘 및 다크/라이트 테마 스타일
│   └── js/
│       └── app.js         # 비동기 통신(Fetch API) 및 화면 인터랙션
└── templates/
    └── index.html         # 웹 대시보드 메인 HTML 템플릿
```

---

## 🚀 실행 방법

### 방법 1. 원클릭 실행 (Windows 권장)
`LIG_DNA_TODO_APP` 폴더 안의 **`run.bat`** 파일을 더블 클릭하세요.  
필요한 패키지가 자동으로 점검되고, 로컬 웹 브라우저(`http://127.0.0.1:5000`)가 자동으로 열립니다.

### 방법 2. 터미널/PowerShell에서 실행
```bash
# 1. 폴더 이동
cd c:\Users\user\Desktop\260916_CLAUDE_RPA\LIG_DNA_TODO_APP

# 2. 의존성 설치
python -m pip install -r requirements.txt

# 3. 서버 실행
python app.py
```
브라우저에서 `http://127.0.0.1:5000` 으로 접속합니다.

---

## 🔌 API 명세

| 메서드 | 엔드포인트 | 설명 |
|---|---|---|
| `GET` | `/` | 메인 대시보드 웹페이지 |
| `GET` | `/api/todos` | 할 일 목록 조회 (쿼리: `filter`, `category`, `search`) |
| `POST` | `/api/todos` | 신규 할 일 생성 (`title`, `category`, `priority`, `due_date`) |
| `PATCH` | `/api/todos/<id>/toggle` | 할 일 완료 여부 토글 |
| `PUT` | `/api/todos/<id>` | 할 일 정보 수정 |
| `DELETE` | `/api/todos/<id>` | 특정 할 일 삭제 |
| `POST` | `/api/todos/clear-completed` | 완료된 할 일 일괄 삭제 |
| `GET` | `/api/stats` | 총 업무, 진행 중, 완료 수, 달성률 통계 |
