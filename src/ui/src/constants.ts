const hostname = window && window.location.origin;

export const BASE_URL = hostname.includes('localhost') ? `${hostname.split(':')[0]}:${hostname.split(':')[1]}:5000` : hostname;
