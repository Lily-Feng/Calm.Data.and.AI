import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to sync state with localStorage
 * @param key - The localStorage key
 * @param initialValue - Default value if nothing in storage
 */
function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {

    // Get initial value from localStorage or use default
    const getStoredValue = useCallback((): T => {
        if (typeof window === 'undefined') {
            return initialValue; // SSR safety
        }

        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    }, [key, initialValue]);

    const [storedValue, setStoredValue] = useState<T>(getStoredValue);

    // Update localStorage when value changes
    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            window.localStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    // Listen for changes in other tabs/windows
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key && e.newValue !== null) {
                setStoredValue(JSON.parse(e.newValue));
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key]);

    return [storedValue, setStoredValue];
}

// ===== USAGE EXAMPLE =====
function App() {
    const [name, setName] = useLocalStorage('user-name', '');
    const [theme, setTheme] = useLocalStorage('theme', 'light');
    const [todos, setTodos] = useLocalStorage<string[]>('todos', []);

    return (
        <div className={`app ${theme}`}>
            <h1>Hello, {name || 'Guest'}!</h1>

            <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
            />

            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                Toggle Theme ({theme})
            </button>

            <button onClick={() => setTodos([...todos, `Todo ${todos.length + 1}`])}>
                Add Todo ({todos.length} items)
            </button>
        </div>
    );
}

export { useLocalStorage };
export default App;
