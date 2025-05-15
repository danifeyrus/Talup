export const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const isValidPassword = (password: string) =>
    password.length >= 6 && password.length <= 24 && !/\s/.test(password);

export const isValidLogin = (login: string) =>
    /^[a-zA-Z0-9._-]{3,20}$/.test(login);

export const isValidName = (name: string) =>
    /^[A-Za-zА-Яа-яЁё\s\-']{2,20}$/.test(name.trim());

export const formatName = (name: string) =>
    name
        .split(/[\s\-]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");

export const isLeapYear = (year: number) =>
    (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

export const isValidDate = (day: string, month: string, year: string) => {
    if (!day || !month || !year) return false;

    const intDay = parseInt(day, 10);
    const intMonth = parseInt(month, 10);
    const intYear = parseInt(year, 10);

    if (intYear < 1900 || intYear > new Date().getFullYear()) return false;
    if (intMonth < 1 || intMonth > 12) return false;

    const daysInMonth = [31, isLeapYear(intYear) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (intDay < 1 || intDay > daysInMonth[intMonth - 1]) return false;

    return true;
};