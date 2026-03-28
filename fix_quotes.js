const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}
let c = 0;
walkDir('./client/src', function(filePath) {
    if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        // Problem 1: Single quotes wrapped around backticks and internal single quotes breaking JS
        // `'`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}`'` -> `(import.meta.env.VITE_API_BASE_URL || "http://localhost:5134")`
        // Wait, if it has a suffix:
        // `'`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}`/notificationHub'`
        // It should become:
        // `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}/notificationHub`
        
        // I will replace `'`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}`` with `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}`
        // and then we must remove the closing single quote.
        
        // A robust fix for: `'`${import...}`/something'`
        // Find: `'`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}`(.*?)(?:')`
        // Replace with: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}$1`
        
        // Example: `'`${import...}`'` -> `${import...}`
        // Example: `'`${import...}`/notificationHub',` -> `${import...}/notificationHub`,
        
        content = content.replace(/'`\$\{import\.meta\.env\.VITE_API_BASE_URL \|\| 'http:\/\/localhost:5134'\}`([^']*)'/g, "`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}$1`");

        // Same for double quotes wrapper if any, but they were mostly fixed by a previous step. This is a safety measure.
        content = content.replace(/"`\$\{import\.meta\.env\.VITE_API_BASE_URL \|\| 'http:\/\/localhost:5134'\}`([^"]*)"/g, "`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}$1`");

        // Also fix `CustomImageTourViewer.jsx` line 142 if it still has issues? The user mentioned "startColumn: 15, endColumn: 16".
        // Wait, let's also fix axiosPrivate.js where someone might have typed:
        // baseURL: '`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5134'}`'
        content = content.replace(/baseURL:\s*'([^']*)'/g, function(match, p1) {
            if (p1.includes('import.meta.env.VITE_API_BASE_URL')) {
                return `baseURL: (import.meta.env.VITE_API_BASE_URL || "http://localhost:5134")`;
            }
            return match;
        });

        if(content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            c++;
            console.log('Fixed quotes in:', filePath);
        }
    }
});
console.log('Total fixed quote files: ' + c);
