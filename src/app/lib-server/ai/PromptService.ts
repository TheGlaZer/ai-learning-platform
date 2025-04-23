import { AIServiceOptions } from './AIService';

/**
 * Service for generating prompts for different AI tasks
 */
export class PromptService {
  /**
   * Creates a prompt for quiz generation
   */
  createQuizPrompt(
    fileContent: string, 
    topic: string, 
    numberOfQuestions: number,
    difficultyLevel: string,
    options?: AIServiceOptions,
    userComments?: string,
    selectedSubjectNames?: string[],
    previousQuestions?: string[]
  ): string {
    // Get language from options or default to English
    const language = options?.language || 'en';
    
    // Log the language being used for better debugging
    console.log(`Creating quiz prompt with language: ${language}`);
    
    // Check if we should include file references in explanations
    const includeFileReferences = options?.includeFileReferences !== false; // Default to true if not specified
    
    // Process file content to add line numbers if needed
    let processedContent = this.processContentWithLineNumbers(fileContent, includeFileReferences);
    
    // Construct base prompt
    let prompt = this.getBaseQuizPrompt(difficultyLevel, numberOfQuestions, topic, processedContent);
    
    // Add past exam content if provided
    if (options?.pastExamContent && options.includePastExam) {
      prompt += this.getPastExamSection(options.pastExamContent);
    }
    
    // Add previously generated questions section to avoid repetition
    if (previousQuestions && previousQuestions.length > 0) {
      prompt += this.getPreviousQuestionsSection(previousQuestions);
    }

    // Add difficulty-specific instructions
    prompt += this.getDifficultySpecificInstructions(difficultyLevel);

    // Add user comments if provided
    if (userComments && userComments.trim()) {
      prompt += this.getUserCommentsSection(userComments);
    }

    // Add selected subjects if provided
    if (selectedSubjectNames && selectedSubjectNames.length > 0) {
      prompt += this.getSelectedSubjectsSection(selectedSubjectNames);
    }

    // Add instructions for including file references if enabled
    if (includeFileReferences) {
      prompt += this.getFileReferencesInstructions();
    }

    // Add response format instructions
    prompt += this.getQuizResponseFormatInstructions(includeFileReferences);

    // Add language-specific instructions
    prompt += this.getLanguageSpecificInstructions(language);
    
    return prompt;
  }

  /**
   * Creates a prompt for subject extraction
   */
  createSubjectsPrompt(
    fileContent: string,
    options?: AIServiceOptions
  ): string {
    // Get language from options or default to auto-detection
    const language = options?.language || 'en';
    // Get existing subjects if provided
    const existingSubjects = options?.existingSubjects || [];
    // Get custom generation options
    const countRange = options?.countRange || 'medium';
    const specificity = options?.specificity || 'general';
    
    // Log the language being used for better debugging
    console.log(`Creating subjects prompt with language: ${language}`);
    console.log(`Custom options: countRange=${countRange}, specificity=${specificity}`);
    
    // Construct base prompt
    let prompt = this.getBaseSubjectsPrompt(fileContent, countRange, specificity);

    // Add existing subjects section if needed
    if (existingSubjects.length > 0) {
      prompt += this.getExistingSubjectsSection(existingSubjects);
    }

    // Add response format instructions
    prompt += this.getSubjectsResponseFormatInstructions(existingSubjects);

    // Add language-specific instructions
    prompt += this.getSubjectsLanguageInstructions(language);
    
    return prompt;
  }

  /**
   * Processes content to add line numbers if needed
   */
  private processContentWithLineNumbers(content: string, includeLineNumbers: boolean): string {
    if (!includeLineNumbers) {
      return content;
    }
    
    // Split the content by lines
    const lines = content.split('\n');
    
    // Variables to track current page and line number within page
    let currentPage = 1;
    let lineNumberInPage = 1;
    
    // Process each line, preserving page markers and adding line numbers
    const processedLines = lines.map((line, index) => {
      // Check if this is a page marker line
      if (line.trim().startsWith('------ PAGE:')) {
        // Extract the page number
        const pageMatch = line.match(/------ PAGE: (\d+) ----------/);
        if (pageMatch && pageMatch[1]) {
          currentPage = parseInt(pageMatch[1], 10);
          lineNumberInPage = 1; // Reset line counter for the new page
        }
        // Return the page marker line unchanged
        return line;
      } else {
        // Add line number to non-marker lines, including page info
        const result = `[PAGE:${currentPage}:LINE:${lineNumberInPage}] ${line}`;
        lineNumberInPage++; // Increment line counter within the current page
        return result;
      }
    });
    
    // Join the processed lines back together
    const processedContent = processedLines.join('\n');
    console.log('Added page-relative line numbers to content for file references');
    
    return processedContent;
  }

  /**
   * Gets the base quiz generation prompt
   */
  private getBaseQuizPrompt(difficultyLevel: string, numberOfQuestions: number, topic: string, content: string): string {
    return `
Generate a ${difficultyLevel} level quiz with ${numberOfQuestions} questions about ${topic} based on the following content:

IMPORTANT: The content below includes PAGE MARKERS in the format "------ PAGE: X ----------". Pay attention to these markers as you'll need to record which pages each question's content comes from.

${content}

CRITICAL REQUIREMENTS FOR QUESTION DIVERSITY:
- Each question MUST test a DIFFERENT concept or aspect of the content
- Questions should cover a wide range of material from throughout the content
- Create questions that are clearly distinct from each other in both concept and wording
- IMPORTANT: If creating questions in Hebrew/Arabic, ensure each question addresses a completely different topic

COGNITIVE LEVELS DISTRIBUTION:
- 25% of questions should test RECALL & UNDERSTANDING (basic facts, definitions, simple concepts)
- 50% of questions should test APPLICATION & ANALYSIS (applying concepts, comparing/contrasting, analyzing relationships)
- 25% of questions should test EVALUATION & SYNTHESIS (evaluating arguments, creating new ideas, integrating concepts)

QUESTION FORMAT DIVERSITY:
- Include at least one scenario-based question that applies theoretical concepts to a real-world situation
- Include at least one question that integrates multiple concepts from different parts of the material
- For technical/scientific content, include at least one question about methodology or process

COLLEGE-LEVEL REQUIREMENTS:
- Questions must reflect appropriate depth and rigor expected in higher education
- Use discipline-specific terminology where relevant
- Avoid trivia questions in favor of questions that test conceptual understanding

REQUIREMENTS FOR OPTIONS/ANSWERS:
- Correct answers must be unambiguously correct based only on the provided content
- Each incorrect option should be plausible and target specific misconceptions
- Options should be of similar length and grammatical structure to avoid giving hints
- For technical content, include options that represent common conceptual errors
`;
  }

  /**
   * Gets the section for previous questions to avoid repetition
   */
  private getPreviousQuestionsSection(previousQuestions: string[]): string {
    return `
CRITICAL INSTRUCTION - ABSOLUTE REQUIREMENT:
You MUST NOT repeat, rephrase, reword, or create variants of ANY of the following questions in ANY language.
This is especially important for non-Latin script languages like Hebrew, Arabic, etc.

Each new question MUST be completely different in both content and concept from these questions:
----------------------------------------------------
${previousQuestions.join('\n')}
----------------------------------------------------

IMPORTANT: 
1. The above questions are BANNED and cannot be used again
2. AI-generated quizzes with duplicated questions will be automatically rejected by the system
3. This is a hard requirement, not a suggestion
4. For Hebrew/Arabic text, pay special attention to the meaning, not just the exact words

`;
  }

  /**
   * Gets difficulty-specific instructions based on the level
   */
  private getDifficultySpecificInstructions(difficultyLevel: string): string {
    if (difficultyLevel === 'hard' || difficultyLevel === 'expert') {
      return `
IMPORTANT: For ${difficultyLevel} level questions:
- Create questions that are intentionally confusing or tricky
- Include subtle nuances in the wording that could lead to common mistakes
- Make the incorrect options plausible and closely related to the correct answer
- Ensure there is only ONE correct answer - the other three options must be definitively wrong
- Avoid creating situations where two options could be considered correct
- Focus on testing deep understanding rather than surface-level knowledge
- Create at least one question requiring synthesis of multiple concepts
- Include questions that test edge cases and exceptions to rules
`;
    } else if (difficultyLevel === 'medium') {
      return `
IMPORTANT: For medium difficulty questions:
- Questions should require understanding beyond mere memorization
- Incorrect options should be plausible but clearly wrong when analyzed
- Focus on application of concepts rather than just recognition
- Include questions that test ability to compare and contrast related concepts
- Test understanding of relationships between different ideas in the content
`;
    } else if (difficultyLevel === 'easy') {
      return `
IMPORTANT: For easy difficulty questions:
- Questions should test basic understanding and knowledge recall
- Options should be distinct from each other but all related to the topic
- Focus on fundamental concepts essential for building advanced knowledge
- Make questions clear and straightforward while still being educational
- Include questions that confirm mastery of prerequisite knowledge
`;
    }
    
    return ''; // Default empty string if no matching difficulty level
  }

  /**
   * Gets the section for user comments
   */
  private getUserCommentsSection(userComments: string): string {
    return `
HIGH PRIORITY INSTRUCTIONS FROM USER (GIVE THESE SPECIAL ATTENTION):
${userComments}

`;
  }

  /**
   * Gets the section for selected subjects
   */
  private getSelectedSubjectsSection(selectedSubjectNames: string[]): string {
    return `
FOCUS ON THESE SUBJECTS (GIVE THESE HIGH PRIORITY):
${selectedSubjectNames.join(', ')}

IMPORTANT REQUIREMENT FOR QUESTIONS:
- Each question MUST be related to ONE specific subject from the list above
- Distribute questions evenly across all selected subjects when possible
- Make sure each question clearly tests concepts that are unique to its related subject
- If a question covers multiple subjects, assign it to the MOST relevant subject

`;
  }

  /**
   * Gets instructions for file references
   */
  private getFileReferencesInstructions(): string {
    return `
IMPORTANT: For each question's explanation, include specific file references that point to where the answer can be found.
Look for the [PAGE:X:LINE:Y] markers in the content and include "Reference: Page X, Line Y" at the end of each explanation.
This helps students locate the relevant information in the original material.
For example: "Reference: Page 2, Line 42" or "References: Page 1, Lines 15-20".

`;
  }

  /**
   * Gets response format instructions for quizzes
   */
  private getQuizResponseFormatInstructions(includeFileReferences: boolean): string {
    return `
Format the quiz as a JSON object with the following structure:
{
  "title": "Quiz title related to the topic",
  "questions": [
    {
      "id": "1",
      "question": "Question text",
      "options": [
        {"id": "a", "text": "First option"},
        {"id": "b", "text": "Second option"},
        {"id": "c", "text": "Third option"},
        {"id": "d", "text": "Fourth option"}
      ],
      "correctAnswer": "a",
      "explanation": "Explanation of why this is the correct answer AND why the other options are incorrect${includeFileReferences ? '. Reference: Page X, Line Y' : ''}",
      "relatedSubject": "Name of the specific subject this question is testing",
      "pages": [1, 2], // Array of page numbers where this question's content appears
      "lines": { // Object mapping page numbers to arrays of line numbers
        "1": [42, 43],
        "2": [15, 16, 17]
      }
    }
  ]
}

IMPORTANT:
- NOTICE: The content has page markers in the format "------ PAGE: X ----------" and line markers in format [PAGE:X:LINE:Y].
- For each question, set the "pages" field to an array of page numbers where the question's content can be found.
- If a question spans multiple pages, include all relevant page numbers in the array.
- For each question, add a "lines" field as an object that maps page numbers to arrays of line numbers relevant on that page.
- Extract line numbers from the [PAGE:X:LINE:Y] markers for each reference.
- For each question, set the "relatedSubject" field to ONE specific subject name from the provided list of subjects
- The "relatedSubject" field is REQUIRED for every question
- Each question should test knowledge specific to its related subject
- Return ONLY the raw JSON object without any markdown formatting, code blocks, or explanations
- Do not include any \`\`\` markers, the word "json", or any other text
- The response must be pure, valid JSON that can be directly parsed

Make sure all questions are directly related to the content provided and all JSON is properly formatted with correct syntax.
`;
  }

  /**
   * Gets language-specific instructions for quizzes
   */
  private getLanguageSpecificInstructions(language: string): string {
    if (language === 'he') {
      return `
VERY IMPORTANT: Create the ENTIRE quiz in HEBREW LANGUAGE ONLY. 
All questions, answers, title, and explanations must be in Hebrew, with Hebrew characters, written right-to-left.
The quiz should feel natural to a native Hebrew speaker, with proper grammar and vocabulary.
DO NOT translate to English - generate native Hebrew content directly.
`;
    }
    
    return '\n';
  }

  /**
   * Gets the base prompt for subject extraction
   */
  private getBaseSubjectsPrompt(fileContent: string, countRange: string, specificity: string): string {
    // Determine the number of subjects to generate based on countRange
    let subjectCountText;
    switch(countRange) {
      case 'small':
        subjectCountText = '5-10';
        break;
      case 'medium':
        subjectCountText = '10-15';
        break;
      case 'large':
        subjectCountText = '15-20';
        break;
      default:
        subjectCountText = '10-15'; // Default to medium
    }
    
    // Determine the specificity instructions
    let specificityInstructions;
    if (specificity === 'specific') {
      specificityInstructions = `
When identifying subjects, focus on SPECIFIC, DETAILED topics rather than general categories.
Create narrowly defined subjects that delve into particular aspects or sub-areas of the content.
For example, instead of "Mathematics", use more specific subjects like "Linear Algebra", "Differential Calculus", or "Number Theory".
Each subject should cover a distinct, specific area of knowledge that could be taught as an individual lesson or topic.
`;
    } else {
      specificityInstructions = `
When identifying subjects, focus on GENERAL topics that provide a good high-level organization of the content.
Create broader subjects that encompass multiple related concepts under a common theme.
Avoid creating subjects that are too narrow or specific unless the content strongly indicates the need for such detail.
Each subject should represent a meaningful category that could organize multiple lessons or sub-topics.
`;
    }
    
    return `
You are an AI educational assistant tasked with analyzing learning material and organizing it into logical subjects.

Analyze the following content and identify the main subjects or topics covered:

${fileContent}

First, look for any explicit headings, chapter titles, or section markers that might indicate subject divisions.
If such structural elements exist, use them as the primary basis for subject identification.

If no clear structure exists, analyze the content and identify ${subjectCountText} distinct subjects based on the following criteria:
1. Topics that are significantly different from each other
2. Topics that have enough content to stand as their own subject
3. Topics that form a logical progression or organization of the material
4. Consider the core concepts that a student would need to master to understand the material

${specificityInstructions}`;
  }

  /**
   * Gets the section for existing subjects to avoid duplication
   */
  private getExistingSubjectsSection(existingSubjects: any[]): string {
    return `

IMPORTANT: The following subjects ALREADY EXIST in the course. DO NOT include these in your response, only generate NEW subjects that are not in this list:
${existingSubjects.map(subject => `- ${subject.name}`).join('\n')}

CRITICAL INSTRUCTIONS FOR AVOIDING SIMILAR OR DUPLICATE SUBJECTS:
1. Do NOT generate subjects that are semantically similar to existing ones, even if worded differently
2. Do NOT generate subjects that are just variations or rephrased versions of existing subjects
3. Do NOT generate subjects that are more specific subsets of existing subjects (e.g., if "Mathematics" exists, don't create "Advanced Mathematics")
4. Do NOT generate subjects that are more general versions of existing subjects (e.g., if "Linear Algebra" exists, don't create "Algebra")
5. Do NOT generate subjects that combine existing subjects with minor additions
6. If you have any doubt about whether a subject is too similar to an existing one, DO NOT include it

IMPORTANT CRITERIA FOR NEW SUBJECTS:
1. New subjects must be COMPLETELY DISTINCT in meaning and scope from all existing subjects
2. New subjects should cover entirely different knowledge areas or topics
3. If all potential subjects from the content are already covered in the existing list, return an empty array []

CRITICAL INSTRUCTION FOR HANDLING DIFFERENT TOPIC AREAS:
1. If the content covers topics in a COMPLETELY DIFFERENT DOMAIN from the existing subjects, that's perfectly fine.
2. Please generate appropriate subjects for that new domain or topic area.
3. The new subjects do NOT need to be related to the existing ones - they just should not duplicate them.

SPECIAL CASE - COMPLETELY UNRELATED CONTENT:
If you determine that the content is completely unrelated to educational purposes or cannot be organized into meaningful academic subjects:
- Instead of returning an empty array, return a special JSON structure:
[{ "status": "unrelated_content", "message": "The provided content appears unrelated to the existing academic subjects. Please provide educational content with clear topics that can be organized into meaningful subjects." }]

ONLY return an empty array [] if you can identify subjects but they ALL already exist in the list above or are too similar to existing subjects.`;
  }

  /**
   * Gets response format instructions for subjects
   */
  private getSubjectsResponseFormatInstructions(existingSubjects: any[]): string {
    let instructions = `

For each subject:
- Create a clear, concise title that accurately represents the topic
- Focus on educational value and learning progression
- Make sure each name is specific enough to distinguish between different subjects

Format your response as a JSON array of subject names with the following structure:
[
  {
    "name": "Subject Title"
  },
  {
    "name": "Another Subject Title"
  }
]`;

    // If there are existing subjects, reinforce the instruction
    if (existingSubjects.length > 0) {
      instructions += `

REMEMBER: Only include NEW subjects that are COMPLETELY DISTINCT from the existing ones.
DO NOT include subjects that are similar in meaning, scope, or intent to any existing subjects.
It is BETTER to return fewer subjects or an empty array than to include similar or duplicate subjects.
If you're unsure whether a subject is distinct enough, DO NOT include it.`;
    }

    instructions += `

IMPORTANT: Return ONLY the raw JSON array without any markdown formatting, code blocks, or explanations. Do not include any \`\`\` markers, the word "json", or any other text. The response must be pure, valid JSON that can be directly parsed.
`;

    return instructions;
  }

  /**
   * Gets language-specific instructions for subjects
   */
  private getSubjectsLanguageInstructions(language: string): string {
    if (language === 'he') {
      return `
VERY IMPORTANT: Create ALL the subjects in HEBREW LANGUAGE ONLY. 
This is absolutely critical - the response MUST be in HEBREW, not English.
The response must be in Hebrew, with Hebrew characters, written right-to-left. 
Make sure the subject names are grammatically correct in Hebrew and culturally appropriate.
DO NOT translate to English - generate native Hebrew subject names directly.
NEVER output English text in the results - ONLY Hebrew is acceptable.

Example of correctly formatted Hebrew subjects:
[
  {
    "name": "מבנה נתונים"
  },
  {
    "name": "אלגוריתמים"
  }
]

Check each subject name to ensure it is written in Hebrew before including it in your response.
`;
    }
    
    return `
Create the subjects in English language.
`;
  }

  /**
   * Gets the section for past exam content to be referenced
   */
  private getPastExamSection(pastExamContent: string): string {
    return `
**IMPORTANT - PAST EXAM REFERENCE:**
The following content is from a past exam. You MUST analyze it carefully and create questions that follow a similar pattern, style, and difficulty level.

**PAST EXAM CONTENT:**
${pastExamContent}

**CRITICAL INSTRUCTIONS FOR PAST EXAM ADAPTATION:**
1. Study the question patterns, style, and formatting in the past exam
2. Match the cognitive difficulty level of questions
3. Create questions that test similar concepts but are not direct copies
4. Follow the same question structure and complexity
5. Use the material from the main content to create questions that would fit seamlessly into the past exam
6. This is a HIGH PRIORITY instruction - the quiz MUST resemble the past exam in style and approach

`;
  }
}

export default new PromptService(); 