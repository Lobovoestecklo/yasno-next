export const getLSValue = (key: string) => {
    if (!window || !window.localStorage) {
        throw new Error('Local storage is not available, switch to client');
    }
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
}

export const setLSValue = (key: string, value: any) => {
    if (!window || !window.localStorage) {
        throw new Error('Local storage is not available, switch to client');
    }
    localStorage.setItem(key, JSON.stringify(value));
}