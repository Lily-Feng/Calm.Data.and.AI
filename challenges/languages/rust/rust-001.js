// Rust Challenge: Ownership Basics
// Solution file: ownership_basics.rs (in same folder)
//
// 🦀 ABOUT RUST:
// Rust is a systems programming language focused on safety, speed, and concurrency.
// It achieves memory safety WITHOUT a garbage collector through its unique
// "ownership" system - checked at compile time, zero runtime cost.
// 
// Rust is best for: CLI tools, WebAssembly, embedded systems, game engines,
// operating systems, and anywhere you need C/C++ performance with safety.

const challenge = {
    id: "rust-001",
    title: "Rust Ownership - Memory Safety Without GC",
    category: "rust",
    categoryLabel: "Rust",
    difficulty: "beginner",
    dateAdded: "2024-02-12",

    learningObjectives: [
        "Ownership rules",
        "Borrowing and references",
        "The borrow checker"
    ],

    solutionFile: "ownership_basics.rs",
    language: "rust",

    problem: `
        <h3>🦀 What is Rust?</h3>
        <p>Rust is a systems programming language that guarantees <strong>memory safety without garbage collection</strong>. 
        It achieves this through its unique <strong>ownership system</strong>, checked at compile time with zero runtime cost.</p>
        
        <p><strong>Rust is best for:</strong> CLI tools, WebAssembly, embedded systems, game engines, OS kernels, 
        and anywhere you need C++ performance with safety guarantees.</p>
        
        <h3>The Challenge</h3>
        <p>Understand Rust's ownership rules by fixing common ownership errors.</p>
        
        <h3>The Three Rules of Ownership</h3>
        <ol>
            <li>Each value has an <strong>owner</strong></li>
            <li>There can only be <strong>one owner</strong> at a time</li>
            <li>When the owner goes out of scope, the value is <strong>dropped</strong></li>
        </ol>
        
        <h3>Your Task</h3>
        <p>Study the solution to understand:</p>
        <ul>
            <li>How ownership transfers (moves)</li>
            <li>How to borrow with <code>&</code> (immutable) and <code>&mut</code> (mutable)</li>
            <li>Why this prevents memory bugs at compile time!</li>
        </ul>
    `,

    explanation: `
        <p><strong>Why Ownership Matters:</strong></p>
        <ul>
            <li><strong>No Garbage Collector:</strong> Memory is freed automatically when owner goes out of scope</li>
            <li><strong>No Null Pointers:</strong> Rust doesn't have null - uses <code>Option&lt;T&gt;</code> instead</li>
            <li><strong>No Data Races:</strong> Borrow checker prevents concurrent mutable access</li>
            <li><strong>Zero Cost:</strong> All checks happen at compile time, not runtime</li>
        </ul>
        
        <p><strong>Key Takeaway:</strong> In Rust, the compiler is your friend. If it compiles, you've eliminated 
        entire classes of bugs that plague C/C++ programs!</p>
        
        <p><strong>Common Pattern:</strong> When you need to use a value without taking ownership, 
        <em>borrow</em> it with <code>&</code>. The original owner keeps the value.</p>
    `
};

if (typeof window !== 'undefined') {
    window.__CHALLENGE__ = challenge;
}
