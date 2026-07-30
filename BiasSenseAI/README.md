# BiasSense AI — Android

Native Kotlin/Jetpack Compose Android application source. Minimum SDK 24.

## Open and run

1. Install current Android Studio with JDK 17 and Android SDK 36.
2. Open this `BiasSenseAI` directory as the project.
3. Create an Android Firebase app using package `ai.biassense.app` and place its `google-services.json` in `app/`.
4. Enable Email/Password Authentication, Cloud Firestore, App Check debug provider for debug builds, and Play Integrity for release.
5. Deploy `firestore.rules`.
6. Sync Gradle and run the `app` configuration on an API 24+ emulator.

Firebase BoM 34.16.0 and Compose BoM 2026.06.00 are used. No original document, filename, path, URI, bytes, or raw OCR text belongs in Firestore.

## Architecture

- `domain/`: immutable records, file-input validation, and deterministic metric extraction.
- `data/FirebaseSyncRepository.kt`: real-time two-way synchronization with the web app through
  `users/{uid}`, `users/{uid}/settings/preferences`, `users/{uid}/analyses`, and
  `users/{uid}/reports`.
- `MainActivity.kt`: edge-to-edge Compose navigation and accessible responsive UI.
- Firebase Authentication owns credentials; Firestore rules isolate each user's profile and completed analyses.
- App Check selects the debug provider in debug builds and Play Integrity in release.

## Web and Android synchronization

Sign in to both clients with the same Firebase Authentication account. Firestore listeners keep
profiles, preferences, analyses, findings, recommendations, report history, and health trends in
sync for that account UID. Original document bytes, paths, URIs, and raw extracted text are never
synchronized.

## Environment limitation

The source was created in an environment without Java, Gradle, Android SDK, or an emulator. Android Studio must perform the first dependency sync and compile. A real Firebase configuration is intentionally not committed.
