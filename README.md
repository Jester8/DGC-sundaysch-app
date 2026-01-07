![Screenshot_20260107_101904_DGC-Discpleship](https://github.com/user-attachments/assets/8b51736d-12a0-4315-abda-cb93364b63b1)
![Screenshot_20260107_101901_DGC-Discpleship](https://github.com/user-attachments/assets/bc2c3130-1d9f-40cd-af7e-6b5e080b9526)
![Screenshot_20260107_101916_DGC-Discpleship](https://github.com/user-attachments/assets/e1987aa0-1bf5-4839-b850-c3d55e72f8af)
![Screenshot_20260107_101907_DGC-Discpleship](https://github.com/user-attachments/assets/20c82953-64ee-4010-a917-fe4754a722e3)
![Screenshot_20260107_101927_DGC-Discpleship](https://github.com/user-attachments/assets/592e3b89-7675-4e64-90f1-ab782b4514f0)
![Screenshot_20260107_102017_DGC-Discpleship](https://github.com/user-attachments/assets/d849cece-beef-478c-b5d8-3e3368f86b70)
![Screenshot_20260107_102014_DGC-Discpleship](https://github.com/user-attachments/assets/82345d7f-cf6a-4a91-b089-56b7132b7468)
![Screenshot_20260107_102003_DGC-Discpleship](https://github.com/user-attachments/assets/f90b6ffc-a4b3-4edf-9c4f-c1c774dd3fe9)
![Screenshot_20260107_101958_DGC-Discpleship](https://github.com/user-attachments/assets/213124ff-6e26-4938-bb5e-ea1b5ff863da)
![Screenshot_20260107_101944_DGC-Discpleship](https://github.com/user-attachments/assets/3e3d5573-a4d1-4ed9-8db8-03ef1b8c9475)
![Screenshot_20260107_101937_DGC-Discpleship](https://github.com/user-attachments/assets/96c144c7-b694-46d4-b80e-138e8f9b64ac)



# Davidic Generation Church Sunday School App



A comprehensive Sunday School study  app built for the Davidic Generation Church . The app provides interactive Bible study materials with integrated Bible translations, note-taking capabilities, and a beautiful user interface that adapts to light and dark modes.

## Features

### 📚 Core Features
- **Splash Screen** - Beautiful animated welcome screen with app branding
- **Onboarding Flow** - Interactive tutorial for first-time users
- **Home Dashboard** - Quick access to all study materials and features

- **Monthly Study Manuals** - Organized Bible study outlines by month
- **Progressive Unlock System** - Manuals unlock on a scheduled basis (Jan 4th start, every 4 days)
- **Advanced Search** - Search across titles, themes, scriptures, and content
- **Notes Section** - Create, edit, and manage personal study notes

### 📖 Bible Integration
- **Multiple Translations** - Support for 4 major Bible versions:
  - NKJV (New King James Version)
  - NLT (New Living Translation)
  - NIV (New International Version)
  - AMP (Amplified Bible)
  - MSG (The Message)
- **Bible API Integration** - Real-time Bible verse fetching and display
- **Verse Lookup** - Quick verse reference search
- **Memory Verses** - Highlight and store memory verses

### 🎨 User Interface
- **Dark Mode & Light Mode** - Full theme support with system preference detection
- **Responsive Design** - Optimized for all device sizes (phones, tablets)
- **Smooth Animations** - Fluid transitions and interactive elements
- **Accessible Navigation** - Bottom tab navigation for easy access
- **Image Support** - Cover images and banner artwork for manuals

### ⚙️ Technical Features
- **Local Caching** - AsyncStorage for offline access to previously loaded content
- **API Integration** - REST API backend for fetching study materials
- **State Management** - React Context for theme and navigation state
- **Performance Optimized** - Lazy loading and efficient rendering
- **Error Handling** - Graceful fallbacks for network failures

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **React Native** | Cross-platform mobile framework |
| **Expo CLI** | Development and build tooling |
| **JavaScript/TypeScript** | Primary language |
| **AsyncStorage** | Local data persistence |
| **React Navigation** | Navigation management |
| **Bible API** | Bible verse data |
| **Feather Icons** | Icon library |
| **Material Icons** | Material design icons |

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Expo CLI** - Will be installed in the project
- **Git** - For version control
- **Android Emulator** or **iOS Simulator** (optional, for local testing)
  - Or an actual mobile device with Expo Go app installed

### System Requirements
- **RAM**: Minimum 4GB
- **Disk Space**: 2-3GB free space
- **Internet Connection**: Required for development and API calls

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/dgc-sunday-school-app.git
cd dgc-sunday-school-app
```

### Step 2: Install Dependencies

Using npm:
```bash
npm install
```

Or using yarn:
```bash
yarn install
```

### Step 3: Install Expo CLI (if not already installed)

```bash
npm install -g expo-cli
```

### Step 4: Set Up Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_API_BASE_URL=https://dgc-backend.onrender.com
EXPO_PUBLIC_BIBLE_API_KEY=your_bible_api_key_here
EXPO_PUBLIC_APP_VERSION=1.0.0
```

Get your Bible API key from [Bible API](https://api.scripture.api.bible/) or your preferred provider.

### Step 5: Verify Installation

```bash
npm list react-native
npm list expo
expo --version
```

## Running the App

### Development Mode with Expo

```bash
expo start
```

This will start the Expo development server and display a QR code.

### Option A: Run on Physical Device

1. Download the **Expo Go** app from your device's app store (iOS App Store or Google Play Store)
2. Open Expo Go app
3. Scan the QR code displayed in your terminal
4. The app will load and run on your device

### Option B: Run on Android Emulator

```bash
expo start --android
```

Prerequisites:
- Android Studio installed
- Android Emulator configured and running
- Java Development Kit (JDK) installed

### Option C: Run on iOS Simulator (Mac only)

```bash
expo start --ios
```

Prerequisites:
- Xcode installed
- iOS Simulator running

### Option D: Web Preview (Limited features)

```bash
expo start --web
```

Opens in your default browser at `http://localhost:19006`

## Building for Production

### Android APK Build

```bash
eas build --platform android --profile preview
```

### iOS Build

```bash
eas build --platform ios --profile preview
```

### Full Production Build

```bash
eas build --platform all
```

**Note**: You need to:
- Create an Expo account at [expo.dev](https://expo.dev/)
- Run `expo login` to authenticate
- Follow the EAS Build prompts

## Project Structure

```
dgc-sunday-school-app/
├── .expo/                        # Expo configuration cache
├── .vscode/                      # VS Code settings
├── app/
│   ├── Home/
│   │   ├── _navigationContext.tsx   # Theme & navigation context
│   │   ├── BottomTabNavigation.tsx  # Bottom navigation component
│   │   ├── card.tsx                 # Card component
│   │   ├── header.tsx               # Header component
│   │   ├── home.tsx                 # Home screen
│   │   ├── January4ManualDetail.tsx # January 4th manual detail view
│   │   ├── ManualDetail.tsx         # Manual detail view
│   │   ├── Notepad.tsx              # Notes section
│   │   ├── notes.tsx                # Notes management
│   │   ├── outline.tsx              # Main manuals/outline screen
│   │   ├── recommended.tsx          # Recommended manuals
│   │   ├── Signup.tsx               # Signup screen
│   │   └── layout.tsx               # Layout wrapper
│   ├── _navigationContext.tsx    # Global navigation context
│   ├── BottomTabNavigation.tsx   # Bottom tab navigation
│   ├── createManualIs.js         # Manual creation utility
│   ├── onboarding.tsx            # Onboarding screens
│   ├── King.png                  # King image asset
│   ├── apple.png                 # Apple branding image
│   └── index.tsx                 # App entry point & splash screen
├── assets/
│   └── images/                   # App images and banner artwork
├── node_modules/                 # Installed dependencies
├── .gitignore                    # Git ignore rules
├── app.json                      # Expo configuration
├── package.json                  # Project dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
├── README.md                     # This file
└── .env                          # Environment variables (not in repo)
```

## File Descriptions

### Core App Files
- **index.tsx** - Entry point with splash screen logic
- **onboarding.tsx** - First-time user onboarding flow
- **_navigationContext.tsx** - Global theme and navigation state management
- **BottomTabNavigation.tsx** - Navigation tabs (Home, Outline, Notepad, etc.)

### Home Directory (Main Screens)
- **home.tsx** - Dashboard/home screen
- **outline.tsx** - Monthly study manuals browser with search
- **ManualDetail.tsx** - Detailed view for study manuals
- **January4ManualDetail.tsx** - Special layout for January 4th manual
- **Notepad.tsx** - Notes creation and management
- **notes.tsx** - Notes data handling
- **recommended.tsx** - Recommended manuals section
- **Signup.tsx** - User registration screen
- **header.tsx** - Reusable header component
- **card.tsx** - Reusable card component

### Utilities
- **createManualIs.js** - Utility for manual creation and management
- **King.png** & **apple.png** - UI image assets

## Key Configuration Files

### app.json
Expo configuration file containing:
- App name: "DGC Sunday School"
- App version and build number
- Splash screen configuration
- Icon and branding settings
- iOS and Android specific configurations
- Plugins and permissions

### package.json
Lists all project dependencies and scripts:
```json
{
  "name": "dgc-sundaysch-app",
  "version": "1.0.0",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "react-native": "0.73.x",
    "expo": "^51.0.0",
    "expo-router": "^3.x",
    "react-navigation": "^6.x",
    "@react-native-async-storage/async-storage": "^1.x",
    "@expo/vector-icons": "^13.x"
  }
}
```

### tsconfig.json
TypeScript configuration for type checking and compilation:
- ES2020+ target
- Strict mode enabled
- React Native resolution paths
- Path aliases configured

## Usage Guide

### First Time Users
1. Launch the app - you'll see the splash screen
2. Complete the onboarding tutorial (swipe through 3-4 screens)
3. Choose your theme preference (Dark/Light mode)
4. Explore the home dashboard

### Accessing Study Manuals
1. Navigate to the **Outline** tab
2. Browse manuals by month
3. Tap a month to expand and see available manuals
4. Locked manuals show a lock icon - they'll unlock on the scheduled date
5. Tap an unlocked manual to view details

### Reading Bible Verses
1. Open any manual detail view
2. Scroll to find Bible references
3. Tap the translation selector to switch between NKJV, NLT, NIV, AMP, MSG
4. Verses are displayed with formatting and reference information

### Taking Notes
1. In the manual detail view, scroll to the Notes section
2. Tap "Add Note" to create a new note
3. Type your notes and tap "Save"
4. Notes are stored locally and persist between sessions
5. Edit or delete notes by tapping the note

### Toggling Theme
1. Tap the theme toggle in the top navigation (sun/moon icon)
2. The entire app adapts to light or dark mode instantly
3. Theme preference is saved to device storage

### Searching Manuals
1. Tap the search icon on the Outline screen
2. Type keywords to search across:
   - Manual titles
   - Themes
   - Bible verses
   - Dates
3. Results appear instantly with matching highlights

## API Endpoints

The app communicates with the backend API:

```
Base URL: https://dgc-backend.onrender.com

GET /api/manuals/all
- Fetches all monthly study manuals
- Response: Monthly organized manual data

GET /api/manuals/:id
- Fetches single manual details
- Response: Detailed manual with all content

GET /api/notes
- Fetches user notes
- Response: Array of saved notes

POST /api/notes
- Creates new note
- Body: { title, content, manualId }
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_BASE_URL` | Backend API URL | `https://dgc-backend.onrender.com` |
| `EXPO_PUBLIC_BIBLE_API_KEY` | Bible API authentication | `your-api-key` |
| `EXPO_PUBLIC_APP_VERSION` | App version number | `1.0.0` |

## Troubleshooting

### App won't start
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
expo start --clear
```

### Expo Go app not connecting
- Ensure your device and computer are on the same WiFi network
- Restart Expo server: Press `Ctrl+C` then `expo start`
- Restart Expo Go app on your device

### Bible API not loading verses
- Verify Bible API key in `.env` file
- Check network connection
- Confirm API service is running

### Dark mode not switching
- Clear app cache: Settings > Apps > DGC Sunday School > Clear Cache
- Restart the app

### Images not loading
- Check internet connection
- Verify image URLs in manual data
- Clear Expo cache: `expo start --clear`

### AsyncStorage data lost
- Data persists locally - check device storage
- For Android: Settings > Apps > DGC Sunday School > Storage > Clear Cache
- For iOS: Usually persists unless app is uninstalled

## Performance Tips

1. **Optimize Images**: Use compressed images (max 500KB per image)
2. **Lazy Loading**: Manuals load on demand to save bandwidth
3. **Caching**: First load fetches from API, subsequent loads use cache
4. **Memory**: App efficiently manages memory with proper cleanup
5. **Network**: Offline functionality available through cached data

## Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style
- Follow React/React Native best practices
- Use TypeScript for type safety
- Write meaningful commit messages
- Add comments for complex logic

## Contributors

- **Olusanya Samuel A.** - Lead Developer
  - Full-stack development
  - UI/UX implementation
  - Bible API integration
  - Theme system design

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support & Feedback

For issues, questions, or feedback:

- **GitHub Issues**: [Create an issue](https://github.com/yourusername/dgc-sunday-school-app/issues)
- **Email**: support@dgchurch.com
- **Church Website**: [www.dgchurch.com](https://www.dgchurch.com)

## Version History

### v1.0.0 (Current)
- ✅ Splash screen and onboarding
- ✅ Monthly study manuals
- ✅ Bible verse integration (5 translations)
- ✅ Dark/Light mode support
- ✅ Notes section
- ✅ Search functionality
- ✅ Progressive unlock system
- ✅ Responsive design
- ✅ Local caching

## Future Enhancements

- 🔔 Push notifications for new manuals
- 👥 Community discussion features
- 📊 Progress tracking and statistics
- 🎙️  Daily Devotionals 
- 🌐 Multi-language support
- 📱 Tablet optimization
- 💾 Cloud backup for notes

## Acknowledgments

- **Davidic Generation Church** - Spiritual guidance and content
- **React Native Community** - Framework and ecosystem
- **Expo Team** - Development tools and documentation
- **Bible API Provider** - Scripture data
- **All Contributors** - Code and feedback

## Contact

**Davidic Generation Church**
- Website :https://davidicgenerationchurch.com


---

**Last Updated**: January 2026
**Maintained By**: Olusanya Samuel A.
