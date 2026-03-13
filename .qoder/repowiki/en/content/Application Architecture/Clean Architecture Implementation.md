# Clean Architecture Implementation

<cite>
**Referenced Files in This Document**
- [App.tsx](file://App.tsx)
- [AppNavigator.tsx](file://src/navigation/AppNavigator.tsx)
- [MainTabNavigator.tsx](file://src/navigation/MainTabNavigator.tsx)
- [LoginScreen.tsx](file://src/screens/auth/LoginScreen.tsx)
- [DashboardScreen.tsx](file://src/screens/dashboard/DashboardScreen.tsx)
- [api.ts](file://src/services/api.ts)
- [authStore.ts](file://src/store/authStore.ts)
- [index.ts](file://src/types/index.ts)
- [index.ts](file://src/constants/index.ts)
- [BatchStatusBadge.tsx](file://src/components/common/BatchStatusBadge.tsx)
- [package.json](file://package.json)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document explains the clean architecture implementation in the Banana Harvest App, focusing on the three-layer separation:
- Presentation layer: React Native components and screens
- Domain layer: Business logic and services
- Data layer: API clients and repositories

It demonstrates how each layer communicates through well-defined interfaces and dependencies, implements the dependency inversion principle, and enables testability, maintainability, and separation of concerns. It also covers how authentication logic, navigation state, and API calls flow through these layers, and how this approach benefits mobile development and team collaboration.

## Project Structure
The project follows a feature-based organization with clear boundaries between layers:
- Presentation: Screens under src/screens, navigation under src/navigation, shared UI components under src/components
- Domain: Business logic and services under src/services, stores under src/store
- Data: API clients under src/services, typed models under src/types, constants under src/constants

```mermaid
graph TB
subgraph "Presentation Layer"
A_App["App.tsx"]
A_Nav["AppNavigator.tsx"]
A_Tab["MainTabNavigator.tsx"]
A_Screens["Screens<br/>LoginScreen.tsx, DashboardScreen.tsx, ..."]
A_Components["Components<br/>BatchStatusBadge.tsx, ..."]
end
subgraph "Domain Layer"
D_API["api.ts<br/>Auth API, Farm API, Inventory API, ..."]
D_Store["authStore.ts<br/>Zustand store"]
D_Types["types/index.ts<br/>Domain models"]
D_Constants["constants/index.ts<br/>Colors, spacing, messages"]
end
subgraph "Data Layer"
D_Data["API Clients<br/>Axios instance, interceptors"]
end
A_App --> A_Nav
A_Nav --> A_Tab
A_Tab --> A_Screens
A_Screens --> D_API
A_Screens --> D_Store
A_Screens --> D_Types
A_Screens --> D_Components
D_API --> D_Data
D_Store --> D_Data
D_API --> D_Types
D_Store --> D_Types
D_Constants --> A_Screens
```

**Diagram sources**
- [App.tsx](file://App.tsx#L1-L95)
- [AppNavigator.tsx](file://src/navigation/AppNavigator.tsx#L1-L60)
- [MainTabNavigator.tsx](file://src/navigation/MainTabNavigator.tsx#L1-L414)
- [LoginScreen.tsx](file://src/screens/auth/LoginScreen.tsx#L1-L259)
- [DashboardScreen.tsx](file://src/screens/dashboard/DashboardScreen.tsx#L1-L402)
- [api.ts](file://src/services/api.ts#L1-L326)
- [authStore.ts](file://src/store/authStore.ts#L1-L116)
- [index.ts](file://src/types/index.ts#L1-L429)
- [index.ts](file://src/constants/index.ts#L1-L363)
- [BatchStatusBadge.tsx](file://src/components/common/BatchStatusBadge.tsx#L1-L98)

**Section sources**
- [App.tsx](file://App.tsx#L1-L95)
- [AppNavigator.tsx](file://src/navigation/AppNavigator.tsx#L1-L60)
- [MainTabNavigator.tsx](file://src/navigation/MainTabNavigator.tsx#L1-L414)
- [api.ts](file://src/services/api.ts#L1-L326)
- [authStore.ts](file://src/store/authStore.ts#L1-L116)
- [index.ts](file://src/types/index.ts#L1-L429)
- [index.ts](file://src/constants/index.ts#L1-L363)
- [BatchStatusBadge.tsx](file://src/components/common/BatchStatusBadge.tsx#L1-L98)
- [package.json](file://package.json#L1-L74)

## Core Components
- Presentation layer components:
  - App.tsx orchestrates the app lifecycle, providers, and navigation container
  - AppNavigator.tsx defines stack-based navigation and routes
  - MainTabNavigator.tsx manages bottom tabs, role-based visibility, and badges
  - Screens (e.g., LoginScreen.tsx, DashboardScreen.tsx) encapsulate UI and orchestrate domain actions
  - Components (e.g., BatchStatusBadge.tsx) encapsulate reusable UI logic

- Domain layer:
  - api.ts provides typed API clients and interceptors for authentication and error handling
  - authStore.ts provides a Zustand store for authentication state and getters
  - types/index.ts defines domain models and enums used across the app
  - constants/index.ts centralizes theme, typography, spacing, and error messages

- Data layer:
  - Axios instance with request/response interceptors handles token injection and automatic refresh
  - API modules (authApi, farmApi, inventoryApi, etc.) expose typed functions for backend interactions

**Section sources**
- [App.tsx](file://App.tsx#L1-L95)
- [AppNavigator.tsx](file://src/navigation/AppNavigator.tsx#L1-L60)
- [MainTabNavigator.tsx](file://src/navigation/MainTabNavigator.tsx#L1-L414)
- [LoginScreen.tsx](file://src/screens/auth/LoginScreen.tsx#L1-L259)
- [DashboardScreen.tsx](file://src/screens/dashboard/DashboardScreen.tsx#L1-L402)
- [api.ts](file://src/services/api.ts#L1-L326)
- [authStore.ts](file://src/store/authStore.ts#L1-L116)
- [index.ts](file://src/types/index.ts#L1-L429)
- [index.ts](file://src/constants/index.ts#L1-L363)
- [BatchStatusBadge.tsx](file://src/components/common/BatchStatusBadge.tsx#L1-L98)

## Architecture Overview
Clean architecture separates concerns into three layers:
- Presentation: React Native screens and navigation
- Domain: Services and stores (business logic)
- Data: API clients and typed models

The dependency inversion principle is implemented by:
- Higher-level modules (screens, navigators) depend on abstractions (typed API functions, store actions)
- Lower-level modules (Axios instance, interceptors) implement these abstractions
- No screen depends directly on Axios internals; they depend on exported API functions

```mermaid
graph TB
subgraph "Presentation"
P_Login["LoginScreen.tsx"]
P_Dashboard["DashboardScreen.tsx"]
P_Nav["AppNavigator.tsx / MainTabNavigator.tsx"]
end
subgraph "Domain"
D_API["api.ts<br/>authApi, farmApi, ..."]
D_Store["authStore.ts"]
D_Types["types/index.ts"]
end
subgraph "Data"
D_Client["Axios Instance<br/>Interceptors"]
end
P_Login --> D_API
P_Dashboard --> D_API
P_Nav --> D_Store
D_API --> D_Client
D_Store --> D_Types
D_API --> D_Types
```

**Diagram sources**
- [LoginScreen.tsx](file://src/screens/auth/LoginScreen.tsx#L1-L259)
- [DashboardScreen.tsx](file://src/screens/dashboard/DashboardScreen.tsx#L1-L402)
- [AppNavigator.tsx](file://src/navigation/AppNavigator.tsx#L1-L60)
- [MainTabNavigator.tsx](file://src/navigation/MainTabNavigator.tsx#L1-L414)
- [api.ts](file://src/services/api.ts#L1-L326)
- [authStore.ts](file://src/store/authStore.ts#L1-L116)
- [index.ts](file://src/types/index.ts#L1-L429)

## Detailed Component Analysis

### Authentication Flow Through Layers
This sequence illustrates how authentication moves from presentation to domain to data and back:

```mermaid
sequenceDiagram
participant UI as "LoginScreen.tsx"
participant Store as "authStore.ts"
participant API as "api.ts (authApi)"
participant Axios as "Axios Instance"
participant Interceptors as "Request/Response Interceptors"
participant Server as "Backend API"
UI->>API : "authApi.login(credentials)"
API->>Axios : "POST /auth/login"
Axios->>Interceptors : "Add Authorization header"
Interceptors->>Axios : "Proceed with request"
Axios->>Server : "HTTP request"
Server-->>Axios : "HTTP response"
Axios-->>API : "Response"
API->>Store : "setAuth(LoginResponse)"
Store-->>UI : "isAuthenticated = true"
UI-->>UI : "Navigate to MainTabNavigator"
```

**Diagram sources**
- [LoginScreen.tsx](file://src/screens/auth/LoginScreen.tsx#L43-L82)
- [api.ts](file://src/services/api.ts#L68-L89)
- [authStore.ts](file://src/store/authStore.ts#L40-L76)
- [AppNavigator.tsx](file://src/navigation/AppNavigator.tsx#L28-L58)

**Section sources**
- [LoginScreen.tsx](file://src/screens/auth/LoginScreen.tsx#L1-L259)
- [api.ts](file://src/services/api.ts#L1-L326)
- [authStore.ts](file://src/store/authStore.ts#L1-L116)
- [AppNavigator.tsx](file://src/navigation/AppNavigator.tsx#L1-L60)

### Navigation State and Role-Based Visibility
The navigation layer depends on domain state to decide which screens are shown and which tabs are visible:

```mermaid
flowchart TD
Start(["AppNavigator Entry"]) --> CheckAuth["Check isAuthenticated from authStore"]
CheckAuth --> IsAuth{"Authenticated?"}
IsAuth --> |No| ShowAuth["Show Login/Register screens"]
IsAuth --> |Yes| BuildTabs["Build MainTabNavigator"]
BuildTabs --> FilterTabs["Filter tabs by user role"]
FilterTabs --> RenderTabs["Render visible tabs with badges"]
ShowAuth --> End(["Exit"])
RenderTabs --> End
```

**Diagram sources**
- [AppNavigator.tsx](file://src/navigation/AppNavigator.tsx#L28-L58)
- [MainTabNavigator.tsx](file://src/navigation/MainTabNavigator.tsx#L284-L313)
- [authStore.ts](file://src/store/authStore.ts#L1-L116)
- [index.ts](file://src/types/index.ts#L1-L7)

**Section sources**
- [AppNavigator.tsx](file://src/navigation/AppNavigator.tsx#L1-L60)
- [MainTabNavigator.tsx](file://src/navigation/MainTabNavigator.tsx#L1-L414)
- [authStore.ts](file://src/store/authStore.ts#L1-L116)
- [index.ts](file://src/types/index.ts#L1-L7)

### API Calls and Error Handling
The API layer encapsulates HTTP communication and provides typed functions. Interceptors handle token injection and automatic refresh:

```mermaid
flowchart TD
CallAPI["Call typed API function (e.g., farmApi.getAllBatches)"] --> Request["Request Interceptor"]
Request --> AddToken["Attach Bearer token from authStore"]
AddToken --> Send["Send HTTP request"]
Send --> Response["Response Interceptor"]
Response --> Status{"HTTP 401?"}
Status --> |Yes| Refresh["Refresh token via authApi.refreshToken"]
Refresh --> UpdateStore["Update authStore with new tokens"]
UpdateStore --> Retry["Retry original request with new token"]
Status --> |No| Success["Return data to caller"]
Retry --> Success
```

**Diagram sources**
- [api.ts](file://src/services/api.ts#L16-L65)
- [api.ts](file://src/services/api.ts#L92-L144)
- [authStore.ts](file://src/store/authStore.ts#L1-L116)

**Section sources**
- [api.ts](file://src/services/api.ts#L1-L326)
- [authStore.ts](file://src/store/authStore.ts#L1-L116)

### Domain Models and Type Safety
Typed models define the domain contracts used across layers:

```mermaid
classDiagram
class User {
+string id
+string email
+string fullName
+UserRole role
+boolean isActive
+string profileImageUrl
+string createdAt
}
class LoginResponse {
+string token
+string refreshToken
+string userId
+string email
+string fullName
+UserRole role
+string profileImageUrl
+number expiresIn
+boolean isActive
}
class BatchStatus {
<<enumeration>>
CREATED
HARVEST_IN_PROGRESS
HARVEST_COMPLETED
DISPATCH_IN_PROGRESS
DISPATCH_COMPLETED
IN_TRANSIT
DELIVERED
CANCELLED
}
class Batch {
+string id
+string batchId
+string? inspectionId
+string? farmId
+string? farmName
+string? vendorId
+string? vendorName
+string? produceType
+BatchStatus status
+number estimatedBoxes
+number actualBoxes
+number? allocatedBoxes
+number? harvestedBoxes
+number? dispatchedBoxes
+number? remainingBoxes
+number? harvestRemaining
+number? gatePassRemaining
+string? startDate
+string? endDate
+string createdAt
}
User --> LoginResponse : "constructed from"
Batch --> BatchStatus : "uses"
```

**Diagram sources**
- [index.ts](file://src/types/index.ts#L9-L18)
- [index.ts](file://src/types/index.ts#L49-L59)
- [index.ts](file://src/types/index.ts#L142-L176)

**Section sources**
- [index.ts](file://src/types/index.ts#L1-L429)

### UI Components and Reusability
Reusable UI components encapsulate presentation logic and improve maintainability:

```mermaid
graph LR
C_BatchBadge["BatchStatusBadge.tsx"]
T_BatchStatus["BatchStatus enum"]
T_Batch["Batch model"]
C_BatchBadge --> T_BatchStatus
C_BatchBadge --> T_Batch
```

**Diagram sources**
- [BatchStatusBadge.tsx](file://src/components/common/BatchStatusBadge.tsx#L1-L98)
- [index.ts](file://src/types/index.ts#L142-L176)

**Section sources**
- [BatchStatusBadge.tsx](file://src/components/common/BatchStatusBadge.tsx#L1-L98)
- [index.ts](file://src/types/index.ts#L1-L429)

## Dependency Analysis
The app enforces dependency inversion:
- Presentation depends on domain abstractions (API functions, store actions)
- Domain depends on data abstractions (Axios instance, interceptors)
- Data does not depend on presentation or domain

```mermaid
graph TB
UI["Presentation (Screens, Navigators)"] --> DomainAbstractions["Domain Abstractions (API functions, store)"]
DomainAbstractions --> DataAbstractions["Data Abstractions (Axios, interceptors)"]
DataAbstractions -.-> UI
```

**Diagram sources**
- [App.tsx](file://App.tsx#L1-L95)
- [AppNavigator.tsx](file://src/navigation/AppNavigator.tsx#L1-L60)
- [MainTabNavigator.tsx](file://src/navigation/MainTabNavigator.tsx#L1-L414)
- [LoginScreen.tsx](file://src/screens/auth/LoginScreen.tsx#L1-L259)
- [DashboardScreen.tsx](file://src/screens/dashboard/DashboardScreen.tsx#L1-L402)
- [api.ts](file://src/services/api.ts#L1-L326)
- [authStore.ts](file://src/store/authStore.ts#L1-L116)

**Section sources**
- [App.tsx](file://App.tsx#L1-L95)
- [AppNavigator.tsx](file://src/navigation/AppNavigator.tsx#L1-L60)
- [MainTabNavigator.tsx](file://src/navigation/MainTabNavigator.tsx#L1-L414)
- [LoginScreen.tsx](file://src/screens/auth/LoginScreen.tsx#L1-L259)
- [DashboardScreen.tsx](file://src/screens/dashboard/DashboardScreen.tsx#L1-L402)
- [api.ts](file://src/services/api.ts#L1-L326)
- [authStore.ts](file://src/store/authStore.ts#L1-L116)

## Performance Considerations
- Centralized API configuration and interceptors reduce duplication and improve caching
- React Query integration enables efficient caching, retries, and stale-time controls
- Role-based tab filtering reduces unnecessary rendering and network calls
- Constants and theme definitions promote consistency and reduce layout recalculations

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Authentication failures: Verify token presence and refresh logic in interceptors
- Network errors: Check API base URL and timeout configuration
- Navigation anomalies: Confirm auth state and role-based tab visibility logic
- UI inconsistencies: Ensure constants and theme usage are consistent across components

**Section sources**
- [api.ts](file://src/services/api.ts#L1-L326)
- [index.ts](file://src/constants/index.ts#L1-L363)
- [authStore.ts](file://src/store/authStore.ts#L1-L116)
- [MainTabNavigator.tsx](file://src/navigation/MainTabNavigator.tsx#L1-L414)

## Conclusion
The Banana Harvest App applies clean architecture principles to achieve:
- Clear separation of concerns across presentation, domain, and data layers
- Dependency inversion enabling testability and flexibility
- Maintainable and collaborative development through typed models and centralized configuration
- Robust authentication and navigation flows with reusable UI components

This structure supports scalable growth, easier testing, and improved developer productivity across teams.