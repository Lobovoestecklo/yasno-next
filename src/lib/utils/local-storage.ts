export const getLSValue = (key: string) => {
    if (typeof window === 'undefined') {
        return null;
    }
    
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        console.error('Error getting localStorage value:', error);
        return null;
    }
}

export const setLSValue = (key: string, value: any) => {
    if (typeof window === 'undefined') {
        return;
    }
    
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error setting localStorage value:', error);
    }
}