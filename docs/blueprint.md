# **App Name**: ArchAI 3D

## Core Features:

- Configuration Selection Panel: UI for users to select unit type (Metric or Imperial), number of floors (1, 2), total area, and room counts (Bedroom, Bathroom, Kitchen, Living room, Dining room) using a layout similar to Maket.ai's sidebar.
- Plan Generation Request: On clicking “Generate Plans,” send a POST request to FastAPI backend `/generate`. Include the user’s configuration data as JSON. Show a loading spinner and progress indicator while models are being generated.
- 3D Model Generation (Backend + Blender): FastAPI triggers a Blender Python script (`generate_floor_plan.py`) using subprocess or API call. The script should: Read configuration inputs, procedurally create walls, floors, rooms, and doors using Blender’s **bpy** module, generate **four unique 3D plan variations**, export each as `.glb` format to `/storage/generated_models/`.
- Model Optimization: After export, run each `.glb` through **gltf-pipeline** for optimization. Compress texture sizes and remove unused nodes for smooth browser rendering.
- Model Storage & Retrieval: Store optimized `.glb` models locally. Create API routes to serve these model files (e.g., `/models/{model_name}.glb`). Return an array of URLs for all generated models in the `/generate` API response.
- Interactive 3D Viewer: On the frontend, render all four `.glb` files in a grid layout using **React Three Fiber**. Each model card should include: A **preview viewport** (3D viewer), A **description/title**, Three buttons: **Send / Share**, **Refresh / Regenerate**, **Download (.glb)**. Allow camera controls: orbit, zoom, and pan. Implement loading indicators and transition animations.
- Backend API (FastAPI): Build scalable endpoints: `POST /generate` → triggers Blender model generation, `GET /models/{filename}` → returns .glb file. Enable **Swagger** docs for API testing at `/docs`. Add **CORS middleware** for frontend-backend communication.
- Blender Python Scripts: `generate_floor_plan.py`: Takes user input as CLI args or JSON and procedurally builds 3D models. Use **bpy** to generate rooms and place basic furniture (optional placeholders). Export four `.glb` variations. Optionally create reusable **.blend templates** and **geometry nodes** for consistent structure.
- download: user should able to download the 3d model .glb file locally by clicking download button

## Style Guidelines:

- Primary Color: Soft red#DC143C — conveys trust and professionalism.
- Background Color: Light Gray #F0F4F8 — clean and minimal interface.
- Accent Color: Warm black#000000 — highlight interactive elements.
- Typography: Sans-serif, modern, neutral fonts for headings and body.
- Icons: Use Material UI and shadcn icons consistently across all functionalities.
- Animations: Add smooth transitions for sidebar opening, model loading, and button hover effects.
- Layout: Left panel → configuration sidebar, Right panel → main area displaying 3D models in cards.