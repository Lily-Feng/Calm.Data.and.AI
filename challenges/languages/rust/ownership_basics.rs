// Rust Ownership Basics
// Run with: rustc ownership_basics.rs && ./ownership_basics
// Or: cargo run (if using Cargo)

fn main() {
    println!("🦀 Rust Ownership Demo\n");
    
    // ===== RULE 1: Each value has an owner =====
    let s1 = String::from("hello");  // s1 owns this String
    println!("s1 = {}", s1);
    
    // ===== RULE 2: Only one owner at a time (Move) =====
    let s2 = s1;  // Ownership MOVES from s1 to s2
    // println!("{}", s1);  // ❌ ERROR! s1 no longer valid
    println!("s2 = {} (s1 was moved here)\n", s2);
    
    // ===== BORROWING: Use without taking ownership =====
    let s3 = String::from("world");
    
    // Immutable borrow with &
    print_length(&s3);  // Borrow s3, don't take ownership
    println!("s3 is still valid: {}\n", s3);  // ✅ s3 still works!
    
    // Mutable borrow with &mut
    let mut s4 = String::from("hello");
    println!("Before: {}", s4);
    add_world(&mut s4);  // Mutable borrow
    println!("After:  {}\n", s4);
    
    // ===== RULE 3: Value dropped when owner goes out of scope =====
    {
        let s5 = String::from("temporary");
        println!("s5 exists here: {}", s5);
    }  // s5 goes out of scope, memory is freed automatically!
    // println!("{}", s5);  // ❌ ERROR! s5 no longer exists
    
    println!("\n✅ No memory leaks, no dangling pointers, no data races!");
    println!("   All checked at compile time with zero runtime cost.");
}

// Function that BORROWS a String (doesn't take ownership)
fn print_length(s: &String) {
    println!("Length of '{}' is {}", s, s.len());
}  // s goes out of scope, but since it's a reference, nothing is dropped

// Function that MUTABLY borrows a String
fn add_world(s: &mut String) {
    s.push_str(", world!");
}

// ===== COMPARISON WITH OTHER LANGUAGES =====
// 
// C/C++: Manual memory management
//   - malloc/free, new/delete
//   - Easy to forget, causing memory leaks
//   - Easy to use-after-free, causing crashes
//
// Java/Python/Go: Garbage Collection
//   - Automatic but has runtime cost
//   - Stop-the-world pauses
//   - Higher memory usage
//
// Rust: Ownership System
//   - Automatic AND zero-cost (compile-time checks)
//   - No GC pauses
//   - Memory freed exactly when no longer needed
//   - Compiler prevents bugs before they happen!
