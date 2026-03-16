# Irisfront 디자인 마이그레이션 위험 분석 보고서

> 작성일: 2026-03-13
> 대상: `opencode-mobile/app` → Irisfront 디자인 클론
> 목적: 마이그레이션 시 기능 생략, 기술적 위험, 호환성 문제 사전 식별

---

## 1. 요약

현재 앱은 **다크 테마 + 4개 독립 화면 + 탭 네비게이션** 구조이고, Irisfront는 **라이트 테마 + 단일 화면 + bottom sheet** 구조입니다. 디자인 언어가 근본적으로 다르므로 UI 레이어 전면 교체가 필요하지만, 비즈니스 로직(App.tsx의 RPC pipeline, session 관리, approval interlock 등)은 변경 없이 보존 가능합니다.

**위험 등급 기준**:
- 🔴 HIGH: 기능 생략 또는 손상 가능성 있음
- 🟡 MEDIUM: 설계 결정 필요, 잘못하면 기능 저하
- 🟢 LOW: 단순 스타일 변경, 위험 낮음

---

## 2. 핵심 갭 분석 (14개 항목)

### GAP-01: 테마 반전 (Dark → Light) 🟢 LOW

| 항목 | 현재 | Irisfront |
|------|------|-----------|
| 배경 | `#070b12` (거의 검정) | `bg-gray-50` (#f9fafb) |
| 패널 | `#0f1724` (진한 남색) | `white` / `bg-gray-100` |
| 텍스트 | `#e2e8f0` (밝은 회색) | `text-gray-900` (거의 검정) |
| 강조 | `#38bdf8` (하늘색) | `text-blue-600` |

**위험**: `tokens.ts` 전면 교체 필요. 모든 컴포넌트가 토큰을 참조하므로 누락 시 가독성 문제 발생.

**대응**: tokens.ts를 Irisfront 팔레트로 일괄 교체. 컴포넌트별 하드코딩된 색상이 있는지 전수 검사 필요.

---

### GAP-02: 화면 구조 변경 (4 Screens → 1 Screen + Sheets) 🟡 MEDIUM

| 항목 | 현재 | Irisfront |
|------|------|-----------|
| 네비게이션 | 4개 화면 전환 (`workspace \| projects \| modelsAuth \| connection`) | 단일 Workspace + 3개 bottom sheet |
| 전환 방식 | `App.tsx`의 `currentScreen` state + 하단 탭 | TopBar 트리거 + Drawer sheet |

**위험**: `App.tsx`의 `setCurrentScreen()` 호출 지점이 여러 곳에 분산되어 있음. 화면 전환 로직을 sheet open/close로 교체할 때 누락 가능.

**대응**:
- `App.tsx`의 화면 전환 로직은 유지하되, 렌더링 방식만 변경 (조건부 렌더링 → sheet visibility)
- `currentScreen` state를 sheet open state로 매핑하는 어댑터 레이어 추가
- Connection 화면은 Irisfront에 대응이 없으므로 별도 처리 필요 (GAP-13 참조)

---

### GAP-03: ThreadRail → ThreadSheet 🔴 HIGH

| 항목 | 현재 (ThreadRail, 258줄) | Irisfront (ThreadSheet, 81줄) |
|------|--------------------------|-------------------------------|
| 필터 | 7개 (all/active/running/waiting/errors/cancelled/idle) | 없음 (Active/Recent 섹션만) |
| 정렬 | 최신순 정렬 로직 | 없음 |
| 카드 | ThreadCard (상태 아이콘 + 이름 + 시간 + 메시지 수) | 단순 행 (아이콘 + 이름 + 시간 + chevron) |
| 드래그 | PanResponder 기반 드래그 제스처 | vaul Drawer (RN에서는 @gorhom/bottom-sheet) |
| 연결 상태 | 연결 끊김 시 별도 UI | 없음 |

**위험**: 7개 필터 기능이 Irisfront 디자인에 없음. 단순히 제거하면 사용자가 특정 상태의 세션을 찾을 수 없게 됨.

**대응**:
- Active/Recent 2섹션 구조를 기본으로 채택
- 필터는 sheet 상단에 작은 필터 칩으로 추가 (Irisfront 디자인 확장)
- 또는 검색/필터 아이콘을 sheet 헤더에 배치하여 토글 방식으로 제공
- **결정 필요**: 필터를 완전히 숨길지, 축소된 형태로 유지할지 사용자 확인 필요

---

### GAP-04: ComposerBar 단순화 🟡 MEDIUM

| 항목 | 현재 (ComposerBar, 61줄) | Irisfront (Composer, 92줄) |
|------|--------------------------|----------------------------|
| 좌측 | 슬래시 커맨드 버튼 (`/`) | MessageSquare 아이콘 (thread sheet 트리거) |
| 중앙 | TextInput + Context attachment strip + Model chip | rounded-[28px] bg-gray-100 textarea |
| 우측 | Resume/Cancel/Send 3버튼 | Send 또는 Cancel (상태에 따라) |
| 최우측 | 없음 | Maximize2 아이콘 |

**위험**:
- 슬래시 커맨드 버튼 제거 시 슬래시 커맨드 접근 불가
- Context attachment strip 제거 시 첨부 파일 확인 불가
- Model chip 제거 시 현재 모델 확인 불가
- Resume 버튼 제거 시 일시정지된 세션 재개 불가

**대응**:
- 슬래시 커맨드: textarea에 `/` 입력 시 자동완성 팝업으로 대체 (기능 보존, UI 단순화)
- Context attachment: Composer 위에 작은 attachment badge로 표시 (있을 때만)
- Model chip: Settings sheet로 이동 (Irisfront 패턴과 일치)
- Resume: 상태가 `waiting`일 때 Send 버튼이 Resume으로 변환 (Irisfront의 Cancel 버튼 패턴과 동일)

---

### GAP-05: TopStatusBar → TopBar 🟡 MEDIUM

| 항목 | 현재 (TopStatusBar, 62줄) | Irisfront (TopBar, 57줄) |
|------|---------------------------|--------------------------|
| 표시 정보 | PROJECT, THREAD, PATH, MODEL, TARGET, CONN, AUTH (7개) | Project name + status pill + Settings 아이콘 (3개) |

**위험**: 7개 상태 필드 중 4개(THREAD, PATH, MODEL, TARGET)가 TopBar에서 사라짐. 사용자가 현재 컨텍스트를 한눈에 파악하기 어려워질 수 있음.

**대응**:
- PROJECT → TopBar의 project name으로 매핑
- CONN + AUTH → status pill의 색상/텍스트로 통합 (connected/disconnected/error)
- THREAD → thread sheet에서 확인 (현재 active thread 표시)
- PATH, MODEL, TARGET → Settings sheet 또는 thread 상세에서 확인
- **핵심**: 정보를 제거하는 것이 아니라 progressive disclosure로 이동

---

### GAP-06: RuntimeStateCard 흡수 🟡 MEDIUM

| 항목 | 현재 (RuntimeStateCard, 91줄) | Irisfront |
|------|-------------------------------|-----------|
| 위치 | Workspace 상단 독립 카드 | 없음 (task card의 state box로 흡수) |
| 기능 | 8가지 상태별 색상/아이콘/메시지 + 접기/펼치기 | task card 하단 상태 바 |

**위험**: 런타임 상태가 독립 카드에서 task card 내부로 이동하면, 상태 변화를 놓칠 수 있음.

**대응**:
- Irisfront의 task card 하단 상태 바 패턴 채택
- 상태 변화 시 TopBar의 status pill도 함께 업데이트 (이중 표시)
- 8가지 상태 → Irisfront의 상태 매핑: idle→green, running→blue, waiting→amber, cancelled→gray, error→red, disconnected→red, empty→gray, loading→blue

---

### GAP-07: TranscriptPane → Workspace 메시지 🟢 LOW

| 항목 | 현재 (TranscriptPane, 58줄) | Irisfront (Workspace, 170줄) |
|------|------------------------------|------------------------------|
| 구조 | 별도 SectionCard 내부 FlatList | Workspace 직접 메시지 렌더링 |
| User 메시지 | 회색 배경 카드 | `bg-black text-white rounded-2xl rounded-tr-sm` |
| Assistant 메시지 | 다른 색 배경 카드 | gradient avatar + task card |

**위험**: 낮음. 렌더링 방식만 변경하면 됨.

**대응**: TranscriptPane의 FlatList 데이터 구조는 유지하고, 렌더링 컴포넌트만 Irisfront 스타일로 교체.

---

### GAP-08: DiffReviewCard 매핑 🔴 HIGH

| 항목 | 현재 (DiffReviewCard, 50줄) | Irisfront |
|------|------------------------------|-----------|
| 기능 | 파일 변경 리뷰 (path, +/- stats, preview, Apply/Reject) | task card 내 파일 리스트 (이름만) |

**위험**: Irisfront의 task card 파일 리스트는 파일 이름만 표시하고 Apply/Reject 액션이 없음. 코드 리뷰 기능이 완전히 사라질 수 있음.

**대응**:
- task card 파일 리스트에서 파일 탭 시 DiffReview sheet를 열어 상세 리뷰 제공
- Apply/Reject 버튼은 sheet 내부에 배치
- 파일 리스트 항목에 +/- stats를 작은 badge로 표시
- **핵심**: 기능은 100% 보존하되, 진입점만 Irisfront 패턴으로 변경

---

### GAP-09: ConnectionScreen 통합 🔴 HIGH

| 항목 | 현재 (ConnectionScreen, 174줄) | Irisfront |
|------|--------------------------------|-----------|
| 기능 | Bridge endpoint 입력, 연결/재연결, QR 스캐너, 페어링 코드, Host status 그리드, Diagnostics 그리드, Recent events 로그 | **대응 없음** |

**위험**: Irisfront에 Connection 화면 자체가 없음. 이 화면의 모든 기능을 어디에 배치할지 결정 필요.

**대응**:
- **Option A**: Settings sheet 내부에 "Connection" 섹션 추가 → endpoint, 연결 상태, 재연결 버튼
- **Option B**: 별도 Connection sheet 유지 (Settings에서 진입)
- QR 스캐너: Settings → Connection → QR Scan 경로로 접근
- Diagnostics: Settings → Diagnostics 섹션으로 이동
- Host status / Recent events: 개발자 모드에서만 표시 (Irisfront의 DevStateSelector 패턴 활용)
- **결정 필요**: Connection을 Settings에 통합할지, 별도 sheet로 유지할지

---

### GAP-10: ModelsAuthScreen → Settings Sheet 🟢 LOW

| 항목 | 현재 (ModelsAuthScreen, 105줄) | Irisfront (SettingsSheet) |
|------|--------------------------------|---------------------------|
| Provider auth | 프로필 카드 + 인증 상태 | "API Keys & Auth" 행 |
| 모델 선택 | 드롭다운/리스트 | "Default Model" 행 |

**위험**: 낮음. Irisfront SettingsSheet에 이미 대응 행이 존재.

**대응**: ModelsAuthScreen의 기능을 SettingsSheet의 행 탭 → 상세 sheet/modal로 매핑.

---

### GAP-11: ProjectsScreen → ProjectSheet 🟢 LOW

| 항목 | 현재 (ProjectsScreen, 89줄) | Irisfront (ProjectSheet, 72줄) |
|------|------------------------------|--------------------------------|
| 프로젝트 생성 | 폼 (이름 + 경로 입력) | 없음 (목록만) |
| 프로젝트 목록 | 카드 리스트 | 행 리스트 (아이콘 + 이름 + 경로 + chevron) |

**위험**: 프로젝트 생성 폼이 Irisfront에 없음.

**대응**: ProjectSheet 하단에 "New Project" 버튼 추가 → 탭 시 생성 폼 sheet 열기.

---

### GAP-12: Approval UI 변환 🟡 MEDIUM

| 항목 | 현재 | Irisfront |
|------|------|-----------|
| 위치 | Workspace 내 별도 SectionCard | task card 하단 amber box |
| 액션 | Approve/Reject 버튼 | Approve/Deny 버튼 |

**위험**: Approval이 task card에 통합되면, 여러 approval이 동시에 있을 때 스크롤해서 찾아야 함.

**대응**:
- Irisfront 패턴대로 task card 하단에 amber box로 표시
- 미처리 approval이 있으면 TopBar status pill을 amber "Waiting" 상태로 표시
- 자동 스크롤: 새 approval 발생 시 해당 task card로 자동 스크롤

---

### GAP-13: QR Scanner / Camera 🟡 MEDIUM

| 항목 | 현재 | Irisfront |
|------|------|-----------|
| 기능 | expo-camera 기반 QR 스캐너 (ConnectionScreen 내) | **대응 없음** (웹 앱이므로) |

**위험**: Irisfront는 웹 앱이라 카메라 기능이 없음. 모바일 앱에서는 QR 온보딩이 핵심 기능.

**대응**:
- QR 스캐너는 모바일 전용 기능으로 유지
- Settings sheet → Connection → "Scan QR Code" 버튼으로 접근
- 스캐너 UI는 전체 화면 모달로 표시 (Irisfront 디자인 언어 적용: 라이트 테마, rounded corners)

---

### GAP-14: App.tsx 비즈니스 로직 보존 🔴 HIGH (가장 중요)

| 항목 | 설명 |
|------|------|
| 코드량 | 825줄, 프로젝트 최대 파일 |
| 역할 | RPC event pipeline, session 관리, approval interlock, endpoint persistence, QR onboarding, diagnostics logging |
| 의존성 | 모든 Screen/Component가 App.tsx에서 props를 받음 |

**위험**:
- UI 레이어 교체 시 props 인터페이스가 변경되면 비즈니스 로직에 영향
- `handleEvent()` 함수가 UI 상태와 밀접하게 연결되어 있음
- `currentScreen` state 제거 시 화면 전환 로직 전체 재작성 필요

**대응**:
- **원칙**: App.tsx의 state 변수, handler 함수, useEffect 훅은 일체 변경하지 않음
- props 인터페이스를 유지하는 어댑터 컴포넌트 작성
- `currentScreen`은 유지하되, 렌더링 방식만 변경 (탭 → sheet visibility)
- 마이그레이션 전후 `npm run gate` 통과를 필수 검증 포인트로 설정

---

## 3. 기능 보존 체크리스트

마이그레이션 완료 후 아래 기능이 모두 동작해야 합니다:

| # | 기능 | 현재 위치 | 마이그레이션 후 위치 | 위험도 |
|---|------|-----------|---------------------|--------|
| F-01 | RPC 이벤트 수신/처리 | App.tsx handleEvent | 변경 없음 | 🟢 |
| F-02 | 세션 생성/전환/삭제 | App.tsx + ThreadRail | App.tsx + ThreadSheet | 🟡 |
| F-03 | 메시지 송신 (Composer) | ComposerBar → App.tsx | 새 Composer → App.tsx | 🟡 |
| F-04 | 슬래시 커맨드 | ComposerBar `/` 버튼 | textarea 자동완성 | 🟡 |
| F-05 | Context attachment | ComposerBar strip | Composer 상단 badge | 🟡 |
| F-06 | Approval 처리 | Workspace SectionCard | Task card amber box | 🟡 |
| F-07 | Diff 리뷰 (Apply/Reject) | DiffReviewCard | Task card → Diff sheet | 🔴 |
| F-08 | 프로젝트 생성/전환 | ProjectsScreen | ProjectSheet + 생성 sheet | 🟢 |
| F-09 | 모델 선택/인증 | ModelsAuthScreen | SettingsSheet 행 | 🟢 |
| F-10 | Bridge 연결/재연결 | ConnectionScreen | SettingsSheet → Connection | 🟡 |
| F-11 | QR 스캐너 온보딩 | ConnectionScreen camera | Settings → Connection → QR | 🟡 |
| F-12 | Diagnostics 로그 | ConnectionScreen grid | Settings → Diagnostics | 🟢 |
| F-13 | 런타임 상태 표시 | RuntimeStateCard | TopBar pill + task card bar | 🟡 |
| F-14 | 세션 필터링 (7개 필터) | ThreadRail | ThreadSheet (축소/확장) | 🔴 |
| F-15 | Resume/Cancel 세션 | ComposerBar 버튼 | Composer 상태별 버튼 | 🟡 |
| F-16 | Endpoint persistence | App.tsx AsyncStorage | 변경 없음 | 🟢 |
| F-17 | 페어링 코드 표시 | ConnectionScreen | Settings → Connection | 🟢 |

---

## 4. 기술적 위험

### 4-1. React Native에서 Bottom Sheet 구현

Irisfront는 `vaul` (웹 Drawer 라이브러리)을 사용합니다. RN에서는 `@gorhom/bottom-sheet`로 대체해야 합니다.

**위험**: 제스처 충돌 (ScrollView 내부 bottom sheet), 키보드 회피, 중첩 sheet 처리.

**대응**: `@gorhom/bottom-sheet`는 이미 RN 생태계에서 검증된 라이브러리. 기존 ThreadRail도 Modal + PanResponder를 사용하므로 오히려 개선됨.

### 4-2. 아이콘 시스템 변경

Irisfront는 Lucide SVG 아이콘을 사용합니다. 현재 앱은 아이콘 라이브러리가 명시되어 있지 않음.

**대응**: `lucide-react-native` 패키지 추가. 기존 아이콘이 있다면 Lucide 대응 아이콘으로 1:1 교체.

### 4-3. 폰트 시스템

Irisfront는 시스템 폰트(`font-sans`)를 사용합니다. RN에서는 기본적으로 시스템 폰트를 사용하므로 문제 없음.

### 4-4. 그라데이션 아바타

Irisfront의 agent 메시지에 gradient avatar가 있습니다. RN에서는 `expo-linear-gradient` 또는 `react-native-linear-gradient`로 구현.

---

## 5. 마이그레이션 순서 권장안

위험도와 의존성을 고려한 순서:

### Phase 1: 기반 작업
1. `tokens.ts` 라이트 테마로 교체 (GAP-01)
2. `lucide-react-native`, `@gorhom/bottom-sheet` 의존성 추가
3. 공통 컴포넌트 생성 (StatusPill, SheetContainer, MessageBubble)

### Phase 2: Workspace 화면 (가장 큰 변경)
4. TopBar 컴포넌트 교체 (GAP-05)
5. Workspace 메시지 렌더링 교체 (GAP-07)
6. Composer 교체 (GAP-04)
7. RuntimeStateCard → task card 통합 (GAP-06)
8. Approval UI 통합 (GAP-12)
9. DiffReviewCard → task card + sheet (GAP-08)

### Phase 3: Bottom Sheets
10. ThreadSheet 구현 (GAP-03)
11. ProjectSheet 구현 (GAP-11)
12. SettingsSheet 구현 (GAP-10)

### Phase 4: 나머지 화면 통합
13. ConnectionScreen → Settings 통합 (GAP-09)
14. QR Scanner 모달 (GAP-13)
15. 화면 구조 변경 - App.tsx 렌더링 (GAP-02, GAP-14)

### Phase 5: 검증
16. `npm run gate` 통과 확인
17. 기능 보존 체크리스트 (17개 항목) 전수 확인

---

## 6. 결정 필요 사항 (사용자 확인 요청)

마이그레이션 진행 전 아래 사항에 대한 결정이 필요합니다:

1. **ThreadRail 필터 (GAP-03)**: 7개 필터를 축소된 형태로 유지할지, 완전히 제거하고 Active/Recent만 남길지?
2. **ConnectionScreen (GAP-09)**: Settings sheet에 통합할지, 별도 sheet로 유지할지?
3. **DiffReviewCard (GAP-08)**: 파일 탭 시 별도 sheet로 열지, inline 확장으로 보여줄지?
4. **슬래시 커맨드 (GAP-04)**: textarea 자동완성으로 대체할지, 다른 진입점을 만들지?

---

## 7. 결론

14개 갭 중 **🔴 HIGH 4개** (ThreadRail 필터, DiffReviewCard, ConnectionScreen, App.tsx 로직 보존)가 가장 주의가 필요합니다. 나머지는 설계 결정만 내리면 안전하게 마이그레이션 가능합니다.

가장 중요한 원칙: **App.tsx의 비즈니스 로직은 절대 변경하지 않고, UI 레이어만 교체한다.**
