// ===== UTILITY TYPES MASTERCLASS =====

// Base types
interface User {
    id: number;
    name: string;
    email: string;
    profile: {
        avatar: string;
        bio: string;
        settings: {
            theme: 'light' | 'dark';
            notifications: boolean;
        };
    };
}

// ===== BUILT-IN UTILITY TYPES =====

// Pick: Select specific properties
type UserPreview = Pick<User, 'id' | 'name'>;
// Result: { id: number; name: string; }

// Omit: Remove specific properties
type UserWithoutEmail = Omit<User, 'email'>;

// Partial: Make all properties optional
type PartialUser = Partial<User>;

// Required: Make all properties required
type RequiredUser = Required<PartialUser>;

// Readonly: Make all properties readonly
type ReadonlyUser = Readonly<User>;

// ===== CUSTOM UTILITY TYPE: DeepPartial =====
type DeepPartial<T> = T extends object
    ? { [P in keyof T]?: DeepPartial<T[P]> }
    : T;

// Now we can partially update nested objects!
type DeepPartialUser = DeepPartial<User>;

const updateUser = (id: number, updates: DeepPartialUser) => {
    // Can update any nested property
    console.log(`Updating user ${id}`, updates);
};

// Valid: partial nested update
updateUser(1, { profile: { settings: { theme: 'dark' } } });

// ===== API RESPONSE TYPES =====
type ApiSuccess<T> = {
    success: true;
    data: T;
    timestamp: number;
};

type ApiError = {
    success: false;
    error: {
        code: string;
        message: string;
    };
    timestamp: number;
};

type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ===== TYPE GUARDS =====
function isSuccess<T>(response: ApiResponse<T>): response is ApiSuccess<T> {
    return response.success === true;
}

function isError<T>(response: ApiResponse<T>): response is ApiError {
    return response.success === false;
}

// ===== USAGE =====
async function fetchUser(id: number): Promise<ApiResponse<User>> {
    // Simulated API call
    return {
        success: true,
        data: {
            id,
            name: 'John Doe',
            email: 'john@example.com',
            profile: {
                avatar: '/avatar.png',
                bio: 'Developer',
                settings: { theme: 'dark', notifications: true }
            }
        },
        timestamp: Date.now()
    };
}

async function main() {
    const response = await fetchUser(1);

    // Type narrowing with type guards
    if (isSuccess(response)) {
        // TypeScript knows: response.data is User
        console.log(`Welcome, ${response.data.name}!`);
        console.log(`Theme: ${response.data.profile.settings.theme}`);
    } else {
        // TypeScript knows: response.error exists
        console.error(`Error ${response.error.code}: ${response.error.message}`);
    }
}

main();
