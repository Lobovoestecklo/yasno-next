export const getLSValue = (key: string) => {
    if (window && window.localStorage) {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    }
    return null;
}

export const setLSValue = (key: string, value: any) => {
    if (window && window.localStorage) {
        localStorage.setItem(key, JSON.stringify(value));
    }
}