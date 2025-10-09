# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a GeeksforGeeks clone project - a static educational website focused on programming tutorials and coding practice. The project currently consists of a single HTML file that creates a responsive landing page mimicking the GeeksforGeeks website design.

## Architecture

### Current Structure
- **Single-page application**: The entire website is contained in `index.html`
- **Static content**: No dynamic functionality or backend services
- **Template-based design**: Uses placeholder images and static content sections
- **Responsive layout**: Designed with mobile-first approach using CSS Grid/Flexbox

### Key Sections
- **Navigation**: Header with menu items (Home, Courses, Practice, Interview, Jobs, Write)
- **Hero section**: Main call-to-action area for learning DSA
- **Articles grid**: Six featured tutorial cards with metadata
- **Practice section**: Three difficulty levels (Easy, Medium, Hard) with problem counts
- **Footer**: Multi-column layout with company links and social media

## Development Commands

Since this is a static HTML project, development is straightforward:

### Local Development
```powershell
# Open in default browser
Start-Process index.html

# Or serve with Python (if available)
python -m http.server 8000

# Or with Node.js live-server (if available)
npx live-server
```

### File Management
```powershell
# View file structure
Get-ChildItem -Recurse

# Check file size
Get-ChildItem index.html | Select-Object Name, Length
```

## Missing Components

The project references external dependencies that need to be created:

1. **styles.css**: Referenced in line 7 but not present in repository
2. **JavaScript functionality**: Hamburger menu and interactive elements need implementation
3. **Images**: Currently uses placeholder URLs that should be replaced with actual assets

## Typical Development Tasks

### Adding CSS
Create `styles.css` in the root directory and implement:
- Navigation styling and responsive behavior
- Hero section layout and typography
- Article cards grid system
- Practice section styling
- Footer multi-column layout
- Mobile hamburger menu functionality

### Adding JavaScript
Create JavaScript file for:
- Hamburger menu toggle functionality
- Smooth scrolling navigation
- Article card hover effects
- Search functionality (future feature)

### Content Management
- Replace placeholder images with actual educational graphics
- Add real article content and links
- Implement proper navigation between sections
- Add more practice problems and categories

## Browser Compatibility

The HTML structure uses modern semantic elements and should work across all modern browsers. Key considerations:
- CSS Grid and Flexbox support required
- Responsive meta viewport tag included
- Semantic HTML5 elements used throughout