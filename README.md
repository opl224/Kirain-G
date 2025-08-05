# Kirain'G

Kirain'G is a modern, minimalist social web application designed for sharing thoughts and notes. It features a clean, content-focused interface and is built with Capacitor for native mobile app deployment on iOS and Android.

## Core Features

- **Home Feed**: Browse a feed of text posts from other users in a clean, minimalist card format.
- **Post Editor**: A simple, notepad-like editor to create and share your own notes.
- **Notifications**: Stay updated with notifications for follows and likes.
- **Unique Profile Page**: A visually distinct profile section that blends 3D isometric and modern flat design aesthetics.
- **Mobile Ready**: Built with Capacitor, the app can be compiled into native iOS and Android applications.

## Getting Started

To get started with the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:9002](http://localhost:9002).

## Building for Mobile

This project is configured to be built as a native mobile app using Capacitor.

1.  **Build the web assets:**
    ```bash
    npm run build
    ```
    This command builds the Next.js application and exports it as static files to the `out/` directory.

2.  **Add Mobile Platforms (if not already added):**
    ```bash
    npx cap add android
    npx cap add ios
    ```

3.  **Sync Web Assets with Native Platforms:**
    ```bash
    npx cap sync
    ```
    This command copies the web build into the native projects.

4.  **Open and Run in Native IDEs:**
    ```bash
    npx cap open android
    npx cap open ios
    ```
