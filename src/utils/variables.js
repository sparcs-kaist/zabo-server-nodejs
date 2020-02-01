export const TAGS = ['#동아리', '#모집', '#강연', '#대회', '#행사', '#공연', '#박람회'];
export const EVENTS = ['REGISTER', 'GET_ZABO', 'SEARCH'];
export const EVENTS_MAP = EVENTS.reduce ((acc, cur) => ({ ...acc, [cur]: cur }), {});
export const RESERVED_ROUTES_USERNAME_EXCEPTIONS = ['auth', 'settings', 'admin', 'pins', 'main'];
