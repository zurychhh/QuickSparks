import express from 'express';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const router = express.Router();
const writeFileAsync = promisify(fs.writeFile);
const appendFileAsync = promisify(fs.appendFile);
const mkdirAsync = promisify(fs.mkdir);

// Define the logs directory
const logsDir = path.join(__dirname, '../../debug-logs');

// Ensure logs directory exists
const ensureLogsDir = async () => {
  try {
    await mkdirAsync(logsDir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      console.error('Failed to create logs directory:', err);
    }
  }
};

// Initialize the logs directory
ensureLogsDir();

// Format log entries for writing to file
const formatLogEntry = (entry) => {
  return `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.source}] ${entry.message}\n` +
    (entry.data ? `DATA: ${JSON.stringify(entry.data, null, 2)}\n` : '') +
    `URL: ${entry.url}\n` +
    `User-Agent: ${entry.userAgent}\n` +
    `Session: ${entry.sessionId || 'unknown'}\n` +
    '------------------------\n';
};

// Write logs to a file based on session ID
const writeLogsToFile = async (logs, sessionId) => {
  // Ensure the directory exists
  await ensureLogsDir();
  
  // Create a filename with session ID and date
  const date = new Date().toISOString().split('T')[0];
  const filename = `${date}-${sessionId || 'unknown'}.log`;
  const filepath = path.join(logsDir, filename);
  
  try {
    // Format each log entry
    const logContent = logs.map(formatLogEntry).join('\n');
    
    // Check if file exists and append or create
    if (fs.existsSync(filepath)) {
      await appendFileAsync(filepath, logContent);
    } else {
      await writeFileAsync(filepath, logContent);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to write logs to file:', error);
    return false;
  }
};

// Helper to create index file of active sessions
const updateSessionsIndex = async () => {
  try {
    // Get all log files
    const files = fs.readdirSync(logsDir).filter(file => file.endsWith('.log'));
    
    // Extract unique session IDs and creation dates
    const sessions = files.map(file => {
      const parts = file.split('-');
      const date = parts[0];
      const sessionId = parts.slice(1).join('-').replace('.log', '');
      const stats = fs.statSync(path.join(logsDir, file));
      
      return {
        sessionId,
        date,
        lastUpdated: stats.mtime,
        size: stats.size
      };
    });
    
    // Sort by last updated, most recent first
    sessions.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
    
    // Write index file
    await writeFileAsync(
      path.join(logsDir, 'sessions.json'),
      JSON.stringify({ 
        sessions,
        lastUpdated: new Date().toISOString() 
      }, null, 2)
    );
  } catch (error) {
    console.error('Failed to update sessions index:', error);
  }
};

// Endpoint to receive logs
router.post('/logs', async (req, res) => {
  try {
    const { logs } = req.body;
    
    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid log format. Expected array of log entries.'
      });
    }
    
    // Get session ID from the first log entry
    const sessionId = logs[0]?.sessionId || 'unknown';
    
    // Write logs to file
    await writeLogsToFile(logs, sessionId);
    
    // Update sessions index
    updateSessionsIndex();
    
    // Also log to console for immediate visibility
    console.log(`Received ${logs.length} log entries from session ${sessionId}`);
    
    // Send back a simple confirmation
    res.status(200).json({
      success: true,
      message: `Received ${logs.length} log entries`,
      sessionId
    });
  } catch (error) {
    console.error('Error processing logs:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Endpoint to list available sessions
router.get('/sessions', async (req, res) => {
  try {
    const sessionsPath = path.join(logsDir, 'sessions.json');
    
    if (!fs.existsSync(sessionsPath)) {
      await updateSessionsIndex();
    }
    
    const sessionsData = JSON.parse(fs.readFileSync(sessionsPath, 'utf8'));
    
    res.status(200).json(sessionsData);
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Endpoint to get logs for a specific session
router.get('/logs/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { date } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }
    
    // Construct the log filename
    const fileDate = date || new Date().toISOString().split('T')[0];
    const filename = `${fileDate}-${sessionId}.log`;
    const filepath = path.join(logsDir, filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        message: 'Log file not found'
      });
    }
    
    // Read the log file
    const logContent = fs.readFileSync(filepath, 'utf8');
    
    // Return the logs
    res.status(200).json({
      success: true,
      sessionId,
      date: fileDate,
      logs: logContent
    });
  } catch (error) {
    console.error('Error getting logs:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;