/**
 * Security validation service for server-side validation
 */

/**
 * Validates user instructions for potential security threats
 * 
 * @param input User input to validate
 * @returns A validation result object
 */
export const validateUserInstructions = (input?: string): { valid: boolean; message?: string } => {
  if (!input || !input.trim()) return { valid: true };

  // Convert to lowercase for case-insensitive checks
  const lowercaseInput = input.toLowerCase();

  // Check for code patterns, script tags, suspicious commands
  const securityPatterns = [
    // Script tags and executable code
    /<script.*?>.*?<\/script>/i,
    /<\/?script>/i,
    /eval\s*\(/i,
    /exec\s*\(/i,
    /function\s*\(/i,
    /setTimeout\s*\(/i,
    /setInterval\s*\(/i,
    
    // SQL injection patterns
    /'\s*OR\s*'1'\s*=\s*'1/i,
    /'\s*;\s*DROP\s+TABLE/i,
    /'\s*;\s*DELETE\s+FROM/i,
    /'\s*;\s*INSERT\s+INTO/i,
    
    // Shell commands
    /\bexec\s*\(/i,
    /\bshell\s*\./i,
    /\brm\s+-rf/i,
    /\bdel\s+\/[a-z]/i,
    /\bformat\s+[a-z]:/i,
    
    // Common exploit patterns
    /\bnewFunction\s*\(/i,
    /\bObject\s*\.\s*constructor\s*\.\s*constructor/i,
    /\b(fetch|import|require)\s*\(/i,
    /\bprocess\s*\.\s*env/i,
    /\bdocument\s*\.\s*(write|cookie)/i,
    /\bwindow\s*\.\s*(location|open)/i
  ];

  // Check for potentially harmful keywords
  const harmfulKeywords = [
    'hack', 'exploit', 'bypass', 'inject', 'malicious', 
    'vulnerability', 'attack', 'trojan', 'virus', 'worm',
    'backdoor', 'rootkit', 'keylogger', 'ransomware',
    'ssh', 'sudo', 'chmod', 'chown', 'passwd', 'token',
    'firebase', 'api key', 'secret key', 'password', 
    'authorization', 'bearer', 'credential'
  ];

  // Check for code language markers
  const codeMarkers = [
    '```js', '```javascript', '```php', '```python', '```ruby', '```bash',
    '```sh', '```sql', '```java', '```c', '```cpp', '```csharp', '```go'
  ];

  // Check patterns
  for (const pattern of securityPatterns) {
    if (pattern.test(input)) {
      return {
        valid: false,
        message: 'Instructions contain potentially unsafe code patterns.'
      };
    }
  }

  // Check for code markers
  for (const marker of codeMarkers) {
    if (lowercaseInput.includes(marker)) {
      return {
        valid: false,
        message: 'Instructions should not contain code blocks.'
      };
    }
  }

  // Check for harmful keywords - be more careful here as these might be legitimate in educational contexts
  let suspiciousKeywordCount = 0;
  for (const keyword of harmfulKeywords) {
    if (lowercaseInput.includes(keyword)) {
      suspiciousKeywordCount++;
    }
  }

  // If multiple suspicious keywords are found together, that's more likely to be problematic
  if (suspiciousKeywordCount >= 3) {
    return {
      valid: false,
      message: 'Instructions contain multiple suspicious security-related terms.'
    };
  }

  // Limit length of instructions to prevent excessive input
  if (input.length > 1000) {
    return {
      valid: false,
      message: 'Instructions are too long. Please limit to 1000 characters.'
    };
  }

  return { valid: true };
}; 