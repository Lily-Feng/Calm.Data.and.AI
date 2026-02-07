// React Challenge: useLocalStorage Hook
// Solution file: useLocalStorage.tsx (in same folder)

const challenge = {
    id: "react-001",
    title: "Custom React Hook - useLocalStorage",
    category: "react",
    categoryLabel: "React",
    difficulty: "intermediate",
    dateAdded: "2024-02-10",

    learningObjectives: [
        "Custom hooks pattern",
        "useState and useEffect",
        "Browser localStorage API"
    ],

    solutionFile: "useLocalStorage.tsx",
    language: "typescript",

    problem: `
        <h3>The Challenge</h3>
        <p>Create a custom React hook that syncs state with localStorage, persisting data across page reloads.</p>
        
        <h3>Requirements</h3>
        <ul>
            <li>Hook signature: <code>useLocalStorage(key, initialValue)</code></li>
            <li>Return <code>[value, setValue]</code> like useState</li>
            <li>Automatically sync to localStorage on changes</li>
            <li>Handle JSON serialization/deserialization</li>
            <li>Handle SSR (server-side rendering) gracefully</li>
        </ul>
        
        <h3>Example Usage</h3>
        <pre><code>const [name, setName] = useLocalStorage('user-name', '');
const [theme, setTheme] = useLocalStorage('theme', 'light');</code></pre>
    `,

    explanation: `
        <p><strong>Custom Hooks Pattern:</strong></p>
        <ul>
            <li><strong>Naming:</strong> Always start with "use" - required by React's rules of hooks</li>
            <li><strong>Composition:</strong> Custom hooks can call other hooks (useState, useEffect, etc.)</li>
            <li><strong>Reusability:</strong> Encapsulate logic once, use anywhere in your app</li>
        </ul>
        <p><strong>Key Features in This Hook:</strong></p>
        <ul>
            <li><strong>TypeScript Generics:</strong> Works with any serializable type</li>
            <li><strong>SSR Safety:</strong> Checks for <code>window</code> before accessing localStorage</li>
            <li><strong>Cross-Tab Sync:</strong> Listens to storage events for changes in other tabs</li>
        </ul>
    `
};

if (typeof window !== 'undefined') {
    window.__CHALLENGE__ = challenge;
}
