// TypeScript Challenge: Utility Types
// Solution file: utility_types.ts (in same folder)

const challenge = {
    id: "ts-001",
    title: "TypeScript Utility Types Deep Dive",
    category: "typescript",
    categoryLabel: "TypeScript",
    difficulty: "advanced",
    dateAdded: "2024-02-11",

    learningObjectives: [
        "Built-in utility types",
        "Generic type constraints",
        "Conditional types"
    ],

    solutionFile: "utility_types.ts",
    language: "typescript",

    problem: `
        <h3>The Challenge</h3>
        <p>Master TypeScript's utility types by building a type-safe API response handler.</p>
        
        <h3>Requirements</h3>
        <ul>
            <li>Create types for API responses (success/error)</li>
            <li>Use <code>Pick</code>, <code>Omit</code>, <code>Partial</code></li>
            <li>Build a custom utility type for deep partial</li>
            <li>Implement type guards for narrowing</li>
        </ul>
        
        <h3>Example</h3>
        <pre><code>type DeepPartial&lt;T&gt; = T extends object
  ? { [P in keyof T]?: DeepPartial&lt;T[P]&gt; }
  : T;</code></pre>
    `,

    explanation: `
        <p><strong>Utility Types Explained:</strong></p>
        <ul>
            <li><strong>Pick&lt;T, K&gt;:</strong> Create type with only specified keys</li>
            <li><strong>Omit&lt;T, K&gt;:</strong> Create type without specified keys</li>
            <li><strong>Partial&lt;T&gt;:</strong> Make all properties optional</li>
            <li><strong>Required&lt;T&gt;:</strong> Make all properties required</li>
            <li><strong>DeepPartial:</strong> Custom type for nested partial updates</li>
        </ul>
        <p><strong>Type Guards:</strong> Functions that narrow types at runtime, enabling TypeScript to understand which branch you're in!</p>
    `
};

if (typeof window !== 'undefined') {
    window.__CHALLENGE__ = challenge;
}
