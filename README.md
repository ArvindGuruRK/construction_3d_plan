# builderAI

Welcome to builderAI, an AI-powered 3D floor plan generation tool. This application allows you to configure various parameters for a floor plan and generate multiple 3D variations using generative AI.

## Tech Stack

This project is built with the following technologies:

- **Next.js**: A React framework for building server-rendered applications.
- **React**: A JavaScript library for building user interfaces.
- **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript.
- **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
- **ShadCN UI**: A collection of re-usable components built using Radix UI and Tailwind CSS.
- **Genkit**: An open-source framework from Google for building AI-powered applications.

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

2.  **Set up environment variables:**
    Create a `.env.local` file in the root of the project and add your Gemini API key:
    ```
    GEMINI_API_KEY=your_api_key_here
    ```

### Running the Development Server

To start the application in development mode, run:

```bash
npm run dev
```

This will start the Next.js development server, usually on `http://localhost:3000`.

To start the Genkit developer UI, which allows you to inspect and test your AI flows, run the following command in a separate terminal:

```bash
npm run genkit:watch
```

This will typically be available at `http://localhost:4000`.

## How It Works

The application provides a seamless experience for generating architectural designs.

1.  **Configuration**: On the left sidebar, you can specify your desired floor plan attributes, such as units (Metric/Imperial), number of floors, total area, and the exact number of different rooms (bedrooms, bathrooms, etc.).
2.  **Generation**: Clicking the "Generate Plans" button triggers a Next.js Server Action.
3.  **Backend AI Flow**: The Server Action calls the `generatePlanVariations` Genkit flow, passing the user's configuration. This flow is currently a placeholder but is designed to interact with an AI model to generate four unique floor plan variations.
4.  **Mock Data**: While the AI generation is being simulated, the application currently returns a set of predefined placeholder images to display as results.
5.  **Display Results**: The generated variations are displayed in the main viewing area as interactive cards.

## Architecture and Routing

This application uses the Next.js App Router. Communication between the frontend and backend logic is handled primarily through **Next.js Server Actions**, which eliminates the need for traditional API routes.

-   **`src/app/page.tsx`**: The main entry point of the application UI. It contains the configuration form and the results grid.
-   **`src/app/actions.ts`**: This file contains the `getPlanVariations` Server Action. When the user submits the form, this server-side function is invoked directly from the client component. It is responsible for calling the Genkit AI flow and returning the results.
-   **`src/ai/flows/generate-plan-variations.ts`**: This is the core AI logic, defined as a Genkit flow. It takes the floor plan configuration as input and is responsible for prompting the AI model. Currently, it returns mock data, but it's where the actual AI interaction for generating 3D models would be implemented.

## Folder Structure

Here is a brief overview of the key directories:

-   `src/app/`: Contains the pages and layouts for the Next.js application (App Router). The primary logic is within `page.tsx` (the UI) and `actions.ts` (the server-side logic).
-   `src/ai/`: Holds all the Genkit-related code. The `flows` subdirectory contains the main AI orchestration logic. `genkit.ts` configures the Genkit instance and the AI model to be used.
-   `src/components/`: Contains reusable React components.
    -   `ui/`: Generic UI components provided by ShadCN.
    -   `arch-ai/`: Components specific to this application, such as the `ConfigPanel`, `ViewerGrid`, and `ModelCard`.
-   `src/lib/`: Includes utility functions (`utils.ts`), Zod schemas for form validation (`schemas.ts`), and placeholder data (`placeholder-images.ts`).
-   `public/`: For static assets like images and future 3D models.
