# Construction 3D: In-Depth Project Documentation

Welcome to the comprehensive documentation for **Construction 3D**, an AI-powered architectural design tool. This document provides a deep dive into the project's architecture, data flow, component structure, and underlying technologies.

## 1. Project Vision & Core Features

Construction 3D is a web application designed to bridge the gap between high-level architectural requirements and tangible 3D visualizations. It allows users to input desired specifications for a floor plan and, in response, receive multiple procedurally generated, interactive 3D models.

### Key Features:
- **Intuitive Configuration**: A simple sidebar panel allows users to define the total area and the number of various rooms (bedrooms, bathrooms, etc.).
- **Procedural 3D Generation**: Instead of relying on static assets, the application generates unique 3D floor plans in real-time using a sophisticated algorithm.
- **Interactive 3D Viewer**: Each generated plan is displayed in an interactive viewport built with React Three Fiber, allowing for orbit, pan, and zoom controls.
- **Client-Side Logic**: The entire experience, from configuration to 3D generation, runs directly in the user's browser, providing a fast and seamless experience.
- **Model Interaction**: Users can regenerate variations and download the generated 3D models in `.gltf` format for use in other 3D software.

---

## 2. Tech Stack

The project leverages a modern, powerful tech stack centered around Next.js and its ecosystem.

- **Framework**: **Next.js 15 (App Router)** - Provides the foundation for the application, handling routing, server-side rendering, and client-side navigation.
- **UI Library**: **React 19** - Used for building the user interface with a component-based architecture.
- **3D Rendering**:
    - **React Three Fiber (R3F)**: A React renderer for Three.js, enabling a declarative, component-based approach to building complex 3D scenes.
    - **Three.js**: The underlying WebGL library for creating and displaying 3D graphics in the browser.
    - **@react-three/drei**: A collection of helpers and abstractions for R3F that simplifies tasks like adding controls, text, and lighting.
- **Styling**:
    - **Tailwind CSS**: A utility-first CSS framework for rapid and consistent styling.
    - **ShadCN UI**: A collection of beautifully designed and accessible UI components (buttons, sliders, cards) built on top of Tailwind CSS and Radix UI.
- **State Management**: **React Hooks (`useState`, `useForm`)** - State is managed locally within components and through React's native hooks, keeping the architecture simple and predictable.
- **Form Handling**: **React Hook Form** with **Zod** for schema validation, ensuring data integrity and providing a robust form experience.
- **Artificial Intelligence (Placeholder)**:
    - **Genkit**: While currently bypassed in favor of local procedural generation, the initial structure includes Genkit for potential future integration of generative AI models.

---

## 3. Application Architecture & Data Flow

The application follows a client-centric architecture. The most complex logic—procedural 3D generation—is intentionally executed on the client-side to provide instant feedback and interactivity.

### Overall Data Flowchart

This flowchart illustrates the end-to-end process, from user input to the final 3D model rendering.

```mermaid
graph TD
    A[User Opens App] --> B{Page Load};
    B --> C[UI Renders with Default Values];
    C --> D{User Adjusts Configuration};
    D -- Total Area, Room Counts --> E[Config Panel State managed by React Hook Form];
    E --> F[User Clicks "Generate Plans"];

    subgraph "Frontend Data Transfer (Prop Drilling)"
        F --> G[onSubmit Function in page.tsx];
        G --> H{Set Loading State & Capture Form Data};
        H -- formData (JS Object) --> I[ViewerGrid Component];
        I -- planConfig prop --> J[ModelCard Component];
        J -- planConfig prop --> K[InteractiveViewer Component];
    end

    subgraph "3D Generation & Rendering (React Three Fiber)"
        K -- planConfig prop --> L[FloorPlan Component Receives Config];
        L --> M{`generateLayout` Algorithm Runs};
        M -- Creates a layout JSON (room positions & dimensions) --> N[Geometry Construction];
        N -- Walls (ExtrudeGeometry), Floor (PlaneGeometry), Labels (Text) --> O[React Three Fiber Canvas Renders Scene];
    end

    O --> P{User Interacts with 3D Model};
    P -- Orbit, Pan, Zoom --> O;
    P -- Clicks "Regenerate" --> Q[Regeneration Key is Updated, forcing re-mount];
    Q --> L;
    P -- Clicks "Download" --> R[GLTFExporter Captures Scene];
    R --> S[User Downloads .gltf File];

    style F fill:#DC143C,color:#fff
    style H fill:#f0f4f8,color:#333
    style I fill:#f0f4f8,color:#333
    style J fill:#f0f4f8,color:#333
    style K fill:#f0f4f8,color:#333
    style L fill:#f0f4f8,color:#333
    style M fill:#f0f4f8,color:#333
    style N fill:#f0f4f8,color:#333
```

### Key Architectural Decisions

1.  **Client-Side 3D Generation**: The decision to perform procedural generation on the client was deliberate. It avoids server costs, eliminates network latency during generation, and makes the "Regenerate" feature instantaneous. The tradeoff is a higher initial computational load on the user's device.

2.  **Component-Based Data Transfer**: The user's configuration, a JavaScript object, is passed down from the main page (`page.tsx`) through the component tree (`ViewerGrid` -> `ModelCard` -> `InteractiveViewer`) using props. This standard React pattern keeps data flow unidirectional and predictable.

3.  **Server Actions (Currently Mocked)**: The file `src/app/actions.ts` is structured as a Next.js Server Action. In a server-connected version of this app, this is where the client would securely call backend logic. In the current implementation, it simulates a network request, demonstrating a modern Next.js pattern for client-server communication.

4.  **Modular Component Structure**: The application is broken down into highly specific, reusable components. UI components are separated from 3D components, and application-specific components (`/arch-ai`) are distinct from generic ones (`/ui`), making the codebase easier to maintain.

---

## 4. Folder & File Structure Deep Dive

```
/src
├── app/
│   ├── layout.tsx         # Root layout: sets up HTML structure, fonts, Toaster
│   ├── page.tsx           # Main page: holds state, form logic, and overall layout
│   └── actions.ts         # Server Action (currently mocked) for handling form submission
│
├── components/
│   ├── arch-ai/           # Components specific to this application
│   │   ├── config-panel.tsx     # The main sidebar form with sliders and counters
│   │   ├── counter-input.tsx    # A small +/- input component for room counts
│   │   ├── icons.tsx            # SVG icon for the logo
│   │   ├── interactive-viewer.tsx # The core 3D engine: Canvas, lighting, and procedural generation
│   │   └── model-card.tsx       # Card component that hosts the viewer and action buttons
│   │   └── viewer-grid.tsx      # Lays out the model cards and handles loading/empty states
│   │
│   └── ui/                  # Generic, reusable ShadCN UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── form.tsx
│       ├── slider.tsx
│       └── ... (and many others)
│
├── hooks/
│   └── use-toast.ts       # Custom hook for showing toast notifications
│
└── lib/
    ├── schemas.ts         # Zod schemas for validating form data
    └── utils.ts           # Utility functions (e.g., `cn` for Tailwind class merging)
```

---

## 5. Core Component Breakdown

### `app/page.tsx`
This is the primary entry point for the application's UI.
- **State Management**: Holds the application's most critical state using `React.useState`:
    - `isLoading`: A boolean to control the visibility of the loading spinner.
    - `results`: An array that holds the data for the generated plans.
    - `formData`: Stores the submitted form configuration to be passed to the 3D viewer.
- **Form Handling**: Initializes `react-hook-form` with a `zodResolver` to connect our validation schema (`generatePlanSchema`) to the form.
- **`onSubmit` Logic**: This function orchestrates the generation process. It sets the loading state, captures the form data, and (after a simulated delay) populates the `results`, triggering a re-render to display the `ViewerGrid`. The captured form data object is stored in the `formData` state variable.

### `components/arch-ai/viewer-grid.tsx`
This component is responsible for laying out the results.
- It receives the `formData` object as a prop from `page.tsx`.
- It maps over the `results` array and renders a `ModelCard` for each item, passing the `formData` down to each card as the `planConfig` prop.

### `components/arch-ai/interactive-viewer.tsx`
This is the heart of the application, where the 3D generation and rendering occur.
- **Data Reception**: It receives the `planConfig` object as a prop from `ModelCard`.
- **`<Canvas />`**: The root element from React Three Fiber that creates the WebGL rendering context.
- **Scene Setup**:
    - **Lighting**: `ambientLight` provides soft, global illumination, while `directionalLight` simulates a sun source, creating shadows and highlights.
    - **Controls**: `OrbitControls` from `@react-three/drei` allows the user to interact with the scene using their mouse or touch.
- **`FloorPlan` Component**: This is where the procedural logic resides. It receives the `planConfig` and is memoized with `React.useMemo` to prevent re-calculation unless the configuration changes.
    - **`generateLayout` Function**: This is the core algorithm. It takes the user's `planConfig` (the JS object containing area and room counts) and performs calculations to create a layout. It returns a `rooms` object (acting as a temporary JSON structure) and a `walls` array.
    - **Geometry Construction**: It iterates over the generated layout data and constructs the 3D geometry declaratively using R3F components:
        - **Floor**: A simple `<planeGeometry>`.
        - **Walls**: Uses `<extrudeGeometry>` with a custom `THREE.Shape` to create walls with thickness. The shape includes holes for doors and windows, which are defined as `THREE.Path` objects.
        - **Labels**: Uses the `<Text>` component from `@react-three/drei` to place the name of each room within its 3D space. The position is calculated based on the room's center from the layout data.

### `components/arch-ai/model-card.tsx`
This component acts as a container for each generated 3D model variation.
- **Data Reception**: It receives the `planConfig` object from `ViewerGrid`.
- **State**: It manages a `regenerationKey`. When the "Regenerate" button is clicked, this key is updated. Passing this key to the `InteractiveViewer` forces React to re-mount it, which re-runs the procedural generation algorithm to create a new, unique layout.
- **Scene Handling**:
    - It maintains a `sceneRef` to get a direct handle on the underlying Three.js `Scene` object.
    - **Download Logic**: The `handleDownload` function uses this `sceneRef` to pass the scene to a `GLTFExporter`. This exporter traverses the scene graph and converts it into the `.gltf` format, which is then triggered as a file download.

---

## 6. Getting Started

### Prerequisites
- Node.js (v18 or later)
- npm or another package manager

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:9002`.

---

This detailed breakdown should provide a solid foundation for understanding the Construction 3D project. The client-side procedural generation approach is powerful and provides a fantastic user experience, and the component-based architecture makes it highly maintainable and extensible.
