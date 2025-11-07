# AI Virtual Staging for Real Estate

Transform empty property photos into beautifully staged rooms using Google Gemini AI. This application helps real estate agents and property sellers create professional virtual staging with consistent design across all rooms.

## Features

- **20-Question Design Questionnaire**: Capture detailed client preferences for personalized staging
- **Multi-Image Upload**: Stage multiple rooms in one session
- **AI-Powered Analysis**: Uses Google Gemini to analyze room dimensions, lighting, and features
- **Consistent Design**: Maintains the same style, colors, and furniture aesthetics across all rooms
- **Detailed Recommendations**: Get specific furniture, decor, and color suggestions
- **Real-time Processing**: View staging recommendations as they're generated
- **Professional Results**: Designed specifically for real estate marketing

## Design Consistency Features

The application ensures consistency by:
- Using the same color palette across all rooms
- Maintaining consistent furniture styles
- Matching wood finishes and metal accents
- Creating cohesive flow between spaces
- Applying the same design aesthetic throughout

## Prerequisites

- Node.js 18.0.0 or higher
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-virtual-staging.git
   cd ai-virtual-staging
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Add your Gemini API key**

   Edit `.env` file and add your API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

## Usage

1. **Start the server**
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

2. **Open the application**

   Navigate to `http://localhost:3000` in your web browser

3. **Complete the workflow**

   - **Step 1**: Answer 20 design preference questions
   - **Step 2**: Upload photos of empty rooms
   - **Step 3**: Review AI-generated staging recommendations

## How It Works

### 1. Design Preferences Collection

The questionnaire captures:
- Property type and target buyer demographic
- Design style and color preferences
- Furniture and decor preferences
- Lighting and atmosphere requirements
- Consistency requirements

### 2. Image Analysis

For each uploaded image, Gemini AI:
- Identifies the room type
- Analyzes existing features (windows, flooring, dimensions)
- Evaluates lighting conditions
- Assesses architectural details

### 3. Staging Recommendations

The AI generates:
- Specific furniture placement and layout
- Detailed furniture and decor lists
- Color scheme recommendations
- Lighting fixture suggestions
- Textile recommendations (rugs, curtains, pillows)
- Wall art and plant suggestions

### 4. Design Consistency

The system ensures consistency by:
- Sharing design context across all images
- Referencing previous room designs
- Enforcing style guidelines from questionnaire
- Maintaining visual continuity

## API Endpoints

### `POST /api/generate-staging`

Generate staging recommendations for uploaded images.

**Request Body:**
```json
{
  "preferences": {
    "propertyType": "house",
    "designStyle": "modern",
    "colorPalette": "neutral-whites",
    ...
  },
  "images": [
    {
      "name": "living-room.jpg",
      "data": "data:image/jpeg;base64,..."
    }
  ]
}
```

**Response:**
```json
[
  {
    "roomType": "Living Room",
    "description": "A bright, modern living space...",
    "suggestions": "Furniture: Modern sectional sofa...",
    "imageUrl": "data:image/jpeg;base64,...",
    "details": {
      "furniturePieces": [...],
      "colorScheme": "...",
      "decorElements": [...]
    }
  }
]
```

### `GET /api/health`

Check server and API configuration status.

**Response:**
```json
{
  "status": "ok",
  "geminiConfigured": true
}
```

## Project Structure

```
.
├── index.html          # Main HTML interface
├── styles.css          # Styling and responsive design
├── app.js             # Frontend JavaScript logic
├── server.js          # Express backend with Gemini integration
├── package.json       # Dependencies and scripts
├── .env.example       # Environment variable template
├── .gitignore         # Git ignore rules
└── README.md          # This file
```

## Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **AI**: Google Gemini 2.0 Flash Exp
- **Image Processing**: Base64 encoding

## Limitations

- Current version provides staging recommendations only (descriptions of furniture and decor)
- Does not generate actual staged images (would require additional image generation AI)
- Image uploads limited to 50MB total
- Processing time depends on number of images and Gemini API response time

## Future Enhancements

- [ ] Integration with image generation AI for actual staged photos
- [ ] Save and share staging designs
- [ ] Export recommendations as PDF
- [ ] User accounts and project management
- [ ] Template library for common property types
- [ ] Cost estimation for actual staging
- [ ] AR preview on mobile devices

## Troubleshooting

### "GEMINI_API_KEY not configured" error

Make sure you have:
1. Created a `.env` file (copy from `.env.example`)
2. Added your actual Gemini API key
3. Restarted the server

### Images not uploading

- Check file size (max 50MB total)
- Ensure images are in supported formats (JPEG, PNG, WebP)
- Check browser console for errors

### Slow processing

- Gemini API may take 2-5 seconds per image
- Multiple images are processed sequentially
- Check your internet connection

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

## Acknowledgments

- Google Gemini for AI capabilities
- Real estate staging best practices from industry professionals
- Interior design principles from professional designers

---

**Note**: This application requires a valid Google Gemini API key. The API has usage limits and costs associated with it. Please review Google's pricing and terms before use.
