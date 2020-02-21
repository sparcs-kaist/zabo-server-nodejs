export const EVENTS = ['REGISTER', 'GET_ZABO', 'SEARCH'];
export const EVENTS_MAP = EVENTS.reduce ((acc, cur) => ({ ...acc, [cur]: cur }), {});
export const RESERVED_ROUTES_USERNAME_EXCEPTIONS = ['auth', 'settings', 'admin', 'pins', 'main'];

export const ZABO_CATEGORIES = ['행사', '공연', '축제', '세미나', '교육', '모임', '이벤트', '공모전', '전시', '공지', '모집', '채용', '봉사', '오픈동방', '데모데이'];
export const GROUP_CATEGORIES = ['학생단체', '동아리', '학교 부서', '스타트업', '기업'];
export const GROUP_CATEGORIES_2 = ['과학생회', '자치단체', '총학생회', '생활문화', '예술', '음악', '종교사회', '체육', '학술', '창업'];
