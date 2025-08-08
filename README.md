# ChatGPT Prompt Tracker

A Chrome extension that tracks and displays your prompts in ChatGPT conversations, making it easy to navigate and copy previous prompts.

### Design Principles

- **Minimalist**
- **Clean**
- **Non-Intrusive**
- **Performant**

## Features

- 🎯 **Prompt Tracking**: Automatically tracks all your prompts in ChatGPT conversations
- 📋 **Click to Copy**: Easy one-click copying of any prompt to clipboard
- 🎨 **Modern UI**: Clean, modern interface with smooth animations
- 🔍 **Quick Navigation**: Jump to any prompt in the conversation instantly
- 💾 **Persistent Storage**: Prompts are saved per conversation and persist across sessions
- 🎪 **Visual Feedback**: Hover effects, copy confirmations, and smooth transitions

## Installation

### Install from Chrome Web Store (Coming Soon)
*This extension will be available on the Chrome Web Store soon.*

## How to Use

1. **Open ChatGPT**: Navigate to ChatGPT in your browser
2. **Start Chatting**: Begin a conversation - your prompts will be automatically tracked
3. **View Prompts**: Click the "Prompts" button in the top-right to open the sidebar
4. **Copy Prompts**: Click the copy icon on any prompt to copy it to your clipboard
5. **Navigate**: Click "Jump to" or click anywhere on a prompt card to scroll to that prompt in the conversation

## Features in Detail

### Prompt Cards
Each prompt is displayed in a modern card with:
- **Prompt Number**: Sequential numbering for easy reference
- **Copy Button**: One-click copying with visual feedback
- **Jump Button**: Quick navigation to the prompt in the conversation
- **Smart Truncation**: Long prompts are intelligently truncated with fade effects

### Visual Design
- **Glass Effect**: Modern frosted glass appearance with backdrop blur
- **Smooth Animations**: Subtle hover effects and transitions
- **Responsive Design**: Works well on different screen sizes
- **Copy Feedback**: Toast notifications confirm successful copying

### Data Management
- **Per-Conversation Storage**: Each conversation's prompts are stored separately
- **Automatic Cleanup**: Prompts are removed when conversations are deleted
- **Persistent Storage**: Data persists across browser sessions

## Permissions

This extension requires the following permissions:
- **Storage**: To save prompts locally in your browser
- **Active Tab**: To interact with ChatGPT pages
- **Host Permissions**: For ChatGPT domains (chatgpt.com, chat.openai.com)

## Privacy

- All data is stored locally in your browser
- No data is sent to external servers
- Prompts are only stored for ChatGPT conversations
- Data is automatically cleaned up when conversations are deleted

## Development

### File Structure
```
├── manifest.json       # Extension manifest
├── content.js          # Main content script
└── README.md           # Documentation
```

## Changelog

### Version 1.0
- Initial release
- Basic prompt tracking functionality
- Modern UI with glass effects
- Click-to-copy functionality
- Jump-to-prompt navigation
- Per-conversation storage
