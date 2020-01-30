export const CATEGORIES = ['recruit', 'seminar', 'contest', 'event', 'show', 'fair'];
export const EVENTS = ['REGISTER', 'GET_ZABO', 'SEARCH'];
export const EVENTS_MAP = EVENTS.reduce ((acc, cur) => ({ ...acc, [cur]: cur }), {});
export const RESERVED_ROUTES_USERNAME_EXCEPTIONS = ['auth', 'settings', 'admin'];
