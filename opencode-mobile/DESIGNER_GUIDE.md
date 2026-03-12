# 📱 Opencode Mobile: Designer's Guide (v1.1)

이 문서는 개발팀의 시스템 아키텍처와 UI 구현 가이드라인을 바탕으로 작성되었습니다. 디자이너는 본 문서의 **IA 제약**과 **디자인 토큰**을 반드시 준수해야 합니다.

---

## 1. Information Architecture (IA) & Navigation
앱은 4개의 메인 화면이 병렬로 배치된 구조이며, `Primary Navigation Grid`를 통해 전환됩니다.

### **계층 구조**
- **Root**: `App.tsx` (Global State Management)
  - **Tab 1: Workspace (`workspace`)**: 메인 콘솔. 프로젝트 내 세션 관리, AI 대화, 코드 리뷰.
  - **Tab 2: Projects (`projects`)**: 프로젝트 목록 관리 및 생성.
  - **Tab 3: Models & Auth (`modelsAuth`)**: AI 모델 선택 및 클라우드 서비스 인증.
  - **Tab 4: Connection (`connection`)**: 브릿지 서버 연결 설정 및 진단(Diagnostics).

### **내비게이션 제약**
- 화면 상단에는 항상 `Top Bar`(제목 및 현재 화면 설명)와 `Primary Nav Grid`(4개 버튼)가 위치해야 합니다.
- 화면 전환 시 기존 상태(작성 중인 메시지 등)가 유지되어야 하므로, 오버레이보다는 스위칭 방식의 레이아웃을 권장합니다.

---

## 2. 디자인 시스템 토큰 (Design Tokens)
코드베이스(`tokens.ts`)에 정의된 상수를 기반으로 디자인해야 합니다.

### **Color Palette (Primary)**
- **Background**: `#070b12` (Deep Dark)
- **Panel**: `#0f1724` / **Panel Alt**: `#111c2b`
- **Border**: `#213043` / **Strong Border**: `#31445f`
- **Text**: `#ecf3ff` (High Contrast) / **Text Muted**: `#90a0b7`
- **Primary Action**: `#3f82ff`

### **Status Colors (Critical)**
AI 에이전트 및 연결 상태를 나타낼 때 반드시 다음 컬러를 사용하십시오.
- **Success/Running**: `#16a34a` / `#22c55e`
- **Warning/Waiting**: `#f59e0b` (승인 대기 등)
- **Error**: `#ef4444`
- **Cancelled**: `#8b5cf6`
- **Disconnected**: `#f97316`

### **Spacing & Radius**
- **Spacing**: `xs(6px)`, `sm(10px)`, `md(14px)`, `lg(18px)`
- **Corner Radius**: `sm(10px)`, `md(14px)`, `lg(18px)`

---

## 3. 화면별 상세 디자인 요구사항

### **[Workspace] 에이전트와의 협업**
- **Transcript Pane**: AI와의 대화는 '말풍선' 형태가 아닌 '카드/섹션' 형태를 권장합니다. 시스템 메시지와 사용자 메시지의 시각적 대비가 필요합니다.
- **Diff Review Card**: 코드 변경 사항은 가로 스크롤을 최소화하고, 추가(`+`)와 삭제(`-`) 라인을 배경색으로 명확히 구분해야 합니다.
- **Approval Request**: 사용자의 승인이 필요한 단계는 **Warning 컬러(#f59e0b)**를 테두리에 사용하고, `Approve` / `Deny` 버튼이 하단에 명확히 배치되어야 합니다.

### **[Connection] 서버 연결**
- **QR Scanner**: 카메라 뷰는 `16:9` 혹은 정사각 프레임 내에 위치하며, 스캔 성공 시 시각적 피드백(진동 또는 하이라이트)이 필요합니다.
- **Host Health**: CPU, 메모리 상태는 게이지 바 또는 수치 카드로 밀도 있게 표현합니다.

### **[Projects] 목록 관리**
- **Active State**: 현재 선택된 프로젝트는 **Primary 컬러(#3f82ff)** 테두리나 배지를 통해 강조되어야 합니다.

---

## 4. UI/UX 원칙 및 제약 사항

1.  **터치 대상 최소 크기**: 모든 버튼은 최소 `44x44dp`의 터치 영역을 확보해야 합니다.
2.  **폰트 제약**: 코드가 포함되는 영역(Diff, Log)은 반드시 **Monospace** 폰트를 사용하여 정렬을 유지해야 합니다.
3.  **입력창 (Composer)**: 메시지 입력창은 내용에 따라 높이가 유동적으로 변하되, 최대 높이 제한(Max Height)을 두어 대화 내역을 가리지 않아야 합니다.
4.  **피드백 (Toast/Info)**: 브릿지로부터 오는 이벤트(`connection.ready`, `task.error` 등)는 화면 상단 혹은 하단에 비침범적(Non-intrusive)인 알림 형태로 표시되어야 합니다.

---

## 5. 시각적 구조의 근거 (Rationale)
이 앱은 개발자가 **"위험한 작업을 승인하거나 진행 상황을 감시"**하는 도구입니다. 따라서 화려한 그래픽보다는 **데이터의 가독성**과 **상태의 즉각적 인지**가 디자인의 최우선 순위입니다. 

특히 `waiting_approval` 상태는 사용자가 개입하지 않으면 작업이 중단되므로, 앱 내에서 가장 높은 시각적 우선순위를 가져야 합니다.

---
*Last Updated: 2026-03-12 | Based on Codebase Analysis (App.tsx, tokens.ts)*

