# ArchAI 3D

Welcome to ArchAI 3D, a procedural 3D floor plan generation tool. This application allows you to configure various parameters for a floor plan and generate multiple 3D variations directly in your browser.

## Tech Stack

This project is built with the following technologies:

- **Next.js 15**: A React framework for building server-rendered applications.
- **React 19**: A JavaScript library for building user interfaces.
- **React Three Fiber / Three.js**: For rendering interactive 3D models in the browser.
- **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript.
- **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
- **ShadCN UI**: A collection of re-usable components built using Radix UI and Tailwind CSS.
- **Zod**: For schema validation of the configuration form.

## Getting Started

To get this project up and running on your local machine, follow these steps:

### Prerequisites

Make sure you have Node.js (v18 or later recommended) and npm installed.

### Installation & Setup

1.  **Install dependencies:**
    Open your terminal, navigate to the project directory, and run:
    ```bash
    npm install
    ```

2.  **Run the development server:**
    To start the application in development mode, run:
    ```bash
    npm run dev
    ```
    This will start the Next.js development server, usually on `http://localhost:9002`.

## How It Works

The application provides a seamless experience for generating architectural designs.

1.  **Configuration**: On the left sidebar, you can specify your desired floor plan attributes, such as total area, room counts, and the average size of each room type.
2.  **Generation**: Clicking the "Generate Plan" button triggers a client-side procedural generation algorithm.
3.  **3D Generation Engine**: The core logic runs entirely in your browser. It uses a sophisticated algorithm to calculate a plausible room layout based on your inputs and then constructs a 3D model with walls, floors, doors, and windows using React Three Fiber.
4.  **Display Results**: The generated 3D model appears in an interactive viewer where you can pan, zoom, and orbit to inspect the design.
5.  **Interaction**: You can regenerate a new variation with a single click or download the current model as a `.gltf` file for use in other 3D software.

For a detailed technical breakdown of the 3D generation engine, please see [**3D-GENERATION.md**](./3D-GENERATION.md).

## Deployment to Netlify

You can deploy this application to Netlify by following these steps:

1.  **Push to Git**: Make sure your project code is in a GitHub, GitLab, or Bitbucket repository.
2.  **Create a New Site**: Log in to your Netlify account and click the "Add new site" or "Import from Git" button.
3.  **Connect Repository**: Choose your Git provider and select the repository for this project.
4.  **Configure Build Settings**: Netlify will automatically detect the `netlify.toml` file in your project and use the correct build command (`npm run build`) and publish directory (`.next`).
5.  **Deploy**: Click "Deploy site." Netlify will start the build process and deploy your application.

*Note: This project does not require server-side API keys for its core functionality, as the 3D generation is client-side.*

## Architecture and Routing

This application uses the Next.js App Router and a client-centric architecture.

-   **`src/app/page.tsx`**: The main entry point of the application UI. It contains the configuration form and the results grid.
-   **`src/components/arch-ai/interactive-viewer.tsx`**: This is the heart of the application, containing the client-side procedural generation logic and the React Three Fiber scene.
-   **`src/components/arch-ai/config-panel.tsx`**: The sidebar form where users input their requirements.
-   **`src/lib/schemas.ts`**: Contains the Zod schema used for validating the user's configuration input.
-   **`/public`**: For static assets.

For a more detailed explanation of the architecture, components, and data flow, see [**3D-GENERATION.md**](./3D-GENERATION.md).
