#!/usr/bin/env node

/**
 * Discussion Dashboard - 3-way collaboration terminal UI
 * Displays discussion.txt with color-coded speakers and live updates
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Speaker colors
  user: '\x1b[36m',      // Cyan for User
  claude: '\x1b[32m',    // Green for Claude Code
  gemini: '\x1b[35m',    // Magenta for Gemini CLI

  // UI colors
  timestamp: '\x1b[90m', // Gray for timestamps
  divider: '\x1b[90m',   // Gray for dividers
  error: '\x1b[31m',     // Red for errors
  success: '\x1b[32m',   // Green for success
  info: '\x1b[33m',      // Yellow for info
};

const DISCUSSION_FILE = path.join(__dirname, 'discussion.txt');
let lastContent = '';
let watchTimeout = null;

// Clear screen
function clearScreen() {
  console.clear();
  // Move cursor to top
  process.stdout.write('\x1b[H');
}

// Format timestamp
function getTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour12: false });
}

// Parse discussion.txt and identify speakers
function parseDiscussion(content) {
  const sections = [];
  const lines = content.split('\n');
  let currentSection = null;
  let currentSpeaker = 'unknown';
  let buffer = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect speaker changes
    if (line.includes('**Claude Code Implementation') ||
        line.includes('**Implementation Plan:') ||
        line.includes('I have implemented') ||
        line.includes('I\'m going to') ||
        line.includes('**Implementation Completed')) {
      // Save previous section
      if (buffer.length > 0) {
        sections.push({
          speaker: currentSpeaker,
          content: buffer.join('\n')
        });
        buffer = [];
      }
      currentSpeaker = 'claude';
      buffer.push(line);
    } else if (line.includes('**Gemini CLI') ||
               line.includes('Here are my thoughts') ||
               line.includes('Based on your description')) {
      // Save previous section
      if (buffer.length > 0) {
        sections.push({
          speaker: currentSpeaker,
          content: buffer.join('\n')
        });
        buffer = [];
      }
      currentSpeaker = 'gemini';
      buffer.push(line);
    } else if (line.startsWith('USER:') || line.startsWith('User:')) {
      // Save previous section
      if (buffer.length > 0) {
        sections.push({
          speaker: currentSpeaker,
          content: buffer.join('\n')
        });
        buffer = [];
      }
      currentSpeaker = 'user';
      buffer.push(line);
    } else if (line.trim() === '---') {
      // Section divider
      if (buffer.length > 0) {
        sections.push({
          speaker: currentSpeaker,
          content: buffer.join('\n')
        });
        buffer = [];
      }
      currentSpeaker = 'unknown';
    } else {
      buffer.push(line);
    }
  }

  // Add remaining buffer
  if (buffer.length > 0) {
    sections.push({
      speaker: currentSpeaker,
      content: buffer.join('\n')
    });
  }

  return sections;
}

// Display discussion with color coding
function displayDiscussion() {
  try {
    const content = fs.readFileSync(DISCUSSION_FILE, 'utf8');

    // Only redraw if content changed
    if (content === lastContent) {
      return;
    }
    lastContent = content;

    clearScreen();

    // Header
    console.log(colors.bright + colors.info + '╔════════════════════════════════════════════════════════════════════════════╗' + colors.reset);
    console.log(colors.bright + colors.info + '║' + colors.reset + '                    ' + colors.bright + 'DISCUSSION DASHBOARD' + colors.reset + '                                  ' + colors.bright + colors.info + '║' + colors.reset);
    console.log(colors.bright + colors.info + '║' + colors.reset + '  ' + colors.user + '●' + colors.reset + ' User  ' + colors.claude + '●' + colors.reset + ' Claude Code  ' + colors.gemini + '●' + colors.reset + ' Gemini CLI                              ' + colors.bright + colors.info + '║' + colors.reset);
    console.log(colors.bright + colors.info + '╚════════════════════════════════════════════════════════════════════════════╝' + colors.reset);
    console.log();

    const sections = parseDiscussion(content);

    // Display last 20 sections to keep it manageable
    const recentSections = sections.slice(-20);

    recentSections.forEach(section => {
      let color = colors.reset;
      let prefix = '';

      switch(section.speaker) {
        case 'user':
          color = colors.user;
          prefix = '👤 USER';
          break;
        case 'claude':
          color = colors.claude;
          prefix = '🤖 CLAUDE';
          break;
        case 'gemini':
          color = colors.gemini;
          prefix = '✨ GEMINI';
          break;
        default:
          color = colors.dim;
          prefix = '📝';
      }

      if (section.speaker !== 'unknown') {
        console.log(colors.divider + '─'.repeat(80) + colors.reset);
        console.log(color + colors.bright + prefix + colors.reset + colors.timestamp + ' [' + getTimestamp() + ']' + colors.reset);
        console.log();
      }

      // Display content with proper indentation
      const lines = section.content.split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          console.log(color + line + colors.reset);
        } else {
          console.log();
        }
      });
      console.log();
    });

    // Footer with commands
    console.log(colors.divider + '═'.repeat(80) + colors.reset);
    console.log(colors.info + '📝 Commands: ' + colors.reset +
                colors.bright + 'append' + colors.reset + ' (add message) | ' +
                colors.bright + 'refresh' + colors.reset + ' (reload) | ' +
                colors.bright + 'quit' + colors.reset + ' (exit)');
    console.log(colors.divider + '═'.repeat(80) + colors.reset);

  } catch (error) {
    console.error(colors.error + '❌ Error reading discussion.txt:' + colors.reset, error.message);
  }
}

// Watch for file changes
function watchFile() {
  fs.watch(DISCUSSION_FILE, (eventType, filename) => {
    if (eventType === 'change') {
      // Debounce rapid changes
      clearTimeout(watchTimeout);
      watchTimeout = setTimeout(() => {
        displayDiscussion();
        showPrompt();
      }, 100);
    }
  });
}

// Append message to discussion
function appendToDiscussion(speaker, message) {
  const timestamp = new Date().toISOString();
  const entry = `\n---\n\n**${speaker}** [${timestamp}]\n\n${message}\n\n---\n`;

  fs.appendFileSync(DISCUSSION_FILE, entry);
  console.log(colors.success + '✓ Message added to discussion' + colors.reset);
}

// Show input prompt
function showPrompt() {
  process.stdout.write('\n' + colors.bright + '> ' + colors.reset);
}

// Main function
function main() {
  console.log(colors.info + '🚀 Starting Discussion Dashboard...' + colors.reset);

  // Check if discussion.txt exists
  if (!fs.existsSync(DISCUSSION_FILE)) {
    console.error(colors.error + '❌ discussion.txt not found!' + colors.reset);
    process.exit(1);
  }

  // Initial display
  displayDiscussion();

  // Start watching for changes
  watchFile();
  console.log(colors.success + '👀 Watching discussion.txt for changes...' + colors.reset);
  console.log();

  // Setup readline for user input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: colors.bright + '> ' + colors.reset
  });

  rl.prompt();

  rl.on('line', (input) => {
    const cmd = input.trim().toLowerCase();

    if (cmd === 'quit' || cmd === 'exit' || cmd === 'q') {
      console.log(colors.info + '\n👋 Goodbye!' + colors.reset);
      rl.close();
      process.exit(0);
    } else if (cmd === 'refresh' || cmd === 'r') {
      displayDiscussion();
    } else if (cmd === 'append' || cmd === 'a') {
      rl.question(colors.user + 'Your message: ' + colors.reset, (message) => {
        if (message.trim()) {
          appendToDiscussion('USER', message);
          displayDiscussion();
        }
        rl.prompt();
      });
      return;
    } else if (cmd === 'help' || cmd === 'h') {
      console.log('\n' + colors.info + '📚 Commands:' + colors.reset);
      console.log('  ' + colors.bright + 'append' + colors.reset + ' (a) - Add a message to the discussion');
      console.log('  ' + colors.bright + 'refresh' + colors.reset + ' (r) - Reload the discussion');
      console.log('  ' + colors.bright + 'quit' + colors.reset + ' (q) - Exit the dashboard');
      console.log('  ' + colors.bright + 'help' + colors.reset + ' (h) - Show this help\n');
    } else if (input.trim()) {
      // Treat any other input as a direct message
      appendToDiscussion('USER', input);
      displayDiscussion();
    }

    rl.prompt();
  });

  rl.on('close', () => {
    console.log(colors.info + '\n👋 Dashboard closed' + colors.reset);
    process.exit(0);
  });
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  console.error(colors.error + '\n❌ Error:' + colors.reset, error.message);
});

process.on('SIGINT', () => {
  console.log(colors.info + '\n\n👋 Interrupted. Goodbye!' + colors.reset);
  process.exit(0);
});

// Start the dashboard
main();
